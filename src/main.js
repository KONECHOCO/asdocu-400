// ASDOCU 400 Studio - Master Application Controller
import './style.css';
import { getTemplateFattura, getTemplateDDT } from './services/templates.js';
import { createDefaultReport } from './models/report-model.js';
import { SpoolEngine } from './services/spool-engine.js';
import { SAMPLE_SPOOL_FATTURA, SAMPLE_SPOOL_DDT, SAMPLE_JSON_DATA } from './data/sample-spools.js';
import { DesignerCanvas } from './components/designer-canvas.js';
import { PropertyInspector } from './components/property-inspector.js';
import { SpoolMapperUI } from './components/spool-mapper-ui.js';
import { ScriptEditorUI } from './components/script-editor-ui.js';
import { PdfPreviewUI } from './components/pdf-preview-ui.js';
import { As400ConnectorUI } from './components/as400-connector-ui.js';
import { IntegrationApiUI } from './components/integration-api-ui.js';

class AsdocuStudioApp {
  constructor() {
    this.currentReport = getTemplateFattura();
    this.spoolEngine = new SpoolEngine(SAMPLE_SPOOL_FATTURA);
    this.jsonData = SAMPLE_JSON_DATA;
    this.activeView = 'designer';

    this.init();
  }

  init() {
    this.initViews();
    this.initNavTabs();
    this.initToolbox();
    this.initTopActions();
    this.checkUrlParams();
    this.updateStatus('ASDOCU 400 Studio caricato con successo.');
  }

