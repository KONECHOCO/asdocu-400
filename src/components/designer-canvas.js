// Microsoft Access-Style Banded Report Designer Canvas Component
import { SECTION_LABELS, SECTION_COLORS, createReportElement } from '../models/report-model.js';

export class DesignerCanvas {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.report = options.report;
    this.onSelectElement = options.onSelectElement || (() => {});
    this.onReportChange = options.onReportChange || (() => {});
    
    // Scale: 1mm = 3.779527559 pixels (standard 96 DPI screen)
    this.scale = 3.6; // slightly adjusted for crisp viewing
    this.selectedElementId = null;
    this.isDragging = false;
    this.dragMode = null; // 'move', 'resize-se', etc.
    this.dragStartMouse = { x: 0, y: 0 };
    this.dragStartElemPos = { xMm: 0, yMm: 0, widthMm: 0, heightMm: 0 };

    this.init();
  }

  setReport(report) {
    this.report = report;
    this.render();
  }

  setSelectedElementId(id) {
    this.selectedElementId = id;
    this.updateSelectionStyles();
  }

  init() {
    this.container.innerHTML = `
      <div class="designer-workspace" id="designerWorkspace">
        <!-- Top Horizontal Ruler -->
        <div class="ruler-horizontal-container">
          <div class="ruler-corner">mm</div>
          <div class="ruler-horizontal" id="rulerHorizontal"></div>
        </div>

        <div class="canvas-viewport">
          <!-- Left Vertical Ruler -->
          <div class="ruler-vertical" id="rulerVertical"></div>

          <!-- The Report Canvas Sheet -->
          <div class="paper-sheet" id="paperSheet">
            <div class="sections-container" id="sectionsContainer"></div>
          </div>
        </div>
      </div>
    `;

    this.renderRulers();
    this.render();
    this.attachGlobalEvents();
  }

  renderRulers() {
    const hr = this.container.querySelector('#rulerHorizontal');
    const vr = this.container.querySelector('#rulerVertical');
    if (!hr || !vr) return;

    // Width ruler (A4 = 210mm)
    let hHtml = '';
    for (let mm = 0; mm <= 220; mm += 10) {
      const leftPx = mm * this.scale;
      hHtml += `<div class="ruler-mark" style="left: ${leftPx}px;"><span>${mm}</span></div>`;
    }
    hr.innerHTML = hHtml;

    // Height ruler (A4 = 297mm)
    let vHtml = '';
    for (let mm = 0; mm <= 310; mm += 10) {
      const topPx = mm * this.scale;
      vHtml += `<div class="ruler-mark-v" style="top: ${topPx}px;"><span>${mm}</span></div>`;
    }
    vr.innerHTML = vHtml;
  }

  render() {
    if (!this.report) return;

    const paper = this.container.querySelector('#paperSheet');
    const sectionsContainer = this.container.querySelector('#sectionsContainer');
    if (!paper || !sectionsContainer) return;

    const widthPx = this.report.page.widthMm * this.scale;
    const minHeightPx = this.report.page.heightMm * this.scale;
    paper.style.width = `${widthPx}px`;
    paper.style.minHeight = `${minHeightPx}px`;

    // Render each section in Microsoft Access order:
    // reportHeader -> pageHeader -> detail -> pageFooter -> reportFooter
    const sectionKeys = ['reportHeader', 'pageHeader', 'detail', 'pageFooter', 'reportFooter'];
    let html = '';

    for (const key of sectionKeys) {
      const section = this.report.sections[key];
      if (!section) continue;

      const isVisible = section.visible !== false;
      const heightPx = section.heightMm * this.scale;
      const color = SECTION_COLORS[key] || '#3b82f6';
      const label = SECTION_LABELS[key] || section.name;

      html += `
        <div class="designer-section ${isVisible ? '' : 'section-collapsed'}" data-section-id="${key}" id="section_${key}">
          <!-- Section Band Header (Access Style) -->
          <div class="section-band-header" style="background: ${color};">
            <div class="band-left">
              <span class="band-toggle-icon" data-action="toggle-section" data-section="${key}">
                ${isVisible ? '▼' : '►'}
              </span>
              <span class="band-title">${label}</span>
              <span class="band-height-badge">${section.heightMm} mm</span>
            </div>
            <div class="band-actions">
              <button class="band-btn" title="Aggiungi Etichetta" data-action="quick-add" data-type="label" data-section="${key}">+ Testo</button>
              <button class="band-btn" title="Aggiungi Campo Spool" data-action="quick-add" data-type="field" data-section="${key}">+ Campo</button>
              <button class="band-btn" title="Aggiungi Rettangolo" data-action="quick-add" data-type="box" data-section="${key}">+ Box</button>
              <button class="band-btn" title="Aggiungi Linea" data-action="quick-add" data-type="line" data-section="${key}">+ Linea</button>
            </div>
          </div>

          <!-- Section Canvas Area -->
          <div class="section-canvas-body" style="height: ${isVisible ? heightPx + 'px' : '0px'};" data-section="${key}">
            <div class="grid-overlay" style="background-size: ${this.report.page.gridSizeMm * this.scale}px ${this.report.page.gridSizeMm * this.scale}px;"></div>
            <div class="section-elements-layer" data-section="${key}">
              ${this.renderSectionElements(section)}
            </div>
            <!-- Section Height Resizer Divider -->
            <div class="section-resize-handle" data-section="${key}" title="Trascina per ridimensionare l'altezza della sezione (mm)"></div>
          </div>
        </div>
      `;
    }

    sectionsContainer.innerHTML = html;
    this.updateSelectionStyles();
    this.attachSectionEvents();
  }

  renderSectionElements(section) {
    if (!section.elements || section.elements.length === 0) return '';

    return section.elements.map(el => {
      const leftPx = el.xMm * this.scale;
      const topPx = el.yMm * this.scale;
      const widthPx = el.widthMm * this.scale;
      const heightPx = el.heightMm * this.scale;

      const isSelected = el.id === this.selectedElementId;

      let innerContent = '';
      if (el.type === 'box') {
        innerContent = `
          <div class="box-preview" style="
            background: ${el.style.backgroundColor || 'transparent'};
            border: ${(el.style.borderWidthPt || 1) * 1}px ${el.style.borderStyle || 'solid'} ${el.style.borderColor || '#334155'};
            border-radius: ${(el.style.borderRadiusMm || 0) * this.scale}px;
          "></div>
        `;
      } else if (el.type === 'line') {
        innerContent = `
          <div class="line-preview" style="
            height: ${(el.style.borderWidthPt || 1.5)}px;
            background: ${el.style.borderColor || '#3b82f6'};
          "></div>
        `;
      } else if (el.type === 'label' || el.type === 'field' || el.type === 'pagenum') {
        const textVal = el.binding?.staticValue || el.name || 'Testo';
        const isField = el.type === 'field';
        innerContent = `
          <div class="text-preview ${isField ? 'field-indicator' : ''}" style="
            font-family: ${el.style.fontFamily || 'Helvetica'}, sans-serif;
            font-size: ${(el.style.fontSizePt || 10) * 1.3}px;
            font-weight: ${el.style.fontWeight || 'normal'};
            font-style: ${el.style.fontStyle || 'normal'};
            text-align: ${el.style.textAlign || 'left'};
            color: ${el.style.color || '#1e293b'};
          ">
            ${isField ? `<span class="badge-spool">[R${el.binding?.spoolRow || 1}:C${el.binding?.spoolColStart || 1}]</span>` : ''}
            <span>${this.escapeHtml(textVal)}</span>
          </div>
        `;
      } else if (el.type === 'barcode') {
        innerContent = `
          <div class="barcode-preview">
            <div class="barcode-bars">||| | |||| | || ||| || ||||</div>
            <span class="barcode-text">${this.escapeHtml(el.binding?.staticValue || 'BARCODE')}</span>
          </div>
        `;
      } else if (el.type === 'qrcode') {
        innerContent = `
          <div class="qrcode-preview">
            <div class="qr-grid-mock">
              <div class="qr-corner qr-tl"></div>
              <div class="qr-corner qr-tr"></div>
              <div class="qr-corner qr-bl"></div>
              <div class="qr-dots"></div>
            </div>
            <span class="qr-label">QR CODE</span>
          </div>
        `;
      } else if (el.type === 'table') {
        const cols = el.tableConfig?.columns || [];
        innerContent = `
          <div class="table-preview">
            <div class="table-mock-header" style="background: ${el.tableConfig?.headerBgColor || '#1e3a8a'}; color: ${el.tableConfig?.headerTextColor || '#fff'};">
              ${cols.map(c => `<div class="mock-th" style="width: ${c.widthMm * this.scale}px; text-align: ${c.align || 'left'};">${this.escapeHtml(c.title)}</div>`).join('')}
            </div>
            <div class="table-mock-rows">
              <div class="mock-tr">
                ${cols.map(c => `<div class="mock-td" style="width: ${c.widthMm * this.scale}px; text-align: ${c.align || 'left'};">Dato Spool</div>`).join('')}
              </div>
              <div class="mock-tr alt">
                ${cols.map(c => `<div class="mock-td" style="width: ${c.widthMm * this.scale}px; text-align: ${c.align || 'left'};">Dato Spool</div>`).join('')}
              </div>
            </div>
          </div>
        `;
      } else if (el.type === 'image') {
        innerContent = `
          <div class="image-preview">
            <span class="img-icon">🖼️</span>
            <span class="img-name">${this.escapeHtml(el.name)}</span>
          </div>
        `;
      }

      return `
        <div class="canvas-element ${isSelected ? 'is-selected' : ''}" 
             id="el_${el.id}" 
             data-elem-id="${el.id}" 
             data-section="${section.id}"
             style="
               left: ${leftPx}px; 
               top: ${topPx}px; 
               width: ${widthPx}px; 
               height: ${heightPx}px;
             ">
          ${innerContent}
          
          <!-- Access-style Resize Handles (8 points) -->
          <div class="elem-handle handle-nw" data-handle="nw"></div>
          <div class="elem-handle handle-n"  data-handle="n"></div>
          <div class="elem-handle handle-ne" data-handle="ne"></div>
          <div class="elem-handle handle-e"  data-handle="e"></div>
          <div class="elem-handle handle-se" data-handle="se"></div>
          <div class="elem-handle handle-s"  data-handle="s"></div>
          <div class="elem-handle handle-sw" data-handle="sw"></div>
          <div class="elem-handle handle-w"  data-handle="w"></div>
        </div>
      `;
    }).join('');
  }

  updateSelectionStyles() {
    this.container.querySelectorAll('.canvas-element').forEach(el => {
      if (el.dataset.elemId === this.selectedElementId) {
        el.classList.add('is-selected');
      } else {
        el.classList.remove('is-selected');
      }
    });
  }

  attachSectionEvents() {
    // Quick add buttons
    this.container.querySelectorAll('[data-action="quick-add"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const sectionId = btn.dataset.section;
        this.addNewElement(type, sectionId);
      });
    });

    // Toggle section collapse
    this.container.querySelectorAll('[data-action="toggle-section"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionId = btn.dataset.section;
        const sec = this.report.sections[sectionId];
        if (sec) {
          sec.visible = !sec.visible;
          this.render();
          this.onReportChange(this.report);
        }
      });
    });

    // Section height resizer drag
    this.container.querySelectorAll('.section-resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sectionId = handle.dataset.section;
        const sec = this.report.sections[sectionId];
        if (!sec) return;

        const startY = e.clientY;
        const startHeightMm = sec.heightMm;

        const onMouseMove = (moveEvent) => {
          const deltaY = moveEvent.clientY - startY;
          const deltaMm = Math.round(deltaY / this.scale);
          const newHeightMm = Math.max(10, startHeightMm + deltaMm);
          sec.heightMm = newHeightMm;
          
          const sectionEl = this.container.querySelector(`#section_${sectionId} .section-canvas-body`);
          const badgeEl = this.container.querySelector(`#section_${sectionId} .band-height-badge`);
          if (sectionEl) sectionEl.style.height = `${newHeightMm * this.scale}px`;
          if (badgeEl) badgeEl.textContent = `${newHeightMm} mm`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          this.render();
          this.onReportChange(this.report);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  attachGlobalEvents() {
    // Click on canvas to deselect or select element
    this.container.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.elem-handle');
      const elemNode = e.target.closest('.canvas-element');

      if (handle && elemNode) {
        // Start Resizing
        e.preventDefault();
        e.stopPropagation();
        const elemId = elemNode.dataset.elemId;
        const handleType = handle.dataset.handle;
        this.startDrag(e, elemId, `resize-${handleType}`);
        return;
      }

      if (elemNode) {
        // Start Moving element
        e.preventDefault();
        e.stopPropagation();
        const elemId = elemNode.dataset.elemId;
        this.selectedElementId = elemId;
        this.updateSelectionStyles();
        this.onSelectElement(this.findElementById(elemId));
        this.startDrag(e, elemId, 'move');
        return;
      }

      // Clicked on empty canvas -> deselect
      if (!e.target.closest('.band-btn') && !e.target.closest('.section-resize-handle')) {
        this.selectedElementId = null;
        this.updateSelectionStyles();
        this.onSelectElement(null);
      }
    });

    // Keyboard navigation (Nudge with arrow keys, Delete)
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (!this.selectedElementId) return;
      const el = this.findElementById(this.selectedElementId);
      if (!el) return;

      const step = e.shiftKey ? 5 : 1; // 1mm or 5mm with Shift

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        el.xMm = Math.max(0, el.xMm - step);
        this.render();
        this.onReportChange(this.report);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        el.xMm += step;
        this.render();
        this.onReportChange(this.report);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        el.yMm = Math.max(0, el.yMm - step);
        this.render();
        this.onReportChange(this.report);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        el.yMm += step;
        this.render();
        this.onReportChange(this.report);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.deleteElement(this.selectedElementId);
      }
    });
  }

  startDrag(e, elemId, mode) {
    this.isDragging = true;
    this.dragMode = mode;
    this.dragStartMouse = { x: e.clientX, y: e.clientY };

    const el = this.findElementById(elemId);
    if (!el) return;

    this.dragStartElemPos = {
      xMm: el.xMm,
      yMm: el.yMm,
      widthMm: el.widthMm,
      heightMm: el.heightMm,
      sectionId: el.sectionId
    };

    const onMouseMove = (moveEvent) => {
      if (!this.isDragging) return;

      const deltaXpx = moveEvent.clientX - this.dragStartMouse.x;
      const deltaYpx = moveEvent.clientY - this.dragStartMouse.y;
      const deltaXmm = deltaXpx / this.scale;
      const deltaYmm = deltaYpx / this.scale;

      const snap = this.report.page.snapToGrid ? (this.report.page.gridSizeMm || 2) : 1;
      const snapVal = (v) => Math.round(v / snap) * snap;

      if (this.dragMode === 'move') {
        el.xMm = Math.max(0, snapVal(this.dragStartElemPos.xMm + deltaXmm));
        el.yMm = Math.max(0, snapVal(this.dragStartElemPos.yMm + deltaYmm));
      } else if (this.dragMode.startsWith('resize-')) {
        const handle = this.dragMode.replace('resize-', '');
        
        if (handle.includes('e')) {
          el.widthMm = Math.max(5, snapVal(this.dragStartElemPos.widthMm + deltaXmm));
        }
        if (handle.includes('s')) {
          el.heightMm = Math.max(2, snapVal(this.dragStartElemPos.heightMm + deltaYmm));
        }
        if (handle.includes('w')) {
          const newW = Math.max(5, snapVal(this.dragStartElemPos.widthMm - deltaXmm));
          const diff = this.dragStartElemPos.widthMm - newW;
          el.xMm = snapVal(this.dragStartElemPos.xMm + diff);
          el.widthMm = newW;
        }
        if (handle.includes('n')) {
          const newH = Math.max(2, snapVal(this.dragStartElemPos.heightMm - deltaYmm));
          const diff = this.dragStartElemPos.heightMm - newH;
          el.yMm = snapVal(this.dragStartElemPos.yMm + diff);
          el.heightMm = newH;
        }
      }

      // Fast update element style without full re-render
      const node = this.container.querySelector(`#el_${el.id}`);
      if (node) {
        node.style.left = `${el.xMm * this.scale}px`;
        node.style.top = `${el.yMm * this.scale}px`;
        node.style.width = `${el.widthMm * this.scale}px`;
        node.style.height = `${el.heightMm * this.scale}px`;
      }
      this.onSelectElement(el);
    };

    const onMouseUp = () => {
      this.isDragging = false;
      this.dragMode = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.render();
      this.onReportChange(this.report);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  addNewElement(type, sectionId = 'pageHeader', options = {}) {
    const sec = this.report.sections[sectionId] || this.report.sections.pageHeader;
    const newEl = createReportElement(type, {
      sectionId: sec.id,
      xMm: options.xMm ?? 15,
      yMm: options.yMm ?? 5,
      ...options
    });

    sec.elements.push(newEl);
    this.selectedElementId = newEl.id;
    this.render();
    this.onSelectElement(newEl);
    this.onReportChange(this.report);
    return newEl;
  }

  deleteElement(elemId) {
    for (const key of Object.keys(this.report.sections)) {
      const sec = this.report.sections[key];
      const idx = sec.elements.findIndex(e => e.id === elemId);
      if (idx !== -1) {
        sec.elements.splice(idx, 1);
        this.selectedElementId = null;
        this.render();
        this.onSelectElement(null);
        this.onReportChange(this.report);
        break;
      }
    }
  }

  findElementById(elemId) {
    if (!elemId) return null;
    for (const key of Object.keys(this.report.sections)) {
      const el = this.report.sections[key].elements.find(e => e.id === elemId);
      if (el) return el;
    }
    return null;
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
