// External Program Integration & Interactive API Hub Component
// Demonstrates how external programs (RPGLE, COBOL, C#, Python, cURL, ERP) can call ASDOCU 400 Studio

export class IntegrationApiUI {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:3001/api';
    this.activeCodeLang = 'rpgle'; // 'rpgle', 'curl', 'python', 'csharp', 'nodejs'
    this.onTestGenerate = options.onTestGenerate || (() => {});

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="integration-hub-container">
        <!-- Hub Top Header -->
        <div class="integration-header">
          <div class="header-left">
            <span class="api-tag">REST API & EXTERNAL INTEGRATION</span>
            <h2>Chiamata Interattiva da Programmi Esterni (RPGLE, C#, Python, CLI)</h2>
            <p>ASDOCU 400 Studio espone API REST e parametri URL per consentire a gestionali, programmi RPG/COBOL su AS/400 e software di terze parti di richiedere stampe e generare PDF su misura in tempo reale.</p>
          </div>
          <div class="header-right">
            <div class="gateway-status">
              <span class="pulse-dot"></span>
              <span>Gateway API: <strong>${this.apiBaseUrl}</strong></span>
            </div>
          </div>
        </div>

        <!-- Main Integration Split -->
        <div class="integration-grid">
          <!-- Left: Interactive Test Playground -->
          <div class="integration-col playground-col">
            <div class="col-header">
              <span>🚀 Collaudo Interattivo Chiamata di Stampa</span>
              <span class="subtext">Simula una chiamata inviata da un programma esterno</span>
            </div>

            <div class="playground-body">
              <div class="form-group">
                <label>Modello di Stampa (Template):</label>
                <select id="api_test_template" class="api-input">
                  <option value="fattura">Fattura Accompagnatoria AS/400</option>
                  <option value="ddt">Documento di Trasporto (D.D.T.)</option>
                </select>
              </div>

              <div class="form-group">
                <label>ID File Spool o Testo Grezzo:</label>
                <select id="api_test_spool_id" class="api-input">
                  <option value="SPL008492">SPL008492 - Fattura Accompagnatoria QPRINT (Rebici)</option>
                  <option value="SPL004912">SPL004912 - Documento di Trasporto QDDT (Logistic)</option>
                  <option value="SPL011029">SPL011029 - Ordine Acquisto QORD (Acquis)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Formato Risposta Desiderato (Output):</label>
                <select id="api_test_output_mode" class="api-input">
                  <option value="download">Download Diretto Stream PDF (application/pdf)</option>
                  <option value="base64">Stringa Base64 JSON (per integrazioni API/Web service)</option>
                  <option value="file">Salva File PDF su Disco Server</option>
                </select>
              </div>

              <div class="form-group">
                <label>Nome File PDF Generato:</label>
                <input type="text" id="api_test_filename" class="api-input" value="stampa_esterna_as400.pdf">
              </div>

              <div class="action-row">
                <button class="btn-api-call" id="btnExecuteApiCall">
                  <span>▶</span> Esegui Richiesta API (Simula Chiamata ERP)
                </button>
              </div>

              <!-- Live Execution Results Display -->
              <div class="api-result-box" id="apiResultBox" style="display: none;">
                <div class="result-header">
                  <span id="apiResultStatus" class="result-status">200 OK</span>
                  <span id="apiResultMeta" class="result-meta">-- ms</span>
                </div>
                <div class="result-body" id="apiResultBody"></div>
              </div>
            </div>
          </div>

          <!-- Right: Code Snippets for Various Languages -->
          <div class="integration-col snippets-col">
            <div class="col-header">
              <span>💻 Codice di Chiamata per Programmatori</span>
              <span class="subtext">Copia e incolla nel tuo linguaggio preferito</span>
            </div>

            <!-- Language Tabs -->
            <div class="snippet-tabs">
              <button class="snip-tab ${this.activeCodeLang === 'rpgle' ? 'active' : ''}" data-lang="rpgle">IBM i RPGLE / CL</button>
              <button class="snip-tab ${this.activeCodeLang === 'curl' ? 'active' : ''}" data-lang="curl">cURL / CLI</button>
              <button class="snip-tab ${this.activeCodeLang === 'python' ? 'active' : ''}" data-lang="python">Python</button>
              <button class="snip-tab ${this.activeCodeLang === 'csharp' ? 'active' : ''}" data-lang="csharp">C# / .NET</button>
              <button class="snip-tab ${this.activeCodeLang === 'nodejs' ? 'active' : ''}" data-lang="nodejs">Node.js</button>
            </div>

            <!-- Snippet Code Display -->
            <div class="snippet-code-wrapper">
              <pre class="snippet-pre"><code id="codeSnippetBox"></code></pre>
            </div>

            <!-- Deep Linking Section -->
            <div class="deeplink-section">
              <div class="dl-title">🔗 Integrazione via URL Deep-Linking (Browser / Iframe)</div>
              <p class="dl-desc">Puoi richiamare ASDOCU 400 Studio da qualsiasi gestionale web o link aprendo l'URL con parametri:</p>
              <div class="dl-box">
                <code id="urlDeepLinkExample">http://localhost:5174/?action=print&template=fattura&spoolId=SPL008492</code>
                <button class="btn-copy-url" id="btnTestUrlDeepLink">Testa Link</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderCodeSnippet();
    this.attachEvents();
  }