  initViews() {
    // 1. Designer Canvas
    const canvasHost = document.getElementById('designerCanvasHost');
    this.designerCanvas = new DesignerCanvas(canvasHost, {
      report: this.currentReport,
      onSelectElement: (el) => {
        this.propertyInspector.setSelection(el, this.currentReport, this.spoolEngine);
        if (el) {
          this.updateStatus(`Selezionato controllo: ${el.name} (${el.type}) [X:${el.xMm}mm, Y:${el.yMm}mm, W:${el.widthMm}mm, H:${el.heightMm}mm]`);
        } else {
          this.updateStatus('Nessun elemento selezionato. Modalità documento globale.');
        }
      },
      onReportChange: (rep) => {
        this.currentReport = rep;
        this.propertyInspector.setSelection(this.propertyInspector.selectedElement, this.currentReport, this.spoolEngine);
        this.debouncePdfUpdate();
      }
    });

    // 2. Property Inspector
    const inspectorHost = document.getElementById('designerInspector');
    this.propertyInspector = new PropertyInspector(inspectorHost, {
      report: this.currentReport,
      spoolEngine: this.spoolEngine,
      onChange: () => {
        this.designerCanvas.render();
        this.debouncePdfUpdate();
      },
      onDelete: (elemId) => {
        this.designerCanvas.deleteElement(elemId);
        this.updateStatus('Controllo eliminato.');
      },
      onDuplicate: (el) => {
        const copyOptions = JSON.parse(JSON.stringify(el));
        copyOptions.id = undefined;
        copyOptions.name = `${el.name}_copia`;
        copyOptions.xMm = el.xMm + 5;
        copyOptions.yMm = el.yMm + 5;
        const newEl = this.designerCanvas.addNewElement(el.type, el.sectionId, copyOptions);
        this.updateStatus(`Controllo duplicato: ${newEl.name}`);
      }
    });

    // 3. Spool Terminal Mapper UI
    const spoolHost = document.getElementById('spoolMapperHost');
    this.spoolMapper = new SpoolMapperUI(spoolHost, {
      spoolEngine: this.spoolEngine,
      onSpoolChange: (newEngine) => {
        this.spoolEngine = newEngine;
        this.propertyInspector.setSelection(this.propertyInspector.selectedElement, this.currentReport, this.spoolEngine);
        this.scriptStudio?.setContext(this.spoolEngine, this.jsonData);
        this.debouncePdfUpdate();
      },
      onFieldMapped: (coords) => {
        // Create a new bound field in the detail or pageHeader section
        const targetSecId = 'pageHeader';
        const newField = this.designerCanvas.addNewElement('field', targetSecId, {
          name: `fld_r${coords.row}_c${coords.colStart}`,
          binding: {
            source: 'spool',
            spoolRow: coords.row,
            spoolColStart: coords.colStart,
            spoolColEnd: coords.colEnd,
            staticValue: coords.text,
            format: 'text'
          },
          xMm: 20,
          yMm: 10,
          widthMm: Math.max(30, (coords.colEnd - coords.colStart) * 3)
        });

        // Switch to Designer tab and focus new element
        this.switchView('designer');
        this.designerCanvas.setSelectedElementId(newField.id);
        this.propertyInspector.setSelection(newField, this.currentReport, this.spoolEngine);
        this.updateStatus(`Campo Spool R${coords.row}:C${coords.colStart}-${coords.colEnd} aggiunto al report!`);
      }
    });

    // 4. JavaScript Scripting Studio
    const scriptHost = document.getElementById('scriptStudioHost');
    this.scriptStudio = new ScriptEditorUI(scriptHost, {
      spoolEngine: this.spoolEngine,
      jsonData: this.jsonData,
      onDataTransformed: (resultData) => {
        this.jsonData = resultData;
        this.pdfPreview?.updateData(this.currentReport, this.spoolEngine, this.jsonData);
        this.updateStatus('Pipeline JavaScript eseguita: nuovi dati applicati al PDF.');
      }
    });

    // 5. IBM i AS/400 Connection Hub
    const as400Host = document.getElementById('as400ConnectorHost');
    this.as400Connector = new As400ConnectorUI(as400Host, {
      apiBaseUrl: 'http://localhost:3001/api',
      onLoadSpoolToDesigner: (spool) => {
        // Switch template to matching document type
        if (spool.docType === 'ddt') {
          this.currentReport = getTemplateDDT();
          const tplSelect = document.getElementById('templateSelect');
          if (tplSelect) tplSelect.value = 'ddt';
        } else {
          this.currentReport = getTemplateFattura();
          const tplSelect = document.getElementById('templateSelect');
          if (tplSelect) tplSelect.value = 'fattura';
        }

        this.spoolEngine.setRawText(spool.content);
        this.designerCanvas.setReport(this.currentReport);
        this.propertyInspector.setSelection(null, this.currentReport, this.spoolEngine);
        this.spoolMapper.setSpoolEngine(this.spoolEngine);
        this.scriptStudio.setContext(this.spoolEngine, this.jsonData);
        this.switchView('designer');
        this.updateStatus(`Spool ${spool.name} #${spool.spoolNumber} (${spool.id}) caricato nel Designer!`);
      },
      onQuickPrintSpool: (spool) => {
        if (spool.docType === 'ddt') {
          this.currentReport = getTemplateDDT();
        } else {
          this.currentReport = getTemplateFattura();
        }
        this.spoolEngine.setRawText(spool.content);
        this.switchView('preview');
        this.updateStatus(`Generazione PDF immediata per spool ${spool.name} (${spool.id})`);
      }
    });

    // 6. External Program Integration & REST API Hub
    const integrationHost = document.getElementById('integrationHost');
    this.integrationApi = new IntegrationApiUI(integrationHost, {
      apiBaseUrl: 'http://localhost:3001/api'
    });

    // 7. PDF Preview UI
    const pdfHost = document.getElementById('pdfPreviewHost');
    this.pdfPreview = new PdfPreviewUI(pdfHost, {
      report: this.currentReport,
      spoolEngine: this.spoolEngine,
      jsonData: this.jsonData
    });
  }

