// ASDOCU-Style AS/400 Spool Terminal Mapper Component
import { SAMPLE_SPOOL_FATTURA, SAMPLE_SPOOL_DDT, SAMPLE_SPOOL_ORDINE } from '../data/sample-spools.js';

export class SpoolMapperUI {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.spoolEngine = options.spoolEngine;
    this.onFieldMapped = options.onFieldMapped || (() => {});
    this.onSpoolChange = options.onSpoolChange || (() => {});
    this.theme = 'phosphor-green'; // 'phosphor-green', 'amber', 'matrix'
    this.currentSelection = null;

    this.render();
  }

  setSpoolEngine(engine) {
    this.spoolEngine = engine;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="spool-mapper-container">
        <!-- Spool Controls Toolbar -->
        <div class="spool-toolbar">
          <div class="spool-toolbar-left">
            <span class="terminal-badge">IBM i / AS400 SPOOL VIEWER</span>
            <label class="toolbar-label">Spool Predefinito:</label>
            <select id="spool_preset_select" class="spool-select">
              <option value="fattura">Fattura Accompagnatoria (FA-2026/008492)</option>
              <option value="ddt">Documento di Trasporto (DDT-2026/04912)</option>
              <option value="ordine">Ordine Acquisto Fornitore (ORD-2026/11029)</option>
            </select>
            <button class="spool-btn" id="btn_upload_spool">📂 Carica File (.spl / .txt)</button>
            <input type="file" id="file_spool_input" accept=".txt,.spl,.prn" style="display: none;">
            <button class="spool-btn" id="btn_paste_spool">📋 Incolla Testo</button>
          </div>

          <div class="spool-toolbar-right">
            <input type="text" id="spool_search_input" class="spool-search" placeholder="🔍 Cerca nello spool...">
            <div class="terminal-theme-switcher">
              <button class="theme-btn green ${this.theme === 'phosphor-green' ? 'active' : ''}" data-theme="phosphor-green" title="Fosfori Verdi (IBM 5250)"></button>
              <button class="theme-btn amber ${this.theme === 'amber' ? 'active' : ''}" data-theme="amber" title="Fosfori Ambra"></button>
            </div>
          </div>
        </div>

        <!-- Coordinate HUD Floating Bar (Validoc Style) -->
        <div class="spool-hud-bar" id="spoolHudBar">
          <div class="hud-coords">
            <span class="hud-item"><strong id="hud_row">Riga: --</strong></span>
            <span class="hud-item"><strong id="hud_col">Col: --</strong></span>
            <span class="hud-item hud-val">Testo: "<span id="hud_text">Seleziona con il mouse un testo sullo spool sottostante</span>"</span>
          </div>
          <div class="hud-actions" id="hudActions" style="display: none;">
            <button class="hud-btn primary" id="btn_hud_create_field">➕ Crea Campo Mappato nel Report</button>
            <button class="hud-btn" id="btn_hud_copy">📋 Copia Coordinate</button>
          </div>
        </div>

        <!-- Terminal Workspace Area with Rulers and Line Numbers -->
        <div class="terminal-screen ${this.theme}" id="terminalScreen">
          <!-- Terminal Column Ruler (01 to 132) -->
          <div class="terminal-col-ruler" id="terminalColRuler"></div>

          <!-- Main Terminal Text with Line Numbers -->
          <div class="terminal-body" id="terminalBody">
            ${this.renderTerminalLines()}
          </div>
        </div>
      </div>
    `;

    this.renderColRuler();
    this.attachEvents();
  }

  renderColRuler() {
    const rulerEl = this.container.querySelector('#terminalColRuler');
    if (!rulerEl) return;

    let html = '<div class="ruler-line-col-spacer">#RIGA</div><div class="ruler-digits">';
    for (let c = 1; c <= 132; c++) {
      if (c % 10 === 0) {
        html += `<span class="ruler-tens">${c}</span>`;
      } else if (c % 5 === 0) {
        html += `<span class="ruler-fives">|</span>`;
      } else {
        html += `<span class="ruler-dot">·</span>`;
      }
    }
    html += '</div>';
    rulerEl.innerHTML = html;
  }

  renderTerminalLines() {
    if (!this.spoolEngine) return '<div class="terminal-empty">Nessuno spool caricato.</div>';

    const lines = this.spoolEngine.lines;
    let html = '';

    lines.forEach((line, index) => {
      const rowNum = index + 1;
      const paddedRow = String(rowNum).padStart(3, '0');
      // Wrap characters in a selectable monospace row
      html += `
        <div class="terminal-row" data-row="${rowNum}">
          <span class="terminal-row-num">${paddedRow}</span>
          <span class="terminal-row-text" data-row="${rowNum}">${this.escapeHtml(line)}</span>
        </div>
      `;
    });

    return html;
  }

  attachEvents() {
    // Spool selection mouseup (extract exact coordinate!)
    const terminalBody = this.container.querySelector('#terminalBody');
    if (terminalBody) {
      terminalBody.addEventListener('mouseup', () => {
        this.handleTextSelection();
      });
    }

    // Preset selector
    const presetSelect = this.container.querySelector('#spool_preset_select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        let text = SAMPLE_SPOOL_FATTURA;
        if (val === 'ddt') text = SAMPLE_SPOOL_DDT;
        if (val === 'ordine') text = SAMPLE_SPOOL_ORDINE;
        
        this.spoolEngine.setRawText(text);
        this.render();
        this.onSpoolChange(this.spoolEngine);
      });
    }

    // Upload Spool file
    const btnUpload = this.container.querySelector('#btn_upload_spool');
    const fileInp = this.container.querySelector('#file_spool_input');
    if (btnUpload && fileInp) {
      btnUpload.addEventListener('click', () => fileInp.click());
      fileInp.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            this.spoolEngine.setRawText(re.target.result);
            this.render();
            this.onSpoolChange(this.spoolEngine);
          };
          reader.readAsText(file);
        }
      });
    }

    // Paste Spool
    const btnPaste = this.container.querySelector('#btn_paste_spool');
    if (btnPaste) {
      btnPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            this.spoolEngine.setRawText(text);
            this.render();
            this.onSpoolChange(this.spoolEngine);
          }
        } catch {
          const pasted = prompt("Incolla qui il testo dello Spool AS/400 (66 righe):");
          if (pasted) {
            this.spoolEngine.setRawText(pasted);
            this.render();
            this.onSpoolChange(this.spoolEngine);
          }
        }
      });
    }

    // Theme switcher
    this.container.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.theme = btn.dataset.theme;
        const screen = this.container.querySelector('#terminalScreen');
        if (screen) {
          screen.className = `terminal-screen ${this.theme}`;
        }
        this.container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Search filter
    const searchInp = this.container.querySelector('#spool_search_input');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.container.querySelectorAll('.terminal-row-text').forEach(node => {
          const raw = node.textContent;
          if (!query) {
            node.innerHTML = this.escapeHtml(raw);
          } else if (raw.toLowerCase().includes(query)) {
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            node.innerHTML = raw.replace(regex, '<mark class="spool-highlight">$1</mark>');
          }
        });
      });
    }

    // HUD Actions
    const btnCreateField = this.container.querySelector('#btn_hud_create_field');
    if (btnCreateField) {
      btnCreateField.addEventListener('click', () => {
        if (this.currentSelection) {
          this.onFieldMapped(this.currentSelection);
        }
      });
    }

    const btnCopy = this.container.querySelector('#btn_hud_copy');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (this.currentSelection) {
          const str = `[R${this.currentSelection.row}:C${this.currentSelection.colStart}-C${this.currentSelection.colEnd}]`;
          navigator.clipboard.writeText(str);
          btnCopy.textContent = '✓ Copiato!';
          setTimeout(() => btnCopy.textContent = '📋 Copia Coordinate', 1500);
        }
      });
    }
  }

  handleTextSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const textNode = range.startContainer;
    const rowEl = textNode.parentElement?.closest('.terminal-row-text');
    if (!rowEl) return;

    const rowNum = parseInt(rowEl.dataset.row, 10);
    const startCol = range.startOffset + 1; // 1-indexed
    const endCol = range.endOffset; // inclusive
    const selectedText = sel.toString().trim();

    if (!selectedText) return;

    this.currentSelection = {
      row: rowNum,
      colStart: startCol,
      colEnd: Math.max(startCol, endCol),
      text: selectedText
    };

    // Update HUD
    const hudRow = this.container.querySelector('#hud_row');
    const hudCol = this.container.querySelector('#hud_col');
    const hudText = this.container.querySelector('#hud_text');
    const hudActions = this.container.querySelector('#hudActions');

    if (hudRow) hudRow.textContent = `Riga: ${this.currentSelection.row}`;
    if (hudCol) hudCol.textContent = `Col: ${this.currentSelection.colStart} - ${this.currentSelection.colEnd}`;
    if (hudText) hudText.textContent = this.currentSelection.text;
    if (hudActions) hudActions.style.display = 'flex';
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
