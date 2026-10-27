// JavaScript Scripting & Data Pipeline Studio Component
import { PRESET_SCRIPTS, ScriptEngine } from '../services/script-engine.js';

export class ScriptEditorUI {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.spoolEngine = options.spoolEngine;
    this.jsonData = options.jsonData;
    this.onDataTransformed = options.onDataTransformed || (() => {});
    this.currentCode = PRESET_SCRIPTS.spoolToInvoice;

    this.render();
  }

  setContext(spoolEngine, jsonData) {
    if (spoolEngine) this.spoolEngine = spoolEngine;
    if (jsonData) this.jsonData = jsonData;
  }

  render() {
    this.container.innerHTML = `
      <div class="script-studio-container">
        <!-- Top Toolbar -->
        <div class="script-toolbar">
          <div class="toolbar-left">
            <span class="script-badge">JS DATA CONNECTOR PIPELINE</span>
            <label>Script Predefinito:</label>
            <select id="script_preset_select" class="script-select">
              <option value="spoolToInvoice">Estrazione Spool AS/400 -> Oggetto Fattura</option>
              <option value="calculateVatSummary">Ricalcolo Scorporo IVA & Imposte</option>
            </select>
          </div>
          <div class="toolbar-right">
            <button class="script-action-btn primary" id="btn_run_script">
              <span class="btn-icon">▶</span> Esegui Script di Collegamento
            </button>
            <button class="script-action-btn success" id="btn_apply_script_data" disabled>
              <span class="btn-icon">✓</span> Applica Dati al Report PDF
            </button>
          </div>
        </div>

        <!-- Main Studio Split Grid -->
        <div class="script-studio-grid">
          <!-- Left: Code Editor Area -->
          <div class="script-editor-pane">
            <div class="pane-header">
              <span>Codice JavaScript (Pipeline di Trasformazione)</span>
              <span class="hint">Modifica il codice per estrarre, calcolare o arricchire i dati</span>
            </div>
            <textarea id="script_code_area" class="script-textarea" spellcheck="false">${this.escapeHtml(this.currentCode)}</textarea>
          </div>

          <!-- Right: Execution Console and Result Inspector -->
          <div class="script-output-pane">
            <div class="pane-header">
              <span>Console di Esecuzione & Dati Estratti</span>
              <span id="script_status_badge" class="badge-status idle">In attesa di esecuzione</span>
            </div>

            <!-- Console Log Messages -->
            <div class="console-box" id="consoleLogs">
              <div class="console-placeholder">Clicca su "Esegui Script di Collegamento" per testare la pipeline dati JavaScript.</div>
            </div>

            <!-- JSON Result Inspector -->
            <div class="json-inspector-box">
              <div class="inspector-subhead">Struttura JSON Risultante:</div>
              <pre id="jsonResultViewer" class="json-pre">{}</pre>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const presetSelect = this.container.querySelector('#script_preset_select');
    const codeArea = this.container.querySelector('#script_code_area');
    const btnRun = this.container.querySelector('#btn_run_script');
    const btnApply = this.container.querySelector('#btn_apply_script_data');

    if (presetSelect && codeArea) {
      presetSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (PRESET_SCRIPTS[key]) {
          this.currentCode = PRESET_SCRIPTS[key];
          codeArea.value = this.currentCode;
        }
      });
    }

    if (codeArea) {
      codeArea.addEventListener('input', (e) => {
        this.currentCode = e.target.value;
      });
    }

    let lastResult = null;

    if (btnRun) {
      btnRun.addEventListener('click', () => {
        const rawSpool = this.spoolEngine?.rawText || '';
        const execution = ScriptEngine.execute(this.currentCode, rawSpool, this.jsonData);
        
        const logsBox = this.container.querySelector('#consoleLogs');
        const jsonViewer = this.container.querySelector('#jsonResultViewer');
        const statusBadge = this.container.querySelector('#script_status_badge');

        if (statusBadge) {
          if (execution.success) {
            statusBadge.textContent = 'Eseguito con Successo';
            statusBadge.className = 'badge-status success';
          } else {
            statusBadge.textContent = 'Errore Script';
            statusBadge.className = 'badge-status error';
          }
        }

        // Render console logs
        if (logsBox) {
          if (execution.logs.length === 0) {
            logsBox.innerHTML = '<div class="console-line info">[Nessun output console.log]</div>';
          } else {
            logsBox.innerHTML = execution.logs.map(log => `
              <div class="console-line ${log.type}">
                <span class="log-tag">[${log.type.toUpperCase()}]</span>
                <span class="log-msg">${this.escapeHtml(log.text)}</span>
              </div>
            `).join('');
          }
        }

        // Render JSON result
        if (jsonViewer) {
          if (execution.result) {
            lastResult = execution.result;
            jsonViewer.textContent = JSON.stringify(execution.result, null, 2);
            if (btnApply) btnApply.disabled = false;
          } else {
            jsonViewer.textContent = execution.error ? `Errore: ${execution.error}` : 'Nessun oggetto restituito (return null)';
            if (btnApply) btnApply.disabled = true;
          }
        }
      });
    }

    if (btnApply) {
      btnApply.addEventListener('click', () => {
        if (lastResult) {
          this.onDataTransformed(lastResult);
          btnApply.textContent = '✓ Dati Applicati al PDF!';
          setTimeout(() => btnApply.innerHTML = '<span class="btn-icon">✓</span> Applica Dati al Report PDF', 2000);
        }
      });
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
