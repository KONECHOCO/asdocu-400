// Microsoft Access-Style Property Inspector Component (Foglio delle Proprietà)
import { SECTION_LABELS } from '../models/report-model.js';

export class PropertyInspector {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.report = options.report;
    this.selectedElement = null;
    this.spoolEngine = options.spoolEngine;
    this.activeTab = 'format'; // 'format', 'data', 'layout', 'all'
    this.onChange = options.onChange || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onDuplicate = options.onDuplicate || (() => {});

    this.render();
  }

  setSelection(element, report, spoolEngine) {
    this.selectedElement = element;
    if (report) this.report = report;
    if (spoolEngine) this.spoolEngine = spoolEngine;
    this.render();
  }

  render() {
    if (!this.selectedElement) {
      this.renderNoSelection();
      return;
    }

    const el = this.selectedElement;
    const typeLabel = this.getTypeLabel(el.type);

    this.container.innerHTML = `
      <div class="property-sheet">
        <!-- Inspector Header -->
        <div class="inspector-header">
          <div class="inspector-title-group">
            <span class="inspector-badge">${typeLabel}</span>
            <input type="text" class="inspector-name-input" id="prop_elem_name" value="${this.escapeHtml(el.name)}" title="Nome Univoco del Controllo">
          </div>
          <div class="inspector-quick-actions">
            <button class="insp-icon-btn" id="btn_duplicate_elem" title="Duplica Controllo">⧉</button>
            <button class="insp-icon-btn danger" id="btn_delete_elem" title="Elimina Controllo">🗑️</button>
          </div>
        </div>

        <!-- Access-style Property Tabs -->
        <div class="property-tabs">
          <button class="prop-tab ${this.activeTab === 'format' ? 'active' : ''}" data-tab="format">Formato</button>
          <button class="prop-tab ${this.activeTab === 'data' ? 'active' : ''}" data-tab="data">Dati (Spool)</button>
          <button class="prop-tab ${this.activeTab === 'layout' ? 'active' : ''}" data-tab="layout">Posizione</button>
          <button class="prop-tab ${this.activeTab === 'all' ? 'active' : ''}" data-tab="all">Tutto</button>
        </div>

        <!-- Property Grid Body -->
        <div class="property-grid-body">
          ${this.renderActiveTabContent(el)}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderNoSelection() {
    this.container.innerHTML = `
      <div class="property-sheet-empty">
        <div class="empty-icon">📐</div>
        <h4>Nessun Elemento Selezionato</h4>
        <p>Seleziona un controllo sul foglio di lavoro per visualizzare e modificare le proprietà in stile Microsoft Access e ASDOCU.</p>
        <div class="report-global-props">
          <div class="prop-row-header">Proprietà Documento</div>
          <div class="prop-field">
            <label>Titolo Report:</label>
            <input type="text" id="prop_report_title" value="${this.escapeHtml(this.report?.meta?.title || '')}">
          </div>
          <div class="prop-field">
            <label>Formato Pagina:</label>
            <select id="prop_page_format">
              <option value="a4" ${this.report?.page?.format === 'a4' ? 'selected' : ''}>A4 (210 x 297 mm)</option>
              <option value="letter" ${this.report?.page?.format === 'letter' ? 'selected' : ''}>Letter (216 x 279 mm)</option>
            </select>
          </div>
          <div class="prop-field">
            <label>Orientamento:</label>
            <select id="prop_page_orientation">
              <option value="portrait" ${this.report?.page?.orientation === 'portrait' ? 'selected' : ''}>Verticale (Portrait)</option>
              <option value="landscape" ${this.report?.page?.orientation === 'landscape' ? 'selected' : ''}>Orizzontale (Landscape)</option>
            </select>
          </div>
          <div class="prop-field">
            <label>Griglia Snap (mm):</label>
            <input type="number" id="prop_grid_size" value="${this.report?.page?.gridSizeMm || 2}" min="1" max="10">
          </div>
        </div>
      </div>
    `;

    // Global properties change listeners
    const titleInput = this.container.querySelector('#prop_report_title');
    if (titleInput) {
      titleInput.addEventListener('change', (e) => {
        if (this.report) this.report.meta.title = e.target.value;
        this.onChange();
      });
    }
  }

  renderActiveTabContent(el) {
    let content = '';

    if (this.activeTab === 'format' || this.activeTab === 'all') {
      content += `
        <div class="prop-section-group">
          <div class="group-title">Aspetto e Tipografia</div>
          ${(el.type === 'label' || el.type === 'field' || el.type === 'pagenum') ? `
            <div class="prop-row">
              <label>Testo Fisso / Etichetta:</label>
              <input type="text" id="prop_static_val" value="${this.escapeHtml(el.binding?.staticValue || '')}">
            </div>
            <div class="prop-row-split">
              <div class="prop-col">
                <label>Carattere:</label>
                <select id="prop_font_family">
                  <option value="Helvetica" ${el.style.fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                  <option value="Times" ${el.style.fontFamily === 'Times' ? 'selected' : ''}>Times New Roman</option>
                  <option value="Courier" ${el.style.fontFamily === 'Courier' ? 'selected' : ''}>Courier (Monospace)</option>
                </select>
              </div>
              <div class="prop-col">
                <label>Dimensione (pt):</label>
                <input type="number" id="prop_font_size" value="${el.style.fontSizePt || 10}" min="5" max="72">
              </div>
            </div>
            <div class="prop-row-split">
              <div class="prop-col">
                <label>Stile:</label>
                <div class="btn-group-toggle">
                  <button type="button" class="btn-toggle ${el.style.fontWeight === 'bold' ? 'active' : ''}" id="btn_toggle_bold">B</button>
                  <button type="button" class="btn-toggle ${el.style.fontStyle === 'italic' ? 'active' : ''}" id="btn_toggle_italic">I</button>
                </div>
              </div>
              <div class="prop-col">
                <label>Allineamento:</label>
                <select id="prop_text_align">
                  <option value="left" ${el.style.textAlign === 'left' ? 'selected' : ''}>Sinistra</option>
                  <option value="center" ${el.style.textAlign === 'center' ? 'selected' : ''}>Centro</option>
                  <option value="right" ${el.style.textAlign === 'right' ? 'selected' : ''}>Destra</option>
                </select>
              </div>
            </div>
            <div class="prop-row">
              <label>Colore Testo:</label>
              <div class="color-picker-row">
                <input type="color" id="prop_text_color" value="${el.style.color || '#1e293b'}">
                <span>${el.style.color || '#1e293b'}</span>
              </div>
            </div>
          ` : ''}

          <div class="prop-row">
            <label>Colore di Sfondo:</label>
            <div class="color-picker-row">
              <input type="color" id="prop_bg_color" value="${el.style.backgroundColor && el.style.backgroundColor !== 'transparent' ? el.style.backgroundColor : '#ffffff'}">
              <button type="button" class="btn-mini" id="btn_bg_transparent">Trasparente</button>
            </div>
          </div>

          <div class="prop-row-split">
            <div class="prop-col">
              <label>Bordo (pt):</label>
              <input type="number" id="prop_border_width" value="${el.style.borderWidthPt ?? 1}" min="0" max="10" step="0.5">
            </div>
            <div class="prop-col">
              <label>Raggio Angoli (mm):</label>
              <input type="number" id="prop_border_radius" value="${el.style.borderRadiusMm ?? 0}" min="0" max="20">
            </div>
          </div>
          <div class="prop-row">
            <label>Colore Bordo:</label>
            <div class="color-picker-row">
              <input type="color" id="prop_border_color" value="${el.style.borderColor || '#cbd5e1'}">
              <span>${el.style.borderColor || '#cbd5e1'}</span>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'data' || this.activeTab === 'all') {
      const isSpool = el.binding?.source === 'spool';
      const isJson = el.binding?.source === 'json';
      
      let liveVal = '';
      if (isSpool && this.spoolEngine) {
        liveVal = this.spoolEngine.extractValue(el.binding?.spoolRow, el.binding?.spoolColStart, el.binding?.spoolColEnd);
      }

      content += `
        <div class="prop-section-group">
          <div class="group-title">ASDOCU Data Binding (Collegamento Spool / Dati)</div>
          <div class="prop-row">
            <label>Origine Dati:</label>
            <select id="prop_bind_source">
              <option value="static" ${el.binding?.source === 'static' ? 'selected' : ''}>Testo Statico / Fisso</option>
              <option value="spool" ${isSpool ? 'selected' : ''}>Coordinate AS/400 Spool</option>
              <option value="json" ${isJson ? 'selected' : ''}>Campo JSON / DB2</option>
              <option value="formula" ${el.binding?.source === 'formula' ? 'selected' : ''}>Formula / Espressione Calcolata</option>
            </select>
          </div>

          ${isSpool ? `
            <div class="spool-bind-panel">
              <div class="prop-row-split">
                <div class="prop-col">
                  <label>Riga Spool:</label>
                  <input type="number" id="prop_spool_row" value="${el.binding?.spoolRow || 1}" min="1" max="198">
                </div>
                <div class="prop-col">
                  <label>Col. Inizio:</label>
                  <input type="number" id="prop_spool_c1" value="${el.binding?.spoolColStart || 1}" min="1" max="198">
                </div>
                <div class="prop-col">
                  <label>Col. Fine:</label>
                  <input type="number" id="prop_spool_c2" value="${el.binding?.spoolColEnd || 20}" min="1" max="198">
                </div>
              </div>

              <div class="prop-row">
                <label>Formattazione Dati:</label>
                <select id="prop_bind_format">
                  <option value="text" ${el.binding?.format === 'text' ? 'selected' : ''}>Nessuna (Testo grezzo)</option>
                  <option value="currency_eur" ${el.binding?.format === 'currency_eur' ? 'selected' : ''}>Valuta Euro (€ 1.250,00)</option>
                  <option value="number_2dec" ${el.binding?.format === 'number_2dec' ? 'selected' : ''}>Numero con 2 Decimali (1.250,00)</option>
                  <option value="date_it" ${el.binding?.format === 'date_it' ? 'selected' : ''}>Data Italiana (GG/MM/AAAA)</option>
                </select>
              </div>

              <div class="live-preview-box">
                <span class="lbl-small">Valore Spool Estratto:</span>
                <span class="spool-live-value">"${this.escapeHtml(liveVal)}"</span>
              </div>
            </div>
          ` : ''}

          ${isJson ? `
            <div class="prop-row">
              <label>Percorso JSON (es: documento.numero):</label>
              <input type="text" id="prop_json_path" value="${this.escapeHtml(el.binding?.jsonPath || '')}">
            </div>
          ` : ''}

          ${el.type === 'barcode' ? `
            <div class="prop-row-split">
              <div class="prop-col">
                <label>Tipo Barcode:</label>
                <select id="prop_barcode_type">
                  <option value="CODE128" ${el.barcodeType === 'CODE128' ? 'selected' : ''}>Code 128 (Standard)</option>
                  <option value="EAN13" ${el.barcodeType === 'EAN13' ? 'selected' : ''}>EAN 13 (Merci/Retail)</option>
                  <option value="CODE39" ${el.barcodeType === 'CODE39' ? 'selected' : ''}>Code 39</option>
                </select>
              </div>
              <div class="prop-col">
                <label>Mostra Testo:</label>
                <select id="prop_barcode_text">
                  <option value="true" ${el.showBarcodeText ? 'selected' : ''}>Sì</option>
                  <option value="false" ${!el.showBarcodeText ? 'selected' : ''}>No</option>
                </select>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    if (this.activeTab === 'layout' || this.activeTab === 'all') {
      content += `
        <div class="prop-section-group">
          <div class="group-title">Posizione e Dimensioni Millimetriche</div>
          <div class="prop-row">
            <label>Sezione Report:</label>
            <select id="prop_section_id">
              ${Object.keys(SECTION_LABELS).map(key => `
                <option value="${key}" ${el.sectionId === key ? 'selected' : ''}>${SECTION_LABELS[key]}</option>
              `).join('')}
            </select>
          </div>
          <div class="prop-row-split">
            <div class="prop-col">
              <label>X (mm da sx):</label>
              <input type="number" id="prop_pos_x" value="${el.xMm}" min="0" max="210">
            </div>
            <div class="prop-col">
              <label>Y (mm dall'alto):</label>
              <input type="number" id="prop_pos_y" value="${el.yMm}" min="0" max="300">
            </div>
          </div>
          <div class="prop-row-split">
            <div class="prop-col">
              <label>Larghezza (mm):</label>
              <input type="number" id="prop_pos_w" value="${el.widthMm}" min="1" max="210">
            </div>
            <div class="prop-col">
              <label>Altezza (mm):</label>
              <input type="number" id="prop_pos_h" value="${el.heightMm}" min="1" max="300">
            </div>
          </div>
        </div>
      `;
    }

    return content;
  }

  attachEvents() {
    // Tabs switching
    this.container.querySelectorAll('.prop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        this.render();
      });
    });

    const el = this.selectedElement;
    if (!el) return;

    // Quick duplicate / delete
    const btnDup = this.container.querySelector('#btn_duplicate_elem');
    if (btnDup) {
      btnDup.addEventListener('click', () => this.onDuplicate(el));
    }
    const btnDel = this.container.querySelector('#btn_delete_elem');
    if (btnDel) {
      btnDel.addEventListener('click', () => this.onDelete(el.id));
    }

    // Name change
    const nameInp = this.container.querySelector('#prop_elem_name');
    if (nameInp) {
      nameInp.addEventListener('input', (e) => {
        el.name = e.target.value;
        this.onChange();
      });
    }

    // Static Value / Text
    const staticInp = this.container.querySelector('#prop_static_val');
    if (staticInp) {
      staticInp.addEventListener('input', (e) => {
        el.binding.staticValue = e.target.value;
        this.onChange();
      });
    }

    // Font Family
    const fontFam = this.container.querySelector('#prop_font_family');
    if (fontFam) {
      fontFam.addEventListener('change', (e) => {
        el.style.fontFamily = e.target.value;
        this.onChange();
      });
    }

    // Font Size
    const fontSize = this.container.querySelector('#prop_font_size');
    if (fontSize) {
      fontSize.addEventListener('change', (e) => {
        el.style.fontSizePt = parseFloat(e.target.value) || 10;
        this.onChange();
      });
    }

    // Text Align
    const textAlign = this.container.querySelector('#prop_text_align');
    if (textAlign) {
      textAlign.addEventListener('change', (e) => {
        el.style.textAlign = e.target.value;
        this.onChange();
      });
    }

    // Bold / Italic Toggles
    const btnBold = this.container.querySelector('#btn_toggle_bold');
    if (btnBold) {
      btnBold.addEventListener('click', () => {
        el.style.fontWeight = el.style.fontWeight === 'bold' ? 'normal' : 'bold';
        this.render();
        this.onChange();
      });
    }
    const btnItalic = this.container.querySelector('#btn_toggle_italic');
    if (btnItalic) {
      btnItalic.addEventListener('click', () => {
        el.style.fontStyle = el.style.fontStyle === 'italic' ? 'normal' : 'italic';
        this.render();
        this.onChange();
      });
    }

    // Colors
    const textColor = this.container.querySelector('#prop_text_color');
    if (textColor) {
      textColor.addEventListener('input', (e) => {
        el.style.color = e.target.value;
        this.onChange();
      });
    }

    const bgColor = this.container.querySelector('#prop_bg_color');
    if (bgColor) {
      bgColor.addEventListener('input', (e) => {
        el.style.backgroundColor = e.target.value;
        this.onChange();
      });
    }

    const btnTransp = this.container.querySelector('#btn_bg_transparent');
    if (btnTransp) {
      btnTransp.addEventListener('click', () => {
        el.style.backgroundColor = 'transparent';
        this.onChange();
      });
    }

    const borderColor = this.container.querySelector('#prop_border_color');
    if (borderColor) {
      borderColor.addEventListener('input', (e) => {
        el.style.borderColor = e.target.value;
        this.onChange();
      });
    }

    const borderWidth = this.container.querySelector('#prop_border_width');
    if (borderWidth) {
      borderWidth.addEventListener('change', (e) => {
        el.style.borderWidthPt = parseFloat(e.target.value) || 0;
        this.onChange();
      });
    }

    const borderRadius = this.container.querySelector('#prop_border_radius');
    if (borderRadius) {
      borderRadius.addEventListener('change', (e) => {
        el.style.borderRadiusMm = parseFloat(e.target.value) || 0;
        this.onChange();
      });
    }

    // Data Binding Source
    const bindSource = this.container.querySelector('#prop_bind_source');
    if (bindSource) {
      bindSource.addEventListener('change', (e) => {
        el.binding.source = e.target.value;
        this.render();
        this.onChange();
      });
    }

    // Spool coordinates
    const spoolRow = this.container.querySelector('#prop_spool_row');
    const spoolC1 = this.container.querySelector('#prop_spool_c1');
    const spoolC2 = this.container.querySelector('#prop_spool_c2');
    const onSpoolCoordChange = () => {
      if (spoolRow) el.binding.spoolRow = parseInt(spoolRow.value, 10) || 1;
      if (spoolC1) el.binding.spoolColStart = parseInt(spoolC1.value, 10) || 1;
      if (spoolC2) el.binding.spoolColEnd = parseInt(spoolC2.value, 10) || 20;
      
      // Update preview live text
      if (this.spoolEngine) {
        const live = this.spoolEngine.extractValue(el.binding.spoolRow, el.binding.spoolColStart, el.binding.spoolColEnd);
        const liveNode = this.container.querySelector('.spool-live-value');
        if (liveNode) liveNode.textContent = `"${live}"`;
      }
      this.onChange();
    };

    if (spoolRow) spoolRow.addEventListener('input', onSpoolCoordChange);
    if (spoolC1) spoolC1.addEventListener('input', onSpoolCoordChange);
    if (spoolC2) spoolC2.addEventListener('input', onSpoolCoordChange);

    // Format
    const bindFormat = this.container.querySelector('#prop_bind_format');
    if (bindFormat) {
      bindFormat.addEventListener('change', (e) => {
        el.binding.format = e.target.value;
        this.onChange();
      });
    }

    // Barcode settings
    const barcodeType = this.container.querySelector('#prop_barcode_type');
    if (barcodeType) {
      barcodeType.addEventListener('change', (e) => {
        el.barcodeType = e.target.value;
        this.onChange();
      });
    }

    // Layout (X, Y, W, H, Section)
    const posX = this.container.querySelector('#prop_pos_x');
    const posY = this.container.querySelector('#prop_pos_y');
    const posW = this.container.querySelector('#prop_pos_w');
    const posH = this.container.querySelector('#prop_pos_h');

    const onPosChange = () => {
      if (posX) el.xMm = Math.max(0, parseFloat(posX.value) || 0);
      if (posY) el.yMm = Math.max(0, parseFloat(posY.value) || 0);
      if (posW) el.widthMm = Math.max(1, parseFloat(posW.value) || 10);
      if (posH) el.heightMm = Math.max(1, parseFloat(posH.value) || 5);
      this.onChange();
    };

    if (posX) posX.addEventListener('change', onPosChange);
    if (posY) posY.addEventListener('change', onPosChange);
    if (posW) posW.addEventListener('change', onPosChange);
    if (posH) posH.addEventListener('change', onPosChange);

    // Section movement
    const secSelect = this.container.querySelector('#prop_section_id');
    if (secSelect) {
      secSelect.addEventListener('change', (e) => {
        const newSecId = e.target.value;
        if (newSecId !== el.sectionId && this.report) {
          // Remove from old section
          const oldSec = this.report.sections[el.sectionId];
          if (oldSec) {
            oldSec.elements = oldSec.elements.filter(item => item.id !== el.id);
          }
          // Add to new section
          el.sectionId = newSecId;
          const newSec = this.report.sections[newSecId];
          if (newSec) {
            newSec.elements.push(el);
          }
          this.onChange();
        }
      });
    }
  }

  getTypeLabel(type) {
    const map = {
      label: '🔤 Etichetta Testo',
      field: '🏷️ Campo Dati Spool',
      box: '🔲 Rettangolo / Box',
      line: '➖ Linea Divisoria',
      barcode: '📊 Codice a Barre',
      qrcode: '📱 QR Code 2D',
      table: '📋 Griglia Tabellare',
      pagenum: '🔢 Numerazione Pagina',
      image: '🖼️ Immagine Logo'
    };
    return map[type] || type.toUpperCase();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
