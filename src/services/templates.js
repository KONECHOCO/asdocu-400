// Pre-built AS/400 Report Templates (ASDOCU Style)
import { createReportElement } from '../models/report-model.js';

export function getTemplateFattura() {
  return {
    meta: {
      title: 'Fattura Accompagnatoria AS/400',
      description: 'Template grafico stile ASDOCU per Fattura di vendita con tabelle, barcode e QR-Code SDI',
      type: 'fattura'
    },
    page: {
      format: 'a4',
      orientation: 'portrait',
      widthMm: 210,
      heightMm: 297,
      marginTopMm: 8,
      marginBottomMm: 8,
      marginLeftMm: 10,
      marginRightMm: 10,
      gridSizeMm: 2,
      snapToGrid: true
    },
    sections: {
      reportHeader: {
        id: 'reportHeader',
        name: 'Intestazione Aziendale',
        heightMm: 28,
        visible: true,
        elements: [
          // Company header banner box
          createReportElement('box', {
            id: 'box_hdr',
            xMm: 10, yMm: 2, widthMm: 190, heightMm: 24,
            style: { backgroundColor: '#f8fafc', borderColor: '#3b82f6', borderWidthPt: 1.5, borderRadiusMm: 3 }
          }),
          // Logo placeholder / badge
          createReportElement('label', {
            id: 'lbl_logo',
            xMm: 14, yMm: 5, widthMm: 45, heightMm: 10,
            binding: { staticValue: 'ACCIAIERIE ITALIA' },
            style: { fontSizePt: 13, fontWeight: 'bold', color: '#1d4ed8' }
          }),
          createReportElement('label', {
            id: 'lbl_mitt_sub',
            xMm: 14, yMm: 15, widthMm: 85, heightMm: 9,
            binding: { source: 'spool', spoolRow: 6, spoolColStart: 1, spoolColEnd: 50, staticValue: 'Via dell\'Industria 45 - 20100 Milano (MI) | P.IVA IT03948572019' },
            style: { fontSizePt: 7.5, color: '#475569' }
          }),
          // Document Title badge
          createReportElement('box', {
            id: 'box_doc_title',
            xMm: 120, yMm: 5, widthMm: 76, heightMm: 9,
            style: { backgroundColor: '#1e293b', borderColor: '#0f172a', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_doc_title',
            xMm: 122, yMm: 6.5, widthMm: 72, heightMm: 6,
            binding: { staticValue: 'FATTURA ACCOMPAGNATORIA' },
            style: { fontSizePt: 10, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }
          }),
          createReportElement('label', {
            id: 'lbl_doc_sub',
            xMm: 120, yMm: 16, widthMm: 76, heightMm: 8,
            binding: { staticValue: 'Documento Elettronico AS/400 (art. 21 DPR 633/72)' },
            style: { fontSizePt: 7.5, color: '#64748b', textAlign: 'right' }
          })
        ]
      },
      pageHeader: {
        id: 'pageHeader',
        name: 'Dati Documento & Destinatario',
        heightMm: 58,
        visible: true,
        elements: [
          // Box Destinatario (Left)
          createReportElement('box', {
            id: 'box_dest',
            xMm: 10, yMm: 2, widthMm: 95, heightMm: 34,
            style: { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_dest_hdr',
            xMm: 13, yMm: 4, widthMm: 85, heightMm: 5,
            binding: { staticValue: 'INTESTATARIO / SPETTABILE DITTA:' },
            style: { fontSizePt: 7.5, fontWeight: 'bold', color: '#64748b' }
          }),
          // Bound customer name from Spool row 11 cols 1-40
          createReportElement('field', {
            id: 'fld_ragione_soc',
            xMm: 13, yMm: 9, widthMm: 88, heightMm: 6,
            binding: { source: 'spool', spoolRow: 11, spoolColStart: 1, spoolColEnd: 45, staticValue: 'BEMA LOGISTICS & TRANSPORT S.R.L.' },
            style: { fontSizePt: 9.5, fontWeight: 'bold', color: '#0f172a' }
          }),
          createReportElement('field', {
            id: 'fld_ind_dest',
            xMm: 13, yMm: 15, widthMm: 88, heightMm: 5,
            binding: { source: 'spool', spoolRow: 12, spoolColStart: 1, spoolColEnd: 45, staticValue: 'VIA E. MATTEI, 18' },
            style: { fontSizePt: 8.5, color: '#334155' }
          }),
          createReportElement('field', {
            id: 'fld_cap_citta',
            xMm: 13, yMm: 20, widthMm: 88, heightMm: 5,
            binding: { source: 'spool', spoolRow: 13, spoolColStart: 1, spoolColEnd: 45, staticValue: '24040 STEZZANO (BG) - ITALIA' },
            style: { fontSizePt: 8.5, color: '#334155' }
          }),
          createReportElement('field', {
            id: 'fld_piva',
            xMm: 13, yMm: 25, widthMm: 88, heightMm: 5,
            binding: { source: 'spool', spoolRow: 14, spoolColStart: 1, spoolColEnd: 45, staticValue: 'PARTITA IVA: IT08472910963  SDI: M5UXCR1' },
            style: { fontSizePt: 8, fontWeight: 'bold', color: '#0369a1' }
          }),

          // Box Document Details (Right)
          createReportElement('box', {
            id: 'box_details',
            xMm: 110, yMm: 2, widthMm: 90, heightMm: 34,
            style: { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_num_title',
            xMm: 113, yMm: 4, widthMm: 40, heightMm: 5,
            binding: { staticValue: 'NUMERO DOCUMENTO' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('field', {
            id: 'fld_num_doc',
            xMm: 113, yMm: 9, widthMm: 40, heightMm: 6,
            binding: { source: 'spool', spoolRow: 5, spoolColStart: 85, spoolColEnd: 105, staticValue: 'FA-2026/008492' },
            style: { fontSizePt: 10, fontWeight: 'bold', color: '#1e40af' }
          }),
          createReportElement('label', {
            id: 'lbl_data_title',
            xMm: 155, yMm: 4, widthMm: 40, heightMm: 5,
            binding: { staticValue: 'DATA DOCUMENTO' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('field', {
            id: 'fld_data_doc',
            xMm: 155, yMm: 9, widthMm: 40, heightMm: 6,
            binding: { source: 'spool', spoolRow: 6, spoolColStart: 85, spoolColEnd: 105, staticValue: '24/10/2026' },
            style: { fontSizePt: 9.5, fontWeight: 'bold', color: '#0f172a' }
          }),
          createReportElement('label', {
            id: 'lbl_cli_title',
            xMm: 113, yMm: 16, widthMm: 40, heightMm: 5,
            binding: { staticValue: 'CODICE CLIENTE' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('field', {
            id: 'fld_cod_cli',
            xMm: 113, yMm: 21, widthMm: 40, heightMm: 5,
            binding: { source: 'spool', spoolRow: 7, spoolColStart: 85, spoolColEnd: 105, staticValue: 'C004829' },
            style: { fontSizePt: 8.5, color: '#0f172a' }
          }),
          createReportElement('label', {
            id: 'lbl_valuta_title',
            xMm: 155, yMm: 16, widthMm: 40, heightMm: 5,
            binding: { staticValue: 'VALUTA' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('label', {
            id: 'lbl_valuta_val',
            xMm: 155, yMm: 21, widthMm: 40, heightMm: 5,
            binding: { staticValue: 'EUR (€)' },
            style: { fontSizePt: 8.5, color: '#0f172a' }
          }),

          // Box Condizioni Pagamento & Trasporto (Full width bar)
          createReportElement('box', {
            id: 'box_condiz',
            xMm: 10, yMm: 38, widthMm: 190, heightMm: 16,
            style: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderWidthPt: 0.8, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_pag_hdr',
            xMm: 13, yMm: 40, widthMm: 35, heightMm: 4,
            binding: { staticValue: 'CONDIZIONI PAGAMENTO:' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#475569' }
          }),
          createReportElement('field', {
            id: 'fld_pag_val',
            xMm: 50, yMm: 40, widthMm: 70, heightMm: 4,
            binding: { source: 'spool', spoolRow: 16, spoolColStart: 12, spoolColEnd: 55, staticValue: 'RIBA 60 GG D.F. FINE MESE' },
            style: { fontSizePt: 7.5, fontWeight: 'bold', color: '#0f172a' }
          }),
          createReportElement('label', {
            id: 'lbl_scad_hdr',
            xMm: 130, yMm: 40, widthMm: 25, heightMm: 4,
            binding: { staticValue: 'SCADENZA:' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#475569' }
          }),
          createReportElement('field', {
            id: 'fld_scad_val',
            xMm: 155, yMm: 40, widthMm: 40, heightMm: 4,
            binding: { source: 'spool', spoolRow: 17, spoolColStart: 12, spoolColEnd: 40, staticValue: '31/12/2026' },
            style: { fontSizePt: 7.5, fontWeight: 'bold', color: '#dc2626' }
          }),
          createReportElement('label', {
            id: 'lbl_iban_hdr',
            xMm: 13, yMm: 46, widthMm: 35, heightMm: 4,
            binding: { staticValue: 'BANCA D\'APPOGGIO / IBAN:' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#475569' }
          }),
          createReportElement('field', {
            id: 'fld_iban_val',
            xMm: 50, yMm: 46, widthMm: 145, heightMm: 4,
            binding: { source: 'spool', spoolRow: 16, spoolColStart: 70, spoolColEnd: 120, staticValue: 'INTESA SANPAOLO - IBAN: IT60X0306909606100000012345' },
            style: { fontSizePt: 7.5, color: '#0f172a' }
          })
        ]
      },
      detail: {
        id: 'detail',
        name: 'Dettaglio Articoli (Tabella Dinamica)',
        heightMm: 75,
        visible: true,
        elements: [
          // Dynamic Repeating Table
          createReportElement('table', {
            id: 'tbl_articoli',
            xMm: 10, yMm: 2, widthMm: 190, heightMm: 70,
            tableConfig: {
              spoolStartRow: 21,
              spoolEndRow: 27,
              columns: [
                { id: 'codice', title: 'Cod. Articolo', spoolColStart: 1, spoolColEnd: 15, widthMm: 30, align: 'left', jsonKey: 'codice' },
                { id: 'descrizione', title: 'Descrizione Merci / Lavorazioni', spoolColStart: 17, spoolColEnd: 62, widthMm: 76, align: 'left', jsonKey: 'descrizione' },
                { id: 'um', title: 'U.M.', spoolColStart: 64, spoolColEnd: 69, widthMm: 10, align: 'center', jsonKey: 'um' },
                { id: 'qta', title: 'Quantità', spoolColStart: 71, spoolColEnd: 81, widthMm: 18, align: 'right', jsonKey: 'qta' },
                { id: 'prezzo', title: 'Prezzo Unit.', spoolColStart: 83, spoolColEnd: 96, widthMm: 20, align: 'right', jsonKey: 'prezzo' },
                { id: 'sconto', title: 'Sc.%', spoolColStart: 98, spoolColEnd: 106, widthMm: 12, align: 'right', jsonKey: 'sconto' },
                { id: 'totale', title: 'Totale EUR', spoolColStart: 108, spoolColEnd: 120, widthMm: 24, align: 'right', jsonKey: 'totale' }
              ],
              headerBgColor: '#1e3a8a',
              headerTextColor: '#ffffff',
              headerFontSizePt: 8.5,
              rowFontSizePt: 8,
              rowHeightMm: 6,
              alternateRowBg: true,
              alternateRowColor: '#f8fafc',
              showGridLines: true,
              gridColor: '#e2e8f0'
            }
          })
        ]
      },
      pageFooter: {
        id: 'pageFooter',
        name: 'Piede Pagina & Dati Spedizione',
        heightMm: 25,
        visible: true,
        elements: [
          createReportElement('line', {
            id: 'lin_foot_top',
            xMm: 10, yMm: 1, widthMm: 190, heightMm: 1,
            style: { borderColor: '#cbd5e1', borderWidthPt: 1 }
          }),
          // Barcode for shipment tracking
          createReportElement('barcode', {
            id: 'bar_spedizione',
            xMm: 10, yMm: 4, widthMm: 60, heightMm: 16,
            barcodeType: 'CODE128',
            showBarcodeText: true,
            binding: { source: 'spool', spoolRow: 30, spoolColStart: 40, spoolColEnd: 65, staticValue: 'FA2026008492C004829' }
          }),
          // Page Number
          createReportElement('pagenum', {
            id: 'pg_num',
            xMm: 140, yMm: 16, widthMm: 60, heightMm: 5,
            binding: { staticValue: 'Pagina {PAGENO} di {TOTALPAGES}' }
          }),
          createReportElement('label', {
            id: 'lbl_legal_foot',
            xMm: 75, yMm: 5, widthMm: 65, heightMm: 12,
            binding: { staticValue: 'Contributo CONAI assolto ove dovuto. Merci viaggiano a rischio e pericolo del committente.' },
            style: { fontSizePt: 6.5, color: '#64748b' }
          })
        ]
      },
      reportFooter: {
        id: 'reportFooter',
        name: 'Totali Documento & Riepilogo Fiscale',
        heightMm: 42,
        visible: true,
        elements: [
          // Totals Container Box (Right)
          createReportElement('box', {
            id: 'box_totali',
            xMm: 110, yMm: 2, widthMm: 90, heightMm: 38,
            style: { backgroundColor: '#f8fafc', borderColor: '#1e3a8a', borderWidthPt: 1.5, borderRadiusMm: 3 }
          }),
          createReportElement('label', {
            id: 'lbl_imp_hdr',
            xMm: 115, yMm: 6, widthMm: 45, heightMm: 5,
            binding: { staticValue: 'TOTALE IMPONIBILE:' },
            style: { fontSizePt: 8, color: '#475569' }
          }),
          createReportElement('field', {
            id: 'fld_imp_val',
            xMm: 160, yMm: 6, widthMm: 36, heightMm: 5,
            binding: { source: 'spool', spoolRow: 41, spoolColStart: 25, spoolColEnd: 40, staticValue: '€ 2.528,32' },
            style: { fontSizePt: 8.5, fontWeight: 'bold', textAlign: 'right', color: '#0f172a' }
          }),
          createReportElement('label', {
            id: 'lbl_iva_hdr',
            xMm: 115, yMm: 13, widthMm: 45, heightMm: 5,
            binding: { staticValue: 'TOTALE IVA (22%):' },
            style: { fontSizePt: 8, color: '#475569' }
          }),
          createReportElement('field', {
            id: 'fld_iva_val',
            xMm: 160, yMm: 13, widthMm: 36, heightMm: 5,
            binding: { source: 'spool', spoolRow: 42, spoolColStart: 25, spoolColEnd: 40, staticValue: '€ 556,23' },
            style: { fontSizePt: 8.5, fontWeight: 'bold', textAlign: 'right', color: '#0f172a' }
          }),
          createReportElement('line', {
            id: 'lin_tot_div',
            xMm: 113, yMm: 20, widthMm: 84, heightMm: 1,
            style: { borderColor: '#cbd5e1', borderWidthPt: 1 }
          }),
          createReportElement('box', {
            id: 'box_tot_evid',
            xMm: 113, yMm: 23, widthMm: 84, heightMm: 14,
            style: { backgroundColor: '#1e3a8a', borderColor: '#172554', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_tot_pag_hdr',
            xMm: 116, yMm: 25, widthMm: 40, heightMm: 10,
            binding: { staticValue: 'TOTALE A PAGARE:' },
            style: { fontSizePt: 9, fontWeight: 'bold', color: '#ffffff' }
          }),
          createReportElement('field', {
            id: 'fld_tot_pag_val',
            xMm: 152, yMm: 25, widthMm: 42, heightMm: 10,
            binding: { source: 'spool', spoolRow: 44, spoolColStart: 35, spoolColEnd: 55, staticValue: '€ 3.084,55' },
            style: { fontSizePt: 12, fontWeight: 'bold', color: '#38bdf8', textAlign: 'right' }
          }),

          // QR Code SDI Box (Left)
          createReportElement('box', {
            id: 'box_qr',
            xMm: 10, yMm: 2, widthMm: 95, heightMm: 38,
            style: { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('qrcode', {
            id: 'qr_sdi',
            xMm: 14, yMm: 6, widthMm: 26, heightMm: 26,
            binding: { staticValue: 'https://iva.agenziaentrate.gov.it/sdi/FA-2026-008492-IT03948572019' }
          }),
          createReportElement('label', {
            id: 'lbl_qr_title',
            xMm: 43, yMm: 7, widthMm: 58, heightMm: 5,
            binding: { staticValue: 'Fattura Elettronica SDI' },
            style: { fontSizePt: 8, fontWeight: 'bold', color: '#1e293b' }
          }),
          createReportElement('label', {
            id: 'lbl_qr_desc',
            xMm: 43, yMm: 13, widthMm: 58, heightMm: 18,
            binding: { staticValue: 'Scansiona il QR Code con l\'app dell\'Agenzia delle Entrate per verificare l\'avvenuta trasmissione telematica.' },
            style: { fontSizePt: 6.5, color: '#64748b' }
          })
        ]
      }
    }
  };
}

export function getTemplateDDT() {
  return {
    meta: {
      title: 'Documento di Trasporto (D.D.T.) AS/400',
      description: 'Template per bolla di accompagnamento merci con vettore, pesi e firme',
      type: 'ddt'
    },
    page: {
      format: 'a4',
      orientation: 'portrait',
      widthMm: 210,
      heightMm: 297,
      marginTopMm: 8,
      marginBottomMm: 8,
      marginLeftMm: 10,
      marginRightMm: 10,
      gridSizeMm: 2,
      snapToGrid: true
    },
    sections: {
      reportHeader: {
        id: 'reportHeader',
        name: 'Intestazione Vettore & D.D.T.',
        heightMm: 26,
        visible: true,
        elements: [
          createReportElement('label', {
            id: 'lbl_ddt_co',
            xMm: 10, yMm: 3, widthMm: 80, heightMm: 8,
            binding: { staticValue: 'BEMA LOGISTICS EXPRESS S.P.A.' },
            style: { fontSizePt: 12, fontWeight: 'bold', color: '#047857' }
          }),
          createReportElement('label', {
            id: 'lbl_ddt_co_sub',
            xMm: 10, yMm: 12, widthMm: 80, heightMm: 8,
            binding: { staticValue: 'Via Roma 100, 20121 Milano - P.IVA 09876543210' },
            style: { fontSizePt: 7.5, color: '#475569' }
          }),
          createReportElement('box', {
            id: 'box_ddt_tit',
            xMm: 120, yMm: 3, widthMm: 80, heightMm: 18,
            style: { backgroundColor: '#ecfdf5', borderColor: '#059669', borderWidthPt: 1.5, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_ddt_tit',
            xMm: 122, yMm: 5, widthMm: 76, heightMm: 6,
            binding: { staticValue: 'DOCUMENTO DI TRASPORTO (D.D.T.)' },
            style: { fontSizePt: 8.5, fontWeight: 'bold', color: '#065f46', textAlign: 'center' }
          }),
          createReportElement('field', {
            id: 'fld_ddt_num',
            xMm: 122, yMm: 12, widthMm: 76, heightMm: 6,
            binding: { source: 'spool', spoolRow: 7, spoolColStart: 15, spoolColEnd: 35, staticValue: 'DDT-2026/04912 del 25/10/2026' },
            style: { fontSizePt: 8.5, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
          })
        ]
      },
      pageHeader: {
        id: 'pageHeader',
        name: 'Destinatario e Dati Spedizione',
        heightMm: 46,
        visible: true,
        elements: [
          createReportElement('box', {
            id: 'box_ddt_dest',
            xMm: 10, yMm: 2, widthMm: 95, heightMm: 26,
            style: { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_ddt_dest_hdr',
            xMm: 13, yMm: 4, widthMm: 80, heightMm: 4,
            binding: { staticValue: 'DESTINATARIO:' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('field', {
            id: 'fld_ddt_dest',
            xMm: 13, yMm: 9, widthMm: 88, heightMm: 5,
            binding: { source: 'spool', spoolRow: 5, spoolColStart: 15, spoolColEnd: 65, staticValue: 'MECCANICA INDUSTRIALE VENETA SRL' },
            style: { fontSizePt: 9, fontWeight: 'bold', color: '#0f172a' }
          }),
          createReportElement('field', {
            id: 'fld_ddt_dest_ind',
            xMm: 13, yMm: 15, widthMm: 88, heightMm: 5,
            binding: { source: 'spool', spoolRow: 5, spoolColStart: 66, spoolColEnd: 110, staticValue: 'VIA MARCONI 22, 35100 PADOVA (PD)' },
            style: { fontSizePt: 8, color: '#334155' }
          }),
          createReportElement('box', {
            id: 'box_ddt_vet',
            xMm: 110, yMm: 2, widthMm: 90, heightMm: 26,
            style: { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_vet_hdr',
            xMm: 113, yMm: 4, widthMm: 80, heightMm: 4,
            binding: { staticValue: 'VETTORE / TRASPORTATORE:' },
            style: { fontSizePt: 7, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('field', {
            id: 'fld_vet_nome',
            xMm: 113, yMm: 9, widthMm: 84, heightMm: 5,
            binding: { source: 'spool', spoolRow: 8, spoolColStart: 10, spoolColEnd: 45, staticValue: 'TRASPORTI RAPIDI NORD SRL' },
            style: { fontSizePt: 8.5, fontWeight: 'bold', color: '#0f172a' }
          }),
          createReportElement('field', {
            id: 'fld_vet_targa',
            xMm: 113, yMm: 15, widthMm: 84, heightMm: 5,
            binding: { source: 'spool', spoolRow: 8, spoolColStart: 50, spoolColEnd: 70, staticValue: 'TARGA: FP892ZK' },
            style: { fontSizePt: 8, color: '#475569' }
          }),
          createReportElement('box', {
            id: 'box_ddt_bar',
            xMm: 10, yMm: 31, widthMm: 190, heightMm: 12,
            style: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidthPt: 0.8, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_ddt_cau',
            xMm: 14, yMm: 34, widthMm: 70, heightMm: 5,
            binding: { source: 'spool', spoolRow: 7, spoolColStart: 65, spoolColEnd: 110, staticValue: 'CAUSALE: CONTO LAVORAZIONE ESTERNA' },
            style: { fontSizePt: 7.5, fontWeight: 'bold', color: '#0f172a' }
          }),
          createReportElement('label', {
            id: 'lbl_ddt_colli',
            xMm: 115, yMm: 34, widthMm: 80, heightMm: 5,
            binding: { source: 'spool', spoolRow: 16, spoolColStart: 1, spoolColEnd: 60, staticValue: 'TOTALE COLLI: 5 | PESO: 345 KG' },
            style: { fontSizePt: 7.5, fontWeight: 'bold', color: '#047857' }
          })
        ]
      },
      detail: {
        id: 'detail',
        name: 'Merci Trasportate',
        heightMm: 75,
        visible: true,
        elements: [
          createReportElement('table', {
            id: 'tbl_ddt_merci',
            xMm: 10, yMm: 2, widthMm: 190, heightMm: 70,
            tableConfig: {
              spoolStartRow: 12,
              spoolEndRow: 15,
              columns: [
                { id: 'pos', title: 'Pos', spoolColStart: 1, spoolColEnd: 5, widthMm: 15, align: 'center', jsonKey: 'pos' },
                { id: 'codice', title: 'Codice Articolo', spoolColStart: 6, spoolColEnd: 24, widthMm: 35, align: 'left', jsonKey: 'codice' },
                { id: 'descrizione', title: 'Descrizione Beni Trasportati', spoolColStart: 25, spoolColEnd: 74, widthMm: 80, align: 'left', jsonKey: 'descrizione' },
                { id: 'um', title: 'U.M.', spoolColStart: 75, spoolColEnd: 84, widthMm: 15, align: 'center', jsonKey: 'um' },
                { id: 'qta', title: 'Q.tà', spoolColStart: 85, spoolColEnd: 98, widthMm: 20, align: 'right', jsonKey: 'qta' },
                { id: 'colli', title: 'Colli', spoolColStart: 108, spoolColEnd: 116, widthMm: 25, align: 'center', jsonKey: 'colli' }
              ],
              headerBgColor: '#065f46',
              headerTextColor: '#ffffff',
              headerFontSizePt: 8.5,
              rowFontSizePt: 8,
              rowHeightMm: 6,
              alternateRowBg: true,
              alternateRowColor: '#f0fdf4',
              showGridLines: true,
              gridColor: '#d1fae5'
            }
          })
        ]
      },
      pageFooter: {
        id: 'pageFooter',
        name: 'Piede Pagina & Firme',
        heightMm: 28,
        visible: true,
        elements: [
          createReportElement('box', {
            id: 'box_firma_vet',
            xMm: 10, yMm: 2, widthMm: 60, heightMm: 18,
            style: { backgroundColor: '#ffffff', borderColor: '#94a3b8', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_firma_vet',
            xMm: 12, yMm: 4, widthMm: 56, heightMm: 4,
            binding: { staticValue: 'FIRMA VETTORE:' },
            style: { fontSizePt: 6.5, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('box', {
            id: 'box_firma_dest',
            xMm: 75, yMm: 2, widthMm: 60, heightMm: 18,
            style: { backgroundColor: '#ffffff', borderColor: '#94a3b8', borderWidthPt: 1, borderRadiusMm: 2 }
          }),
          createReportElement('label', {
            id: 'lbl_firma_dest',
            xMm: 77, yMm: 4, widthMm: 56, heightMm: 4,
            binding: { staticValue: 'FIRMA DESTINATARIO:' },
            style: { fontSizePt: 6.5, fontWeight: 'bold', color: '#64748b' }
          }),
          createReportElement('barcode', {
            id: 'bar_ddt',
            xMm: 140, yMm: 2, widthMm: 60, heightMm: 16,
            barcodeType: 'CODE128',
            showBarcodeText: true,
            binding: { source: 'spool', spoolRow: 17, spoolColStart: 20, spoolColEnd: 38, staticValue: 'DDT202604912' }
          }),
          createReportElement('pagenum', {
            id: 'pg_ddt',
            xMm: 140, yMm: 22, widthMm: 60, heightMm: 4,
            binding: { staticValue: 'Pagina {PAGENO} di {TOTALPAGES}' }
          })
        ]
      },
      reportFooter: {
        id: 'reportFooter',
        name: 'Chiusura Bolla',
        heightMm: 15,
        visible: false,
        elements: []
      }
    }
  };
}
