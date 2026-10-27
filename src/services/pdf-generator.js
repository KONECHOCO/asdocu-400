// PDF Generator Engine for SpoolForge / ASDOCU Web Designer
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export class PdfGenerator {
  /**
   * Generates a jsPDF document from the report model and data context
   * @param {Object} report The report structure with sections and elements
   * @param {Object} dataContext Contains { spoolEngine, jsonData, scriptResult }
   * @returns {Promise<jsPDF>}
   */
  static async generate(report, dataContext = {}) {
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

    // Prepare Barcode and QR Code cache to render asynchronously
    const renderedImages = await this.preRenderCodes(report, dataContext);

    // Track current vertical position on page
    let currentY = margins.top;

    // 1. Render Report Header (Page 1 only)
    if (report.sections.reportHeader && report.sections.reportHeader.visible) {
      await this.renderSectionElements(doc, report.sections.reportHeader, currentY, dataContext, renderedImages);
      currentY += report.sections.reportHeader.heightMm;
    }

    // 2. Render Page Header
    const pageHeaderSection = report.sections.pageHeader;
    const pageHeaderStartY = currentY;
    if (pageHeaderSection && pageHeaderSection.visible) {
      await this.renderSectionElements(doc, pageHeaderSection, currentY, dataContext, renderedImages);
      currentY += pageHeaderSection.heightMm;
    }

    // 3. Render Detail Section (Repeating Table and/or detail elements)
    const detailSection = report.sections.detail;
    if (detailSection && detailSection.visible) {
      // Find if there is a dynamic table in detail
      const tableElem = detailSection.elements.find(el => el.type === 'table');
      
      if (tableElem) {
        // Extract rows from spool or json
        let tableRows = [];
        let headers = [];

        if (tableElem.tableConfig && tableElem.tableConfig.columns) {
          headers = tableElem.tableConfig.columns.map(c => c.title);

          if (dataContext.jsonData && dataContext.jsonData.documento && dataContext.jsonData.documento.righe) {
            // Map from JSON
            tableRows = dataContext.jsonData.documento.righe.map(row => {
              return tableElem.tableConfig.columns.map(col => {
                const val = row[col.jsonKey || col.id];
                return val !== undefined ? String(val) : '';
              });
            });
          } else if (dataContext.spoolEngine) {
            // Extract from AS/400 Spool
            const extracted = dataContext.spoolEngine.extractTable(
              tableElem.tableConfig.spoolStartRow || 1,
              tableElem.tableConfig.spoolEndRow || 30,
              tableElem.tableConfig.columns
            );
            tableRows = extracted.map(row => {
              return tableElem.tableConfig.columns.map(col => {
                const key = col.jsonKey || col.id;
                return row[key] !== undefined ? String(row[key]) : '';
              });
            });
          }
        }

        // Column styles for autotable
        const columnStyles = {};
        if (tableElem.tableConfig && tableElem.tableConfig.columns) {
          tableElem.tableConfig.columns.forEach((col, idx) => {
            columnStyles[idx] = {
              halign: col.align || 'left',
              cellWidth: col.widthMm || 'auto'
            };
          });
        }

        // Execute autoTable
        autoTable(doc, {
          startY: currentY + (tableElem.yMm || 2),
          margin: { left: tableElem.xMm || margins.left, right: margins.right },
          head: [headers],
          body: tableRows,
          theme: tableElem.tableConfig?.showGridLines ? 'grid' : 'striped',
          headStyles: {
            fillColor: tableElem.tableConfig?.headerBgColor || '#1e3a8a',
            textColor: tableElem.tableConfig?.headerTextColor || '#ffffff',
            fontSize: tableElem.tableConfig?.headerFontSizePt || 8.5,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: tableElem.tableConfig?.rowFontSizePt || 8,
            textColor: '#1e293b'
          },
          alternateRowStyles: tableElem.tableConfig?.alternateRowBg ? {
            fillColor: tableElem.tableConfig?.alternateRowColor || '#f8fafc'
          } : {},
          styles: {
            lineColor: tableElem.tableConfig?.gridColor || '#cbd5e1',
            lineWidth: 0.2
          },
          didDrawPage: (data) => {
            // When autoTable splits across pages, re-render page header if not on page 1
            if (data.pageNumber > 1 && pageHeaderSection && pageHeaderSection.visible) {
              this.renderSectionElements(doc, pageHeaderSection, margins.top, dataContext, renderedImages);
            }
          }
        });

        // Update currentY after table
        currentY = doc.lastAutoTable.finalY + 4;
      }

      // Render non-table detail elements
      const nonTableElements = detailSection.elements.filter(el => el.type !== 'table');
      if (nonTableElements.length > 0) {
        await this.renderElementsList(doc, nonTableElements, currentY, dataContext, renderedImages);
        currentY += detailSection.heightMm;
      }
    }

    // 4. Render Report Footer (after detail)
    const reportFooterSection = report.sections.reportFooter;
    if (reportFooterSection && reportFooterSection.visible) {
      // Check if report footer fits on page, else add page
      if (currentY + reportFooterSection.heightMm > pageHeight - margins.bottom - (report.sections.pageFooter?.heightMm || 0)) {
        doc.addPage();
        currentY = margins.top;
      }
      await this.renderSectionElements(doc, reportFooterSection, currentY, dataContext, renderedImages);
      currentY += reportFooterSection.heightMm;
    }

    // 5. Render Page Footer on every page
    const pageFooterSection = report.sections.pageFooter;
    if (pageFooterSection && pageFooterSection.visible) {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - margins.bottom - pageFooterSection.heightMm;

      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        await this.renderSectionElements(doc, pageFooterSection, footerY, dataContext, renderedImages, p, totalPages);
      }
    }

    return doc;
  }

  /**
   * Pre-renders dynamic barcodes and QR codes to dataURLs
   */
  static async preRenderCodes(report, dataContext) {
    const rendered = {};

    for (const sectionKey of Object.keys(report.sections)) {
      const section = report.sections[sectionKey];
      if (!section || !section.elements) continue;

      for (const el of section.elements) {
        if (el.type === 'barcode') {
          const val = this.resolveValue(el, dataContext) || '0000000000';
          try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, val, {
              format: el.barcodeType || 'CODE128',
              displayValue: el.showBarcodeText ?? true,
              fontSize: 14,
              margin: 4,
              height: 45
            });
            rendered[el.id] = canvas.toDataURL('image/png');
          } catch (err) {
            console.warn('Barcode generation warning for', el.id, err);
          }
        } else if (el.type === 'qrcode') {
          const val = this.resolveValue(el, dataContext) || 'https://ibm.com/as400';
          try {
            rendered[el.id] = await QRCode.toDataURL(val, {
              margin: 1,
              width: 160,
              errorCorrectionLevel: 'M'
            });
          } catch (err) {
            console.warn('QR code generation warning for', el.id, err);
          }
        }
      }
    }

    return rendered;
  }

  /**
   * Renders all elements of a section at a target Y offset
   */
  static async renderSectionElements(doc, section, sectionBaseY, dataContext, renderedImages, pageNo = 1, totalPages = 1) {
    if (!section.elements || section.elements.length === 0) return;
    await this.renderElementsList(doc, section.elements, sectionBaseY, dataContext, renderedImages, pageNo, totalPages);
  }

  static async renderElementsList(doc, elements, sectionBaseY, dataContext, renderedImages, pageNo = 1, totalPages = 1) {
    // Sort elements so boxes/shapes render before text (Z-index order)
    const sorted = [...elements].sort((a, b) => {
      const order = { box: 1, line: 2, image: 3, barcode: 4, qrcode: 5, label: 6, field: 7, pagenum: 8 };
      return (order[a.type] || 5) - (order[b.type] || 5);
    });

    for (const el of sorted) {
      const x = el.xMm;
      const y = sectionBaseY + el.yMm;
      const w = el.widthMm;
      const h = el.heightMm;

      if (el.type === 'box') {
        // Draw Box / Card
        const hasFill = el.style.backgroundColor && el.style.backgroundColor !== 'transparent';
        const hasBorder = (el.style.borderWidthPt || 0) > 0;

        if (hasFill) {
          const rgb = this.hexToRgb(el.style.backgroundColor);
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
        }
        if (hasBorder) {
          const rgb = this.hexToRgb(el.style.borderColor || '#000000');
          doc.setDrawColor(rgb.r, rgb.g, rgb.b);
          doc.setLineWidth((el.style.borderWidthPt || 1) * 0.352778); // pt to mm
        }

        const radius = el.style.borderRadiusMm || 0;
        const style = hasFill && hasBorder ? 'FD' : (hasFill ? 'F' : 'D');

        if (hasFill || hasBorder) {
          if (radius > 0) {
            doc.roundedRect(x, y, w, h, radius, radius, style);
          } else {
            doc.rect(x, y, w, h, style);
          }
        }
      } else if (el.type === 'line') {
        const rgb = this.hexToRgb(el.style.borderColor || '#3b82f6');
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        doc.setLineWidth((el.style.borderWidthPt || 1) * 0.352778);
        doc.line(x, y, x + w, y);
      } else if (el.type === 'barcode' || el.type === 'qrcode') {
        const dataUrl = renderedImages[el.id];
        if (dataUrl) {
          doc.addImage(dataUrl, 'PNG', x, y, w, h);
        }
      } else if (el.type === 'image') {
        if (el.imageData) {
          try {
            doc.addImage(el.imageData, 'PNG', x, y, w, h);
          } catch (e) {
            console.warn('Image render error', e);
          }
        }
      } else if (el.type === 'label' || el.type === 'field' || el.type === 'pagenum') {
        let text = this.resolveValue(el, dataContext);

        if (el.type === 'pagenum') {
          text = text.replace('{PAGENO}', pageNo).replace('{TOTALPAGES}', totalPages);
        }

        if (!text && el.type === 'label') {
          text = el.binding?.staticValue || '';
        }

        // Apply Font Styles
        const fontSize = el.style.fontSizePt || 10;
        doc.setFontSize(fontSize);
        
        let fontStyle = 'normal';
        if (el.style.fontWeight === 'bold' && el.style.fontStyle === 'italic') fontStyle = 'bolditalic';
        else if (el.style.fontWeight === 'bold') fontStyle = 'bold';
        else if (el.style.fontStyle === 'italic') fontStyle = 'italic';

        doc.setFont(this.mapFontFamily(el.style.fontFamily), fontStyle);

        const textColor = this.hexToRgb(el.style.color || '#1e293b');
        doc.setTextColor(textColor.r, textColor.g, textColor.b);

        // Alignment and Text Placement
        let textX = x;
        const align = el.style.textAlign || 'left';
        if (align === 'center') {
          textX = x + (w / 2);
        } else if (align === 'right') {
          textX = x + w;
        }

        // Vertical adjustment (baseline offset approx 75% of font height)
        const baselineY = y + (fontSize * 0.352778) + 1;

        doc.text(String(text), textX, baselineY, {
          align,
          maxWidth: w
        });
      }
    }
  }

  static resolveValue(el, dataContext) {
    if (!el.binding) return el.name || '';

    const source = el.binding.source;
    if (source === 'static') {
      return el.binding.staticValue || '';
    }

    if (source === 'spool') {
      if (dataContext.spoolEngine) {
        const raw = dataContext.spoolEngine.extractValue(
          el.binding.spoolRow || 1,
          el.binding.spoolColStart || 1,
          el.binding.spoolColEnd || 20
        );
        return dataContext.spoolEngine.formatValue(raw, el.binding.format);
      }
      return el.binding.staticValue || '';
    }

    if (source === 'json') {
      if (dataContext.jsonData && el.binding.jsonPath) {
        const val = this.getJsonPath(dataContext.jsonData, el.binding.jsonPath);
        return val !== undefined ? String(val) : (el.binding.staticValue || '');
      }
      return el.binding.staticValue || '';
    }

    if (source === 'formula') {
      return el.binding.staticValue || '';
    }

    return el.binding.staticValue || '';
  }

  static getJsonPath(obj, path) {
    try {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    } catch {
      return '';
    }
  }

  static hexToRgb(hex) {
    if (!hex || hex === 'transparent') return { r: 255, g: 255, b: 255 };
    const cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
      return {
        r: parseInt(cleaned[0] + cleaned[0], 16),
        g: parseInt(cleaned[1] + cleaned[1], 16),
        b: parseInt(cleaned[2] + cleaned[2], 16)
      };
    }
    const num = parseInt(cleaned, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  static mapFontFamily(family) {
    const lower = (family || '').toLowerCase();
    if (lower.includes('courier') || lower.includes('mono')) return 'courier';
    if (lower.includes('times') || lower.includes('serif')) return 'times';
    return 'helvetica'; // default sans-serif
  }
}
