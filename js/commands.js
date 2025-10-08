(function () {
  function renderCommandsPanel() {
    const cont = document.getElementById('commnads-container');
    if (!cont) return;

    cont.innerHTML = `
      <form id="configForm" onsubmit="return false;">
        <fieldset class="grid">
          <label>
            Build ID
            <input type="text" id="buildId" placeholder="ej. 42069" />
          </label>
          <label>
            Backend
            <select id="backend">
              <option value="Cry">Cry</option>
              <option value="DevPlatestH">DevPlaytestH</option>
              <option value="Baseball">Baseball</option>
              <option value="Backflip">Backflip</option>
            </select>
          </label>
          <label>
            Región
            <select id="region">
              <option value="ASIA">ASIA</option>
              <option value="BR">BR</option>
              <option value="EU">EU</option>
              <option value="ME">ME</option>
              <option value="NAC">NAC</option>
              <option value="NAE">NAE</option>
              <option value="NAW">NAW</option>
              <option value="OCE">OCE</option>
            </select>
          </label>
        </fieldset>

        <div style="margin-top: 14px">
          <h3 style="margin-bottom: 6px;">Plataformas</h3>
          <div class="platforms-container options">
            <button class="filter-btn" type="button" data-filter="PC">PC</button>
            <button class="filter-btn" type="button" data-filter="Switch">Switch</button>
          </div>
          <small class="muted">Nota: PC y Switch son excluyentes.</small>
        </div>

        <div style="margin-top: 14px">
          <h3 style="margin-bottom: 6px;">Flags</h3>
          <div class="flags-container options">
            <button class="filter-btn" type="button" data-filter="Trace">TRACE</button>
            <button class="filter-btn" type="button" data-filter="LLM">LLM</button>
            <button class="filter-btn" type="button" data-filter="LWM (BR)">LWM (BR)</button>
            <button class="filter-btn" type="button" data-filter="LWM (No BR)">LWM (NO BR)</button>
          </div>
          <small class="muted">Nota: LWM (BR) y LWM (No BR) son excluyentes.</small>
        </div>
      </form>

      <div class="card">
        <h3>Resumen</h3>
        <p><span class="gradient-text">Build ID:</span> <span id="summaryBuildId">Not set</span></p>
        <p><span class="gradient-text">Backend:</span> <span id="summaryBackend">Cry</span></p>
        <p><span class="gradient-text">Región:</span> <span id="summaryRegion">ASIA</span></p>
        <p><span class="gradient-text">Flags:</span> <span id="summaryFlags">None</span></p>
      </div>

      <div class="card-2">
        <div class="card-header">
          <h3>Comando generado</h3>
          <button id="copyBtn" class="primary" type="button">Copiar</button>
        </div>
        <pre id="commandPreview"></pre>
      </div>
    `;
  }

  class AppConfiguration {
    constructor() {
      this.buildId = '';
      this.backend = 'Cry';
      this.region = 'ASIA';
      this.activeFlags = [];
      this.activePlatforms = [];
      this.copying = false;

      this.init();
    }

    init() {
      this.getElements();
      this.bindEvents();
      this.updateSummary();
      this.updatePreview();
    }

    getElements() {
      this.buildIdInput = document.getElementById('buildId');
      this.backendSelect = document.getElementById('backend');
      this.regionSelect = document.getElementById('region');

      this.platformButtons = document.querySelectorAll('.platforms-container .filter-btn');
      this.flagButtons = document.querySelectorAll('.flags-container .filter-btn');

      this.summaryBuildId = document.getElementById('summaryBuildId');
      this.summaryBackend = document.getElementById('summaryBackend');
      this.summaryRegion = document.getElementById('summaryRegion');
      this.summaryFlags = document.getElementById('summaryFlags');

      this.commandPreview = document.getElementById('commandPreview');
      this.copyBtn = document.getElementById('copyBtn');
    }

    bindEvents() {
      this.buildIdInput.addEventListener('input', () => {
        this.buildId = this.buildIdInput.value.trim();
        this.updateSummary();
        this.updatePreview();
      });

      this.backendSelect.addEventListener('change', () => {
        this.backend = this.backendSelect.value;
        this.updateSummary();
        this.updatePreview();
      });

      this.regionSelect.addEventListener('change', () => {
        this.region = this.regionSelect.value;
        this.updateSummary();
        this.updatePreview();
      });

      this.platformButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.togglePlatform(btn.dataset.filter);
          this.updateSummary();
          this.updatePreview();
        });
      });

      this.flagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.toggleFlag(btn.dataset.filter);
          this.updateSummary();
          this.updatePreview();
        });
      });

      this.copyBtn.addEventListener('click', () => {
        if (this.validate()) this.copyConfiguration();
      });

      document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key.toLowerCase() === 'c' &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
          e.preventDefault();
          if (this.validate()) this.copyConfiguration();
        }
      });
    }

    togglePlatform(platform) {
      const btn = document.querySelector(`[data-filter="${platform}"]`);

      if (this.activePlatforms.includes(platform)) {
        this.activePlatforms = this.activePlatforms.filter(p => p !== platform);
        btn.classList.remove('active');
      } else {
        if (platform === 'PC') {
          this.activePlatforms = this.activePlatforms.filter(p => p !== 'Switch');
          document.querySelector(`[data-filter="Switch"]`)?.classList.remove('active');
        } else if (platform === 'Switch') {
          this.activePlatforms = this.activePlatforms.filter(p => p !== 'PC');
          document.querySelector(`[data-filter="PC"]`)?.classList.remove('active');
        }
        this.activePlatforms.push(platform);
        btn.classList.add('active');
      }
    }

    toggleFlag(flag) {
      const btn = document.querySelector(`[data-filter="${flag}"]`);

      if (this.activeFlags.includes(flag)) {
        this.activeFlags = this.activeFlags.filter(f => f !== flag);
        btn.classList.remove('active');
      } else {
        if (flag === 'LWM (BR)') {
          this.activeFlags = this.activeFlags.filter(f => f !== 'LWM (No BR)');
          document.querySelector(`[data-filter="LWM (No BR)"]`)?.classList.remove('active');
        } else if (flag === 'LWM (No BR)') {
          this.activeFlags = this.activeFlags.filter(f => f !== 'LWM (BR)');
          document.querySelector(`[data-filter="LWM (BR)"]`)?.classList.remove('active');
        }
        this.activeFlags.push(flag);
        btn.classList.add('active');
      }
    }

    updateSummary() {
      this.summaryBuildId.textContent = this.buildId || 'Not set';
      this.summaryBackend.textContent = this.backend;
      this.summaryRegion.textContent = this.region;

      const allFlags = [...this.activePlatforms, ...this.activeFlags];
      this.summaryFlags.textContent = allFlags.length ? allFlags.join(', ') : 'None';
    }

    updatePreview() {
      this.commandPreview.textContent = this.generateCommand();
    }

    generateCommand() {
      const buildId = this.buildId || 'Not set';
      const region = this.region;
      const backend = this.backend;
      const isPC = this.activePlatforms.includes('PC');
      const isSwitch = this.activePlatforms.includes('Switch');
      const { autoperfFlag, otherFlags } = this.generateFlags(isPC, isSwitch);

      let cmd = `${autoperfFlag} -mcpregion=${region} -buildidoverride=${buildId}`;
      if (!isPC) cmd += ` -epicapp=${backend}`;
      if (otherFlags) cmd += ` ${otherFlags}`;
      return cmd;
    }

    generateFlags(isPC, isSwitch) {
      const flags = [];
      let autoperfFlag = '-autoperf';

      if (isPC) flags.push('-forcetest');
      else if (isSwitch) flags.push('-skippatchcheck', '-hostwrite=C:\\\\SwitchLogs');
      else flags.push('-skippatchcheck');

      if (this.activeFlags.includes('Trace')) {
        autoperfFlag = '-autoperf=trace,csv';
        flags.push('-csvNamedEvents');
      }

      if (this.activeFlags.includes('LLM') || this.activeFlags.includes('LWM (BR)')) {
        flags.push('-llm', '-llmcsv');
      }

      if (this.activeFlags.includes('LWM (BR)') || this.activeFlags.includes('LWM (No BR)')) {
        flags.push('-trace=memalloc,memtag,module,log,region,metadata,assetmetadata', '-tracefile');
      }

      return { autoperfFlag, otherFlags: flags.join(' ') };
    }

    validate() {
      if (!this.buildId || this.buildId.length < 3 || isNaN(this.buildId)) {
        alert('Por favor ingresa un Build ID válido (mínimo 3 dígitos, numérico).');
        return false;
      }
      return true;
    }

    async copyConfiguration() {
      if (this.copying) return;
      this.copying = true;
      const text = this.generateCommand();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          this.fallbackCopy(text);
        }
        this.showCopyFeedback();
      } catch {
        alert(`Copia manual:\n\n${text}`);
      }
    }

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    showCopyFeedback() {
      const old = this.copyBtn.textContent;
      this.copyBtn.classList.add('copied');
      this.copyBtn.textContent = '¡Copiado!';
      setTimeout(() => {
        this.copyBtn.classList.remove('copied');
        this.copyBtn.textContent = old;
        this.copying = false;
      }, 1800);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('commnads-container');
    if (container) {
      renderCommandsPanel();
      new AppConfiguration();
    }

    window.renderCommandsApp = function () {
      renderCommandsPanel();
      new AppConfiguration();
    };
  });
})();
