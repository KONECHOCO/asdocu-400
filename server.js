// ASDOCU 400 Studio - Backend REST API & IBM i AS/400 Connector Server
// Allows external programs (RPGLE, COBOL, C#, Python, cURL, ERP) to generate PDFs on-demand

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

import { SpoolEngine } from './src/services/spool-engine.js';
import { PdfGenerator } from './src/services/pdf-generator.js';
import { getTemplateFattura, getTemplateDDT } from './src/services/templates.js';
import { SAMPLE_SPOOL_FATTURA, SAMPLE_SPOOL_DDT, SAMPLE_SPOOL_ORDINE } from './src/data/sample-spools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// IBM i AS/400 In-Memory / Simulated Output Queue Service
// In production, this bridges with JT400 / QSYS2.SPOOLED_FILE_DATA / SSH / FTP
let as400ConnectionConfig = {
  host: '192.168.1.100',
  port: 8471,
  user: 'QUSER',
  library: 'QGPL',
  outq: 'PRT01',
  protocol: 'sql_services', // 'sql_services', 'ssh_cpysplf', 'ftp_spool'
  connected: true,
  lastPing: new Date().toISOString()
};

// Simulated Active Spooled Files in IBM i Output Queue
let activeSpoolQueue = [
  {
    id: 'SPL008492',
    name: 'QPRINT',
    user: 'REBICI',
    jobName: 'FATTURA_JOB',
    jobNumber: '109284',
    spoolNumber: 1,
    pages: 2,
    date: '2026-10-26 14:32:00',
    status: 'RDY', // RDY (Pronto), HLD (Trattenuto), SAV (Salvato)
    outq: 'PRT01',
    library: 'QGPL',
    sizeKb: 14.8,
    docType: 'fattura',
    content: SAMPLE_SPOOL_FATTURA
  },
  {
    id: 'SPL004912',
    name: 'QDDT',
    user: 'LOGISTIC',
    jobName: 'DDT_EXP',
    jobNumber: '109312',
    spoolNumber: 2,
    pages: 1,
    date: '2026-10-27 09:15:22',
    status: 'RDY',
    outq: 'PRT01',
    library: 'QGPL',
    sizeKb: 8.5,
    docType: 'ddt',
    content: SAMPLE_SPOOL_DDT
  },
  {
    id: 'SPL011029',
    name: 'QORD',
    user: 'ACQUIS',
    jobName: 'ORD_PROC',
    jobNumber: '109405',
    spoolNumber: 1,
    pages: 1,
    date: '2026-10-27 16:45:10',
    status: 'SAV',
    outq: 'PRT01',
    library: 'QGPL',
    sizeKb: 6.2,
    docType: 'ordine',
    content: SAMPLE_SPOOL_ORDINE
  }
];

// --------------------------------------------------------------------------
// 1. Health & Server Info
// --------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ASDOCU 400 Studio API Gateway',
    version: '1.2.0',
    as400Host: as400ConnectionConfig.host,
    outq: `${as400ConnectionConfig.library}/${as400ConnectionConfig.outq}`,
    activeSpoolsCount: activeSpoolQueue.length
  });
});

// --------------------------------------------------------------------------
// 2. IBM i AS/400 Connection Hub Endpoints
// --------------------------------------------------------------------------
app.get('/api/as400/status', (req, res) => {
  res.json({
    config: as400ConnectionConfig,
    activeSpoolsCount: activeSpoolQueue.length
  });
});

app.post('/api/as400/connect', (req, res) => {
  const { host, port, user, password, library, outq, protocol } = req.body;

  if (host) as400ConnectionConfig.host = host;
  if (port) as400ConnectionConfig.port = parseInt(port, 10);
  if (user) as400ConnectionConfig.user = user;
  if (library) as400ConnectionConfig.library = library;
  if (outq) as400ConnectionConfig.outq = outq;
  if (protocol) as400ConnectionConfig.protocol = protocol;

  as400ConnectionConfig.connected = true;
  as400ConnectionConfig.lastPing = new Date().toISOString();

  // Return connection handshake diagnosis
  res.json({
    success: true,
    message: `Connessione stabilita con successo a IBM i (${as400ConnectionConfig.host}:${as400ConnectionConfig.port})`,
    details: {
      serverOS: 'IBM i 7.4 (OS/400)',
      partition: 'PRD-SYS1',
      library: as400ConnectionConfig.library,
      outq: as400ConnectionConfig.outq,
      protocol: as400ConnectionConfig.protocol,
      handshakeLatencyMs: 18,
      spoolsReady: activeSpoolQueue.filter(s => s.status === 'RDY').length
    }
  });
});

