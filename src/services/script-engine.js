// JavaScript Data Connector & Scripting Pipeline Engine
// Allows writing custom transformation scripts to bridge AS/400 spools and external data to the PDF Report

export const PRESET_SCRIPTS = {
  spoolToInvoice: `// Connettore JavaScript: Estrazione Spool AS/400 -> Modello Dati Fattura
function processSpool(rawSpoolText, utils) {
  const lines = rawSpoolText.split('\\n');
  console.log("Elaborazione Spool AS/400: " + lines.length + " righe trovate.");

  // Estrazione coordinate testata
  const numeroDoc = lines[4]?.substring(85, 105)?.trim() || "FA-2026/000";
  const dataDoc = lines[5]?.substring(85, 105)?.trim() || "24/10/2026";
  const cliente = lines[10]?.substring(0, 45)?.trim() || "CLIENTE NON DEFINITO";
  const piva = lines[13]?.substring(0, 45)?.trim() || "";

  console.log("Documento estratto: " + numeroDoc + " per " + cliente);

  // Estrazione righe dettaglio prodotti (dalla riga 20 alla 26)
  const righeProdotti = [];
  for (let i = 20; i <= 26; i++) {
    const r = lines[i];
    if (!r || r.trim().startsWith('-')) continue;

    const codice = r.substring(0, 15).trim();
    const desc = r.substring(16, 62).trim();
    const qta = parseFloat(r.substring(70, 81).replace(',', '.')) || 0;
    const prezzo = parseFloat(r.substring(82, 96).replace(',', '.')) || 0;
    const tot = parseFloat(r.substring(107, 120).replace(',', '.')) || (qta * prezzo);

    if (codice) {
      righeProdotti.push({
        codice,
        descrizione: desc,
        um: "NR",
        qta,
        prezzo,
        totale: tot
      });
    }
  }

  // Calcolo totali con IVA 22%
  const totaleImponibile = righeProdotti.reduce((acc, row) => acc + row.totale, 0);
  const totaleIva = totaleImponibile * 0.22;
  const totaleFattura = totaleImponibile + totaleIva;

  return {
    documento: {
      numero: numeroDoc,
      data: dataDoc,
      cliente: cliente,
      partitaIva: piva,
      righe: righeProdotti,
      totali: {
        imponibile: utils.formatCurrency(totaleImponibile),
        iva: utils.formatCurrency(totaleIva),
        totaleDocumento: utils.formatCurrency(totaleFattura)
      },
      barcodeTracking: "FA" + numeroDoc.replace(/[^0-9]/g, '')
    }
  };
}`,

  calculateVatSummary: `// Script di Ricalcolo Fiscale & Scorporo IVA
function calculateVatSummary(jsonData, utils) {
  const righe = jsonData?.documento?.righe || [];
  console.log("Calcolo riepilogo IVA per " + righe.length + " articoli...");

  const riepilogoIva = {};

  righe.forEach(r => {
    const aliquota = r.iva || 22;
    if (!riepilogoIva[aliquota]) {
      riepilogoIva[aliquota] = { imponibile: 0, imposta: 0 };
    }
    const tot = typeof r.totale === 'number' ? r.totale : parseFloat(r.totale) || 0;
    riepilogoIva[aliquota].imponibile += tot;
    riepilogoIva[aliquota].imposta += tot * (aliquota / 100);
  });

  console.log("Riepilogo IVA calcolato:", JSON.stringify(riepilogoIva));
  return { riepilogoIva };
}`
};

export class ScriptEngine {
  /**
   * Executes user custom JavaScript in a controlled environment
   */
  static execute(code, rawSpoolText, jsonData) {
    const logs = [];
    const customConsole = {
      log: (...args) => logs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
      warn: (...args) => logs.push({ type: 'warn', text: args.map(a => String(a)).join(' ') }),
      error: (...args) => logs.push({ type: 'error', text: args.map(a => String(a)).join(' ') })
    };

    const utils = {
      formatCurrency: (num) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num || 0),
      formatDate: (d) => new Intl.DateTimeFormat('it-IT').format(new Date(d)),
      cleanSpoolLine: (str) => (str || '').replace(/[\\r\\n]/g, '').trimEnd(),
      extractCol: (line, start, end) => (line || '').substring(Math.max(0, start - 1), end).trim()
    };

    try {
      // Wrap code in a function runner
      const runner = new Function('spoolText', 'jsonData', 'utils', 'console', `
        ${code}
        if (typeof processSpool === 'function') {
          return processSpool(spoolText, utils);
        } else if (typeof calculateVatSummary === 'function') {
          return calculateVatSummary(jsonData, utils);
        } else {
          return null;
        }
      `);

      const result = runner(rawSpoolText, jsonData, utils, customConsole);
      return {
        success: true,
        result,
        logs
      };
    } catch (err) {
      logs.push({ type: 'error', text: 'Errore di esecuzione script: ' + err.message });
      return {
        success: false,
        error: err.message,
        logs
      };
    }
  }
}
