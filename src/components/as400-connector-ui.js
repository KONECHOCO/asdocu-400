// IBM i AS/400 Connection Hub & Output Queue (OUTQ) Manager Component
// Handles connection settings, authentication, spool queue browsing, and automatic polling

export class As400ConnectorUI {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:3001/api';
    this.onLoadSpoolToDesigner = options.onLoadSpoolToDesigner || (() => {});
    this.onQuickPrintSpool = options.onQuickPrintSpool || (() => {});
    this.isAutoPolling = false;
    this.pollInterval = null;

    this.connectionState = {
      host: '192.168.1.100',
      port: 8471,
      user: 'QUSER',
      library: 'QGPL',
      outq: 'PRT01',
      protocol: 'sql_services',
      status: 'DISCONNECTED',
      lastPing: null,
      logs: []
    };

    this.spools = [];
    this.render();
    this.testConnection();
  }

  render() {
    this.container.innerHTML = `
      <div class="as400-hub-container">
        <!-- Top Status Summary Banner -->
        <div class="as400-banner">
          <div class="banner-left">
            <div class="as400-logo-badge">
              <span class="ibmi-icon">IBM i</span>
              <span class="as400-version">Power Systems • OS/400</span>
            </div>
            <div class="connection-status-pill ${this.connectionState.status.toLowerCase()}" id="connStatusPill">
              <span class="status-dot"></span>
              <span id="connStatusText">Inizializzazione...</span>
            </div>
          </div>

          <div class="banner-right">
            <div class="watcher-toggle-group">
              <span class="watcher-label">Demone Monitoraggio OUTQ:</span>
              <button class="btn-toggle-watcher" id="btnToggleWatcher">
                <span class="watcher-indicator"></span>
                <span id="watcherStatusText">DISATTIVO</span>
              </button>
            </div>
            <button class="as400-refresh-btn" id="btnRefreshSpools" title="Ricarica Coda Spool">
              <span>🔄</span> Aggiorna Coda
            </button>
          </div>
        </div>

        <!-- Main Grid: Left Settings / Right Spool Queue -->
        <div class="as400-grid">
          <!-- Left Column: Connection Settings & Diagnostic Log -->
          <div class="as400-config-panel">
            <div class="panel-section-title">
              <span>⚙️ Parametri Connessione AS/400 (IBM i)</span>
            </div>

            <form id="as400ConnForm" class="as400-form">
              <div class="form-row-split">
                <div class="form-group">
                  <label>Indirizzo Host / IP:</label>
                  <input type="text" id="as400_host" value="${this.connectionState.host}" required>
                </div>
                <div class="form-group">
                  <label>Porta Servizio:</label>
                  <input type="number" id="as400_port" value="${this.connectionState.port}" required>
                </div>
              </div>

              <div class="form-row-split">
                <div class="form-group">
                  <label>Utente IBM i:</label>
                  <input type="text" id="as400_user" value="${this.connectionState.user}" required>
                </div>
                <div class="form-group">
                  <label>Password:</label>
                  <input type="password" id="as400_password" value="••••••••" required>
                </div>
              </div>

              <div class="form-row-split">
                <div class="form-group">
                  <label>Libreria AS/400:</label>
                  <input type="text" id="as400_library" value="${this.connectionState.library}" placeholder="es: QGPL o FATTUR01">
                </div>
                <div class="form-group">
                  <label>Coda di Stampa (OUTQ):</label>
                  <input type="text" id="as400_outq" value="${this.connectionState.outq}" placeholder="es: PRT01 o QPRINT">
                </div>
              </div>

              <div class="form-group">
                <label>Protocollo di Acquisizione Spool:</label>
                <select id="as400_protocol">
                  <option value="sql_services" ${this.connectionState.protocol === 'sql_services' ? 'selected' : ''}>IBM i SQL Services (QSYS2.SPOOLED_FILE_DATA) [Consigliato V7R3+]</option>
                  <option value="ssh_cpysplf" ${this.connectionState.protocol === 'ssh_cpysplf' ? 'selected' : ''}>SSH / PASE Terminal (Comando CPYSPLF in QTEMP)</option>
                  <option value="ftp_spool" ${this.connectionState.protocol === 'ftp_spool' ? 'selected' : ''}>AS/400 TCP/IP FTP Spool Subsystem (NAMEFMT 0)</option>
                </select>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-as400-connect" id="btnTestConn">
                  <span>🔌</span> Connetti & Testa Handshake
                </button>
              </div>
            </form>

            <!-- Diagnostic Handshake Log Box -->
            <div class="diagnostic-box">
              <div class="diag-header">Log Diagnostica Connessione:</div>
              <div class="diag-log" id="diagLogs">
                <div class="diag-line info">[INFO] Connettore IBM i AS/400 pronto.</div>
              </div>
            </div>
          </div>

          <!-- Right Column: Live Output Queue (OUTQ) Browser -->
          <div class="as400-queue-panel">
            <div class="panel-section-title">
              <div class="title-with-badge">
                <span>📑 Coda di Stampa Attiva (OUTQ: <strong id="lblQueueName">${this.connectionState.library}/${this.connectionState.outq}</strong>)</span>
                <span class="badge-count" id="badgeSpoolCount">0 Spool</span>
              </div>
              <div class="queue-filter-group">
                <select id="selectSpoolFilterStatus" class="filter-select">
                  <option value="">Tutti gli Stati</option>
                  <option value="RDY" selected>Stato RDY (Pronti per Stampa)</option>
                  <option value="SAV">Stato SAV (Archiviati)</option>
                  <option value="HLD">Stato HLD (Trattenuti)</option>
                </select>
              </div>
            </div>

            <!-- Table of Spools -->
            <div class="spool-table-wrapper">
              <table class="as400-spool-table">
                <thead>
                  <tr>
                    <th>ID Spool</th>
                    <th>File Stampa</th>
                    <th>Utente</th>
                    <th>Lavoro / Job</th>
                    <th>N. Spl</th>
                    <th>Pag.</th>
                    <th>Data / Ora</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody id="spoolTableBody">
                  <tr>
                    <td colspan="9" class="loading-td">Caricamento spooled files da IBM i...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="queue-footer-info">
              <span>💡 Clicca su <strong>"Invia al Designer"</strong> per mappare graficamente lo spool o <strong>"Stampa PDF"</strong> per generare subito il documento.</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Form submit / test connection
    const form = this.container.querySelector('#as400ConnForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveAndConnect();
      });
    }

    // Refresh spools button
    const btnRefresh = this.container.querySelector('#btnRefreshSpools');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.fetchSpools());
    }

    // Filter status change
    const filterSelect = this.container.querySelector('#selectSpoolFilterStatus');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.fetchSpools());
    }

    // Watcher daemon toggle
    const btnWatcher = this.container.querySelector('#btnToggleWatcher');
    if (btnWatcher) {
      btnWatcher.addEventListener('click', () => this.toggleWatcher());
    }
  }

  async saveAndConnect() {
    const host = this.container.querySelector('#as400_host')?.value;
    const port = this.container.querySelector('#as400_port')?.value;
    const user = this.container.querySelector('#as400_user')?.value;
    const password = this.container.querySelector('#as400_password')?.value;
    const library = this.container.querySelector('#as400_library')?.value;
    const outq = this.container.querySelector('#as400_outq')?.value;
    const protocol = this.container.querySelector('#as400_protocol')?.value;

    this.connectionState = {
      ...this.connectionState,
      host,
      port: parseInt(port, 10),
      user,
      library,
      outq,
      protocol
    };

    const lblQueue = this.container.querySelector('#lblQueueName');
    if (lblQueue) lblQueue.textContent = `${library}/${outq}`;

    this.addDiagLog('info', `Avvio connessione verso ${host}:${port} (${protocol})...`);

    try {
      const res = await fetch(`${this.apiBaseUrl}/as400/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, library, outq, protocol })
      });
      const data = await res.json();

      if (data.success) {
        this.connectionState.status = 'CONNECTED';
        this.updateStatusPill('CONNECTED', `Connesso a ${host}`);
        this.addDiagLog('success', `✓ ${data.message}`);
        this.addDiagLog('info', `Dettagli: OS=${data.details.serverOS}, Partizione=${data.details.partition}, Latenza=${data.details.handshakeLatencyMs}ms`);
        this.fetchSpools();
      } else {
        throw new Error(data.error || 'Connessione fallita');
      }
    } catch (err) {
      this.connectionState.status = 'ERROR';
      this.updateStatusPill('ERROR', 'Errore Connessione');
      this.addDiagLog('error', `✗ Errore: ${err.message}`);
    }
  }

  async testConnection() {
    this.addDiagLog('info', `Ping automatico gateway AS/400...`);
    try {
      const res = await fetch(`${this.apiBaseUrl}/as400/status`);
      const data = await res.json();
      if (data.config) {
        this.connectionState.status = 'CONNECTED';
        this.updateStatusPill('CONNECTED', `Connesso a ${data.config.host}`);
        this.addDiagLog('success', `✓ Server IBM i AS/400 raggiungibile.`);
        this.fetchSpools();
      }
    } catch (err) {
      this.connectionState.status = 'DISCONNECTED';
      this.updateStatusPill('DISCONNECTED', 'Offline (Mock Mode)');
      this.addDiagLog('warn', `Server API non raggiungibile su ${this.apiBaseUrl}. Modalità offline attiva.`);
    }
  }

  async fetchSpools() {
    const filterSelect = this.container.querySelector('#selectSpoolFilterStatus');
    const statusFilter = filterSelect ? filterSelect.value : '';

    const tbody = this.container.querySelector('#spoolTableBody');
    const badgeCount = this.container.querySelector('#badgeSpoolCount');

    try {
      const url = `${this.apiBaseUrl}/as400/spools?outq=${this.connectionState.outq}${statusFilter ? '&status=' + statusFilter : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.spools) {
        this.spools = data.spools;
        if (badgeCount) badgeCount.textContent = `${this.spools.length} Spool`;
        this.renderSpoolTable(this.spools);
      }
    } catch (err) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="error-td">Impossibile recuperare spooled files: ${err.message}</td></tr>`;
      }
    }
  }

  renderSpoolTable(spools) {
    const tbody = this.container.querySelector('#spoolTableBody');
    if (!tbody) return;

    if (!spools || spools.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-td">Nessun file spool presente nella coda con i filtri selezionati.</td></tr>`;
      return;
    }

    tbody.innerHTML = spools.map(s => {
      const statusClass = s.status === 'RDY' ? 'status-rdy' : (s.status === 'SAV' ? 'status-sav' : 'status-hld');
      return `
        <tr data-spool-id="${s.id}">
          <td><span class="spool-id-badge">${s.id}</span></td>
          <td><strong>${s.name}</strong></td>
          <td>${s.user}</td>
          <td><span class="job-text">${s.jobName}/${s.jobNumber}</span></td>
          <td class="text-center">${s.spoolNumber}</td>
          <td class="text-center">${s.pages}</td>
          <td class="text-dim">${s.date}</td>
          <td><span class="badge-spool-status ${statusClass}">${s.status}</span></td>
          <td>
            <div class="spool-action-buttons">
              <button class="btn-table-action primary" data-action="load-designer" data-id="${s.id}" title="Carica lo Spool nel Designer per mappare i dati">
                📥 Invia al Designer
              </button>
              <button class="btn-table-action success" data-action="quick-print" data-id="${s.id}" title="Genera direttamente il PDF">
                🚀 Stampa PDF
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach actions
    tbody.querySelectorAll('[data-action="load-designer"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const spoolId = btn.dataset.id;
        await this.loadSpoolContent(spoolId, false);
      });
    });

    tbody.querySelectorAll('[data-action="quick-print"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const spoolId = btn.dataset.id;
        await this.loadSpoolContent(spoolId, true);
      });
    });
  }

  async loadSpoolContent(spoolId, isQuickPrint = false) {
    try {
      this.addDiagLog('info', `Download spooled file ${spoolId} da IBM i...`);
      const res = await fetch(`${this.apiBaseUrl}/as400/spool/${spoolId}`);
      const data = await res.json();

      if (data.success && data.spool) {
        this.addDiagLog('success', `✓ File spool ${data.spool.name} (${data.spool.sizeKb} KB) acquisito.`);
        if (isQuickPrint) {
          this.onQuickPrintSpool(data.spool);
        } else {
          this.onLoadSpoolToDesigner(data.spool);
        }
      }
    } catch (err) {
      this.addDiagLog('error', `Errore acquisizione spool: ${err.message}`);
    }
  }

  toggleWatcher() {
    this.isAutoPolling = !this.isAutoPolling;
    const btn = this.container.querySelector('#btnToggleWatcher');
    const lbl = this.container.querySelector('#watcherStatusText');

    if (this.isAutoPolling) {
      btn?.classList.add('active');
      if (lbl) lbl.textContent = 'ATTIVO (Ascolto ogni 5s)';
      this.addDiagLog('success', `Demone monitoraggio OUTQ attivato su ${this.connectionState.outq}. Intercettazione automatica nuove stampe.`);
      this.pollInterval = setInterval(() => this.fetchSpools(), 5000);
    } else {
      btn?.classList.remove('active');
      if (lbl) lbl.textContent = 'DISATTIVO';
      this.addDiagLog('info', 'Demone monitoraggio OUTQ disattivato.');
      if (this.pollInterval) clearInterval(this.pollInterval);
    }
  }

  updateStatusPill(status, text) {
    const pill = this.container.querySelector('#connStatusPill');
    const label = this.container.querySelector('#connStatusText');
    if (pill) pill.className = `connection-status-pill ${status.toLowerCase()}`;
    if (label) label.textContent = text;
  }

  addDiagLog(type, text) {
    const box = this.container.querySelector('#diagLogs');
    if (!box) return;

    const time = new Date().toLocaleTimeString('it-IT');
    const div = document.createElement('div');
    div.className = `diag-line ${type}`;
    div.innerHTML = `<span class="time">[${time}]</span> ${this.escapeHtml(text)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