  attachEvents() {
    // Language tab switching
    this.container.querySelectorAll('.snip-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeCodeLang = tab.dataset.lang;
        this.container.querySelectorAll('.snip-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderCodeSnippet();
      });
    });

    // Execute API Call simulation
    const btnExecute = this.container.querySelector('#btnExecuteApiCall');
    if (btnExecute) {
      btnExecute.addEventListener('click', () => this.executeTestApiCall());
    }

    // Test deep link
    const btnTestUrl = this.container.querySelector('#btnTestUrlDeepLink');
    if (btnTestUrl) {
      btnTestUrl.addEventListener('click', () => {
        const link = `http://localhost:5174/?action=print&template=fattura&spoolId=SPL008492`;
        window.open(link, '_blank');
      });
    }
  }

  async executeTestApiCall() {
    const template = this.container.querySelector('#api_test_template')?.value || 'fattura';
    const spoolId = this.container.querySelector('#api_test_spool_id')?.value || 'SPL008492';
    const output = this.container.querySelector('#api_test_output_mode')?.value || 'download';
    const filename = this.container.querySelector('#api_test_filename')?.value || 'stampa_esterna.pdf';

    const resultBox = this.container.querySelector('#apiResultBox');
    const resultStatus = this.container.querySelector('#apiResultStatus');
    const resultMeta = this.container.querySelector('#apiResultMeta');
    const resultBody = this.container.querySelector('#apiResultBody');

    if (resultBox) resultBox.style.display = 'block';
    if (resultStatus) resultStatus.textContent = 'Elaborazione in corso...';

    const startTime = performance.now();

    try {
      const payload = {
        template,
        spoolId,
        output,
        filename
      };

      const res = await fetch(`${this.apiBaseUrl}/render-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (res.ok) {
        if (resultStatus) {
          resultStatus.textContent = `200 OK (${res.statusText})`;
          resultStatus.className = 'result-status success';
        }
        if (resultMeta) {
          resultMeta.textContent = `${elapsed} ms`;
        }

        if (output === 'base64' || output === 'file') {
          const json = await res.json();
          resultBody.innerHTML = `
            <div class="result-json">
              <pre>${this.escapeHtml(JSON.stringify(json, null, 2))}</pre>
            </div>
          `;
        } else {
          // Binary PDF stream
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const sizeKb = (blob.size / 1024).toFixed(1);

          resultBody.innerHTML = `
            <div class="pdf-success-box">
              <span class="icon-big">📄</span>
              <div class="pdf-success-details">
                <strong>PDF Vettoriale Generato con Successo!</strong>
                <span>Dimensione: ${sizeKb} KB • Template: ${template} • File: ${filename}</span>
              </div>
              <div class="pdf-success-actions">
                <a href="${blobUrl}" target="_blank" class="btn-res-action view">Apri PDF</a>
                <a href="${blobUrl}" download="${filename}" class="btn-res-action download">Scarica</a>
              </div>
            </div>
          `;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Errore HTTP ${res.status}`);
      }
    } catch (err) {
      if (resultStatus) {
        resultStatus.textContent = 'Errore Chiamata';
        resultStatus.className = 'result-status error';
      }
      if (resultBody) {
        resultBody.innerHTML = `<div class="error-text">${this.escapeHtml(err.message)}</div>`;
      }
    }
  }

  renderCodeSnippet() {
    const codeBox = this.container.querySelector('#codeSnippetBox');
    if (!codeBox) return;

    let code = '';
    const endpoint = `${this.apiBaseUrl}/render-pdf`;

    if (this.activeCodeLang === 'rpgle') {
      code = `// ====================================================================
// Chiamata di Stampa PDF da Programma RPGLE (IBM i AS/400)
// Utilizza la funzione integrata QSYS2.HTTPPOSTCLOB (OS/400 V7R3+)
// ====================================================================
**FREE
ctl-opt dftactgrp(*no) actgrp(*caller);

dcl-s url           varchar(256);
dcl-s httpHeader    varchar(1000);
dcl-s httpBody      clob(1000000);
dcl-s httpResponse  clob(1000000);

// Endpoint API esposto da ASDOCU 400 Studio
url = '${endpoint}';

// Header della richiesta HTTP
httpHeader = '<httpHeader>'
           + '<header name="Content-Type" value="application/json"/>'
           + '</httpHeader>';

// Payload: specifica il modello grafico e lo Spool emesso dal programma RPG
httpBody = '{\\"template\\": \\"fattura\\",'
         + ' \\"spoolId\\": \\"SPL008492\\",'
         + ' \\"output\\": \\"file\\",'
         + ' \\"filename\\": \\"FATTURA_2026_008492.pdf\\"}';

// Esecuzione chiamata REST direttamente da IBM i
exec sql
  select responseMsg into :httpResponse
  from table(qsys2.httpPostClob(:url, :httpHeader, :httpBody));

if sqlcode = 0;
  dsply 'PDF Generato con Successo da ASDOCU!';
else;
  dsply 'Errore Chiamata ASDOCU';
endif;

*inlr = *on;
return;`;
    } else if (this.activeCodeLang === 'curl') {
      code = `# ====================================================================
# Generazione PDF da riga di comando (Linux / Windows CMD / Script Bash)
# ====================================================================
curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "fattura",
    "spoolId": "SPL008492",
    "output": "download"
  }' \\
  --output ./documento_as400.pdf

echo "Stampa completata con successo: documento_as400.pdf generato."`;
    } else if (this.activeCodeLang === 'python') {
      code = `# ====================================================================
# Chiamata di Generazione PDF da Python / Django / FastAPI
# ====================================================================
import requests

url = "${endpoint}"
payload = {
    "template": "fattura",
    "spoolId": "SPL008492",
    "output": "download",
    "filename": "fattura_stampata.pdf"
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("fattura_stampata.pdf", "wb") as f:
        f.write(response.content)
    print("PDF scaricato con successo (dimensione:", len(response.content), "bytes)")
else:
    print("Errore generazione PDF:", response.text)`;
    } else if (this.activeCodeLang === 'csharp') {
      code = `// ====================================================================
// Chiamata di Stampa PDF da Applicazione C# / .NET (WPF, WinForms, Web)
// ====================================================================
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        
        var requestData = new {
            template = "fattura",
            spoolId = "SPL008492",
            output = "download"
        };

        var response = await client.PostAsJsonAsync("${endpoint}", requestData);
        
        if (response.IsSuccessStatusCode) {
            byte[] pdfBytes = await response.Content.ReadAsByteArrayAsync();
            await File.WriteAllBytesAsync("FatturaAS400.pdf", pdfBytes);
            Console.WriteLine("PDF generato e salvato su disco.");
        }
    }
}`;
    } else if (this.activeCodeLang === 'nodejs') {
      code = `// ====================================================================
// Chiamata di Stampa PDF da Node.js / JavaScript Frontend
// ====================================================================
const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'fattura',
    spoolId: 'SPL008492',
    output: 'download',
    filename: 'fattura.pdf'
  })
});

const pdfBlob = await response.blob();
const downloadUrl = URL.createObjectURL(pdfBlob);

// Avvia download automatico
const a = document.createElement('a');
a.href = downloadUrl;
a.download = 'fattura.pdf';
a.click();`;
    }

    codeBox.textContent = code;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