app.get('/api/as400/spools', (req, res) => {
  const { outq, status } = req.query;
  let spools = activeSpoolQueue;

  if (outq) {
    spools = spools.filter(s => s.outq.toUpperCase() === outq.toUpperCase());
  }
  if (status) {
    spools = spools.filter(s => s.status.toUpperCase() === status.toUpperCase());
  }

  res.json({
    success: true,
    outq: as400ConnectionConfig.outq,
    library: as400ConnectionConfig.library,
    total: spools.length,
    spools: spools.map(s => ({
      id: s.id,
      name: s.name,
      user: s.user,
      jobName: s.jobName,
      jobNumber: s.jobNumber,
      spoolNumber: s.spoolNumber,
      pages: s.pages,
      date: s.date,
      status: s.status,
      sizeKb: s.sizeKb,
      docType: s.docType
    }))
  });
});

app.get('/api/as400/spool/:id', (req, res) => {
  const item = activeSpoolQueue.find(s => s.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Spool non trovato su AS/400' });
  }

  res.json({
    success: true,
    spool: item
  });
});

// --------------------------------------------------------------------------
// 3. CORE PRINT & PDF GENERATION API FOR EXTERNAL PROGRAMS (RPGLE, C#, PYTHON, CURL)
// --------------------------------------------------------------------------
/**
 * POST /api/render-pdf
 * Body:
 * {
 *    template: "fattura" | "ddt" | { customTemplateObject },
 *    spoolId?: "SPL008492",
 *    spoolText?: "raw spool lines...",
 *    jsonData?: { ... },
 *    output: "download" | "base64" | "file" | "stream",
 *    filename?: "fattura_123.pdf",
 *    targetFolder?: "./output_pdf"
 * }
 */