  initNavTabs() {
    const navTabs = document.getElementById('mainNavTabs');
    navTabs.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        this.switchView(view);
      });
    });
  }

  switchView(viewName) {
    this.activeView = viewName;

    // Update active tab buttons
    document.querySelectorAll('#mainNavTabs .nav-tab').forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view${this.capitalize(viewName)}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    if (viewName === 'preview') {
      this.pdfPreview.updateData(this.currentReport, this.spoolEngine, this.jsonData);
    } else if (viewName === 'script') {
      this.scriptStudio.setContext(this.spoolEngine, this.jsonData);
    } else if (viewName === 'as400') {
      this.as400Connector.fetchSpools();
    }
  }

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const template = params.get('template');
    const spoolId = params.get('spoolId');
    const view = params.get('view');

    if (template === 'ddt') {
      this.currentReport = getTemplateDDT();
      const tplSelect = document.getElementById('templateSelect');
      if (tplSelect) tplSelect.value = 'ddt';
    }

    if (action === 'print' || view === 'preview') {
      this.switchView('preview');
      this.updateStatus('Richiesta di stampa automatica da URL query parameter.');
    } else if (view === 'as400') {
      this.switchView('as400');
    } else if (view === 'integration') {
      this.switchView('integration');
    }
  }

  initToolbox() {
    // Tool buttons in left sidebar
    document.querySelectorAll('#designerToolbox .tool-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolType = btn.dataset.tool;
        const targetSection = (toolType === 'table' ? 'detail' : 'pageHeader');
        const newEl = this.designerCanvas.addNewElement(toolType, targetSection);
        this.updateStatus(`Aggiunto controllo ${toolType.toUpperCase()} in ${targetSection}`);
      });
    });

    // Sections visibility checkboxes
    const sectionKeys = ['reportHeader', 'pageHeader', 'detail', 'pageFooter', 'reportFooter'];
    sectionKeys.forEach(key => {
      const chk = document.getElementById(`chk_sec_${key}`);
      if (chk) {
        chk.checked = this.currentReport.sections[key]?.visible !== false;
        chk.addEventListener('change', (e) => {
          if (this.currentReport.sections[key]) {
            this.currentReport.sections[key].visible = e.target.checked;
            this.designerCanvas.render();
            this.debouncePdfUpdate();
          }
        });
      }
    });
  }

  initTopActions() {
    // Template dropdown
    const tplSelect = document.getElementById('templateSelect');
    if (tplSelect) {
      tplSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'fattura') {
          this.currentReport = getTemplateFattura();
          this.spoolEngine.setRawText(SAMPLE_SPOOL_FATTURA);
        } else if (val === 'ddt') {
          this.currentReport = getTemplateDDT();
          this.spoolEngine.setRawText(SAMPLE_SPOOL_DDT);
        } else if (val === 'blank') {
          this.currentReport = createDefaultReport();
        }

        this.designerCanvas.setReport(this.currentReport);
        this.propertyInspector.setSelection(null, this.currentReport, this.spoolEngine);
        this.spoolMapper.setSpoolEngine(this.spoolEngine);
        this.scriptStudio.setContext(this.spoolEngine, this.jsonData);
        this.debouncePdfUpdate();
        this.updateSectionCheckboxes();
        this.updateStatus(`Caricato modello predefinito: ${this.currentReport.meta.title}`);
      });
    }

    // Save template JSON
    const btnSave = document.getElementById('btnSaveTemplate');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.currentReport, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        const fileName = (this.currentReport.meta.title || 'report_template').replace(/[^a-z0-9_-]/gi, '_') + '.asdocu.json';
        downloadAnchor.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        this.updateStatus(`Modello esportato: ${fileName}`);
      });
    }

    // Load template JSON
    const btnLoad = document.getElementById('btnLoadTemplate');
    const inputLoad = document.getElementById('inputLoadTemplateFile');
    if (btnLoad && inputLoad) {
      btnLoad.addEventListener('click', () => inputLoad.click());
      inputLoad.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            try {
              const loadedReport = JSON.parse(re.target.result);
              if (loadedReport.sections && loadedReport.page) {
                this.currentReport = loadedReport;
                this.designerCanvas.setReport(this.currentReport);
                this.propertyInspector.setSelection(null, this.currentReport, this.spoolEngine);
                this.updateSectionCheckboxes();
                this.debouncePdfUpdate();
                this.updateStatus(`Modello caricato con successo: ${loadedReport.meta?.title || 'Report'}`);
              } else {
                alert('File JSON non valido: mancano le definizioni di pagina o sezioni.');
              }
            } catch (err) {
              alert('Errore di decodifica JSON: ' + err.message);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Quick export PDF button (switches to preview & generates)
    const btnQuickPdf = document.getElementById('btnQuickExportPdf');
    if (btnQuickPdf) {
      btnQuickPdf.addEventListener('click', () => {
        this.switchView('preview');
      });
    }
  }

  updateSectionCheckboxes() {
    const sectionKeys = ['reportHeader', 'pageHeader', 'detail', 'pageFooter', 'reportFooter'];
    sectionKeys.forEach(key => {
      const chk = document.getElementById(`chk_sec_${key}`);
      if (chk) {
        chk.checked = this.currentReport.sections[key]?.visible !== false;
      }
    });
  }

  debouncePdfUpdate() {
    clearTimeout(this._pdfTimeout);
    this._pdfTimeout = setTimeout(() => {
      if (this.activeView === 'preview') {
        this.pdfPreview.updateData(this.currentReport, this.spoolEngine, this.jsonData);
      }
    }, 400);
  }

  updateStatus(msg) {
    const el = document.getElementById('statusMessage');
    if (el) el.textContent = msg;
  }

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new AsdocuStudioApp();
});
