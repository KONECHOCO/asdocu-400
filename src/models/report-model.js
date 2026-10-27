// Report Document and Element Data Models (Access / ASDOCU Style)

export const SECTION_TYPES = {
  REPORT_HEADER: 'reportHeader',
  PAGE_HEADER: 'pageHeader',
  DETAIL: 'detail',
  PAGE_FOOTER: 'pageFooter',
  REPORT_FOOTER: 'reportFooter'
};

export const SECTION_LABELS = {
  reportHeader: 'Intestazione Report (Report Header)',
  pageHeader: 'Intestazione Pagina (Page Header)',
  detail: 'Corpo Dettaglio (Detail Section - Ripetuto)',
  pageFooter: 'Piede Pagina (Page Footer)',
  reportFooter: 'Piede Report (Report Footer)'
};

export const SECTION_COLORS = {
  reportHeader: '#6366f1',
  pageHeader: '#3b82f6',
  detail: '#10b981',
  pageFooter: '#f59e0b',
  reportFooter: '#ec4899'
};

export function createDefaultReport() {
  return {
    meta: {
      title: 'Nuovo Documento AS400',
      version: '1.0',
      author: 'ASDOCU Studio',
      created: new Date().toISOString()
    },
    page: {
      format: 'a4', // a4, letter
      orientation: 'portrait', // portrait, landscape
      widthMm: 210,
      heightMm: 297,
      marginTopMm: 10,
      marginBottomMm: 10,
      marginLeftMm: 10,
      marginRightMm: 10,
      gridSizeMm: 2,
      snapToGrid: true
    },
    sections: {
      reportHeader: {
        id: 'reportHeader',
        name: 'Intestazione Report',
        heightMm: 25,
        visible: true,
        elements: []
      },
      pageHeader: {
        id: 'pageHeader',
        name: 'Intestazione Pagina',
        heightMm: 45,
        visible: true,
        elements: []
      },
      detail: {
        id: 'detail',
        name: 'Corpo / Dettaglio',
        heightMm: 60,
        visible: true,
        elements: []
      },
      pageFooter: {
        id: 'pageFooter',
        name: 'Piede di Pagina',
        heightMm: 20,
        visible: true,
        elements: []
      },
      reportFooter: {
        id: 'reportFooter',
        name: 'Piede del Report',
        heightMm: 30,
        visible: true,
        elements: []
      }
    }
  };
}