app.post('/api/render-pdf', async (req, res) => {
  try {
    const { template, spoolId, spoolText, jsonData, output = 'download', filename = 'documento_as400.pdf' } = req.body;

    // 1. Resolve Template
    let reportTemplate;
    if (typeof template === 'string') {
      if (template.toLowerCase().includes('ddt')) {
        reportTemplate = getTemplateDDT();
      } else {
        reportTemplate = getTemplateFattura();
      }
    } else if (typeof template === 'object' && template.sections) {
      reportTemplate = template;
    } else {
      reportTemplate = getTemplateFattura();
    }

    // 2. Resolve Spool Content
    let rawSpool = spoolText || '';
    if (!rawSpool && spoolId) {
      const found = activeSpoolQueue.find(s => s.id === spoolId);
      if (found) rawSpool = found.content;
    }
    if (!rawSpool) {
      rawSpool = SAMPLE_SPOOL_FATTURA;
    }

    // 3. Compile PDF using SpoolEngine and PdfGenerator
    const spoolEngine = new SpoolEngine(rawSpool);
    const dataContext = {
      spoolEngine,
      jsonData: jsonData || null
    };

    // Node-environment compatibility: define dummy DOM canvas or use jsPDF native
    const doc = await renderPdfInNode(reportTemplate, dataContext);
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // 4. Handle requested output mode
    if (output === 'base64') {
      return res.json({
        success: true,
        filename,
        sizeBytes: pdfBuffer.length,
        base64: pdfBuffer.toString('base64')
      });
    }

    if (output === 'file') {
      const outDir = path.join(__dirname, 'output_pdf');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      const outPath = path.join(outDir, filename);
      fs.writeFileSync(outPath, pdfBuffer);
      return res.json({
        success: true,
        message: 'PDF salvato con successo sul server',
        filePath: outPath,
        sizeBytes: pdfBuffer.length
      });
    }

    // Default: stream binary file with proper PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    console.error('API render-pdf error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Helper for rendering PDF in Node environment
async function renderPdfInNode(report, dataContext) {
  const orientation = report.page.orientation || 'portrait';
  const format = report.page.format || 'a4';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margins = {
    top: report.page.marginTopMm || 10,
    bottom: report.page.marginBottomMm || 10,
    left: report.page.marginLeftMm || 10,
    right: report.page.marginRightMm || 10
  };

  let currentY = margins.top;

  // 1. Report Header
  if (report.sections.reportHeader && report.sections.reportHeader.visible) {
    renderSimpleSectionElements(doc, report.sections.reportHeader, currentY, dataContext);
    currentY += report.sections.reportHeader.heightMm;
  }

  // 2. Page Header
  const pageHeaderSection = report.sections.pageHeader;
  if (pageHeaderSection && pageHeaderSection.visible) {
    renderSimpleSectionElements(doc, pageHeaderSection, currentY, dataContext);
    currentY += pageHeaderSection.heightMm;
  }

  // 3. Detail
  const detailSection = report.sections.detail;
  if (detailSection && detailSection.visible) {
    const tableElem = detailSection.elements.find(el => el.type === 'table');
    if (tableElem && tableElem.tableConfig) {
      const headers = tableElem.tableConfig.columns.map(c => c.title);
      const extracted = dataContext.spoolEngine.extractTable(
        tableElem.tableConfig.spoolStartRow || 1,
        tableElem.tableConfig.spoolEndRow || 30,
        tableElem.tableConfig.columns
      );

      const rows = extracted.map(row => {
        return tableElem.tableConfig.columns.map(col => {
          const key = col.jsonKey || col.id;
          return row[key] !== undefined ? String(row[key]) : '';
        });
      });

      autoTable(doc, {
        startY: currentY + 2,
        margin: { left: tableElem.xMm || margins.left, right: margins.right },
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: '#1e3a8a',
          textColor: '#ffffff',
          fontSize: 8.5
        },
        bodyStyles: {
          fontSize: 8
        }
      });

      currentY = doc.lastAutoTable.finalY + 4;
    }
  }

  // 4. Report Footer
  const reportFooterSection = report.sections.reportFooter;
  if (reportFooterSection && reportFooterSection.visible) {
    renderSimpleSectionElements(doc, reportFooterSection, currentY, dataContext);
  }

  // 5. Page Footer
  const pageFooterSection = report.sections.pageFooter;
  if (pageFooterSection && pageFooterSection.visible) {
    const footerY = pageHeight - margins.bottom - pageFooterSection.heightMm;
    renderSimpleSectionElements(doc, pageFooterSection, footerY, dataContext);
  }

  return doc;
}

function renderSimpleSectionElements(doc, section, sectionBaseY, dataContext) {
  if (!section.elements) return;

  for (const el of section.elements) {
    const x = el.xMm;
    const y = sectionBaseY + el.yMm;
    const w = el.widthMm;
    const h = el.heightMm;

    if (el.type === 'box') {
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, w, h);
    } else if (el.type === 'line') {
      doc.setDrawColor(59, 130, 246);
      doc.line(x, y, x + w, y);
    } else if (el.type === 'label' || el.type === 'field' || el.type === 'pagenum') {
      let text = '';
      if (el.binding?.source === 'spool' && dataContext.spoolEngine) {
        text = dataContext.spoolEngine.extractValue(el.binding.spoolRow, el.binding.spoolColStart, el.binding.spoolColEnd);
      } else {
        text = el.binding?.staticValue || el.name || '';
      }

      doc.setFontSize(el.style?.fontSizePt || 9);
      if (el.style?.fontWeight === 'bold') doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');

      doc.setTextColor(30, 41, 59);
      doc.text(String(text), x, y + 4);
    }
  }
}

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ASDOCU 400 Studio - API Server & AS/400 Connector`);
  console.log(`📡 Endpoint API: http://localhost:${PORT}/api`);
  console.log(`📄 Generazione PDF: POST http://localhost:${PORT}/api/render-pdf`);
  console.log(`📟 Coda Stampa IBM i: GET http://localhost:${PORT}/api/as400/spools`);
  console.log(`=======================================================`);
});
