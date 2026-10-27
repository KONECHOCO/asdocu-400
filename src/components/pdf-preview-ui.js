// Live PDF Preview and Export Component
import { PdfGenerator } from '../services/pdf-generator.js';

export class PdfPreviewUI {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.report = options.report;
    this.spoolEngine = options.spoolEngine;
    this.jsonData = options.jsonData;
    this.pdfBlobUrl = null;
    this.currentDoc = null;
    this.isRendering = false;

    this.render();
  }

  updateData(report, spoolEngine, jsonData) {
    if (report) this.report = report;
    if (spoolEngine) this.spoolEngine = spoolEngine;
    if (jsonData) this.jsonData = jsonData;
    this.generatePdf();
  }

  render() {
    this.container.innerHTML = `
      <div class="pdf-station-container">
        <!-- PDF Header Toolbar -->
        <div class="pdf-toolbar">
          <div class="pdf-toolbar-left">
            <button class="pdf-action-btn primary" id="btn_refresh_pdf">
              <span class="btn-icon">⚡</span> Aggiorna Anteprima
            </button>
            <button class="pdf-action-btn success" id="btn_download_pdf">
              <span class="btn-icon">📥</span> Scarica PDF Vettoriale
            </button>
            <button class="pdf-action-btn" id="btn_print_pdf">
              <span class="btn-icon">🖨️</span> Stampa
            </button>
          </div>

          <div class="pdf-toolbar-right">
            <span class="pdf-status-badge" id="pdfStatusBadge">Pronto</span>
            <span class="pdf-meta-info" id="pdfMetaInfo">--</span>
          </div>
        </div>

        <!-- PDF Viewer Area -->
        <div class="pdf-viewer-wrapper">
          <div class="pdf-loading-overlay" id="pdfLoadingOverlay" style="display: none;">
            <div class="spinner"></div>
            <span>Generazione PDF in corso con jsPDF & ASDOCU Engine...</span>
          </div>
          <iframe id="pdfIframe" class="pdf-iframe" title="Anteprima PDF Grafico AS/400"></iframe>
        </div>
      </div>
    `;

    this.attachEvents();
    this.generatePdf();
  }

  attachEvents() {
    const btnRefresh = this.container.querySelector('#btn_refresh_pdf');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.generatePdf());
    }

    const btnDownload = this.container.querySelector('#btn_download_pdf');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        if (this.currentDoc) {
          const docName = (this.report?.meta?.title || 'Report_AS400')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '') + '.pdf';
          this.currentDoc.save(docName);
        }
      });
    }

    const btnPrint = this.container.querySelector('#btn_print_pdf');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        const iframe = this.container.querySelector('#pdfIframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.print();
        }
      });
    }
  }

  async generatePdf() {
    if (this.isRendering) return;
    this.isRendering = true;

    const overlay = this.container.querySelector('#pdfLoadingOverlay');
    const statusBadge = this.container.querySelector('#pdfStatusBadge');
    const metaInfo = this.container.querySelector('#pdfMetaInfo');
    const iframe = this.container.querySelector('#pdfIframe');

    if (overlay) overlay.style.display = 'flex';
    if (statusBadge) {
      statusBadge.textContent = 'Rendering...';
      statusBadge.className = 'pdf-status-badge rendering';
    }

    const startTime = performance.now();

    try {
      const dataContext = {
        spoolEngine: this.spoolEngine,
        jsonData: this.jsonData
      };

      const doc = await PdfGenerator.generate(this.report, dataContext);
      this.currentDoc = doc;

      // Revoke previous blob URL to prevent memory leaks
      if (this.pdfBlobUrl) {
        URL.revokeObjectURL(this.pdfBlobUrl);
      }

      const blob = doc.output('blob');
      this.pdfBlobUrl = URL.createObjectURL(blob);

      if (iframe) {
        iframe.src = this.pdfBlobUrl;
      }

      const elapsed = Math.round(performance.now() - startTime);
      const sizeKb = (blob.size / 1024).toFixed(1);
      const pages = doc.getNumberOfPages();

      if (statusBadge) {
        statusBadge.textContent = 'Generato con Successo';
        statusBadge.className = 'pdf-status-badge success';
      }
      if (metaInfo) {
        metaInfo.textContent = `${pages} pag | ${sizeKb} KB | ${elapsed} ms`;
      }
    } catch (err) {
      console.error('PDF Generation Error', err);
      if (statusBadge) {
        statusBadge.textContent = 'Errore Rendering';
        statusBadge.className = 'pdf-status-badge error';
      }
      if (metaInfo) {
        metaInfo.textContent = err.message;
      }
    } finally {
      if (overlay) overlay.style.display = 'none';
      this.isRendering = false;
    }
  }
}