export function createReportElement(type, options = {}) {
  const id = options.id || 'elem_' + Math.random().toString(36).substring(2, 9);
  
  const base = {
    id,
    type, // 'label', 'field', 'table', 'barcode', 'qrcode', 'box', 'line', 'image', 'pagenum'
    name: options.name || `${type}_${id.slice(-4)}`,
    sectionId: options.sectionId || 'pageHeader',
    xMm: options.xMm ?? 10,
    yMm: options.yMm ?? 5,
    widthMm: options.widthMm ?? 40,
    heightMm: options.heightMm ?? 8,
    style: {
      fontFamily: options.style?.fontFamily || 'Helvetica',
      fontSizePt: options.style?.fontSizePt || 10,
      fontWeight: options.style?.fontWeight || 'normal', // normal, bold
      fontStyle: options.style?.fontStyle || 'normal', // normal, italic
      textAlign: options.style?.textAlign || 'left', // left, center, right
      color: options.style?.color || '#1e293b',
      backgroundColor: options.style?.backgroundColor || 'transparent',
      borderColor: options.style?.borderColor || '#94a3b8',
      borderWidthPt: options.style?.borderWidthPt || 0,
      borderStyle: options.style?.borderStyle || 'solid',
      borderRadiusMm: options.style?.borderRadiusMm || 0,
      paddingMm: options.style?.paddingMm || 1,
      opacity: options.style?.opacity ?? 1
    },
    binding: {
      source: options.binding?.source || (type === 'field' ? 'spool' : 'static'), // 'static', 'spool', 'json', 'formula'
      staticValue: options.binding?.staticValue || (type === 'label' ? 'Etichetta Testo' : ''),
      spoolRow: options.binding?.spoolRow ?? 1,
      spoolColStart: options.binding?.spoolColStart ?? 1,
      spoolColEnd: options.binding?.spoolColEnd ?? 20,
      jsonPath: options.binding?.jsonPath || '',
      formulaExpr: options.binding?.formulaExpr || '',
      format: options.binding?.format || 'text' // text, currency_eur, date_it, number_2dec
    }
  };

  // Specific element defaults
  if (type === 'box') {
    base.widthMm = options.widthMm ?? 60;
    base.heightMm = options.heightMm ?? 25;
    base.style.borderWidthPt = options.style?.borderWidthPt ?? 1;
    base.style.borderColor = options.style?.borderColor || '#334155';
    base.style.backgroundColor = options.style?.backgroundColor || '#f8fafc';
    base.style.borderRadiusMm = options.style?.borderRadiusMm ?? 2;
  } else if (type === 'line') {
    base.widthMm = options.widthMm ?? 190;
    base.heightMm = options.heightMm ?? 1;
    base.style.borderWidthPt = options.style?.borderWidthPt ?? 1.5;
    base.style.borderColor = options.style?.borderColor || '#3b82f6';
  } else if (type === 'barcode') {
    base.widthMm = options.widthMm ?? 55;
    base.heightMm = options.heightMm ?? 16;
    base.barcodeType = options.barcodeType || 'CODE128'; // CODE128, EAN13, CODE39
    base.showBarcodeText = options.showBarcodeText ?? true;
    base.binding.staticValue = options.binding?.staticValue || 'DDT-2026-98421';
  } else if (type === 'qrcode') {
    base.widthMm = options.widthMm ?? 22;
    base.heightMm = options.heightMm ?? 22;
    base.binding.staticValue = options.binding?.staticValue || 'https://agenziaentrate.gov.it/sdi/fattura-elettronica-2026';
  } else if (type === 'image') {
    base.widthMm = options.widthMm ?? 35;
    base.heightMm = options.heightMm ?? 15;
    base.imageData = options.imageData || null; // base64 or URL
  } else if (type === 'pagenum') {
    base.widthMm = options.widthMm ?? 30;
    base.heightMm = options.heightMm ?? 6;
    base.style.textAlign = 'right';
    base.style.fontSizePt = 9;
    base.binding.staticValue = 'Pagina {PAGENO} di {TOTALPAGES}';
  } else if (type === 'table') {
    base.widthMm = options.widthMm ?? 190;
    base.heightMm = options.heightMm ?? 50;
    base.tableConfig = options.tableConfig || {
      spoolStartRow: 14,
      spoolEndRow: 32,
      columns: [
        { id: 'col_cod', title: 'Cod. Articolo', spoolColStart: 1, spoolColEnd: 15, widthMm: 30, align: 'left', jsonKey: 'codice' },
        { id: 'col_desc', title: 'Descrizione Merci / Prestazioni', spoolColStart: 16, spoolColEnd: 55, widthMm: 75, align: 'left', jsonKey: 'descrizione' },
        { id: 'col_um', title: 'U.M.', spoolColStart: 56, spoolColEnd: 60, widthMm: 12, align: 'center', jsonKey: 'um' },
        { id: 'col_qta', title: 'Quantità', spoolColStart: 61, spoolColEnd: 70, widthMm: 18, align: 'right', jsonKey: 'qta' },
        { id: 'col_prezzo', title: 'Prezzo Unit.', spoolColStart: 71, spoolColEnd: 82, widthMm: 25, align: 'right', jsonKey: 'prezzo' },
        { id: 'col_tot', title: 'Importo €', spoolColStart: 83, spoolColEnd: 98, widthMm: 30, align: 'right', jsonKey: 'totale' }
      ],
      headerBgColor: '#1e293b',
      headerTextColor: '#ffffff',
      headerFontSizePt: 9,
      rowFontSizePt: 8.5,
      rowHeightMm: 6,
      alternateRowBg: true,
      alternateRowColor: '#f8fafc',
      showGridLines: true,
      gridColor: '#cbd5e1'
    };
  }

  return base;
}
