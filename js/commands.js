// js/commands-app.js
// Renderiza y opera el Generador de Comandos en #commnads-container (modal-commands)

(function () {
  // ====== UI MARKUP ======
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
              <option value="Backflip">Backflip</option>
              <option value="Baseball">Baseball</option>
              <option value="DevPlaytestH">DevPlayTestH</option>
            </select>
          </label>
          <label>
            Región
            <input type="text" id="region" placeholder="ej. NAE, EU" />
          </label>
        </fieldset>

        <div style="margin-top:10px">
          <h3 style="margin:10px 0;">Flags</h3>
          <div id="flagsContainer" class="options"></div>
          <small class="muted">
            Note: <strong>PC</strong> and <strong>Switch</strong> are not mutually exclusive .
            <strong>LWM (BR)</strong> y <strong>LWM (No BR)</strong> also.
          </small>
        </div>

        <div class="grid" style="margin-top:12px;">
        
        </div>
      </form>

      <div class="card " >
      
        <h3>Resumen</h3>
        <p><span class="gradient-text">Build ID:</span> <span id="summaryBuildId">Not set</span></p>
        <p><span class="gradient-text">Backend:</span> <span id="summaryBackend">Cry</span></p>
        <p><span class="gradient-text">Región:</span> <span id="summaryRegion">Not set</span></p>
        <p><span class="gradient-text">Flags:</span> <span id="summaryFlags">None</span></p>
      </div>

      <section class="card-2" style="margin-top:14px;"> 
        <div class="card-header">
        <h3>Comando generado</h3>
         <button id="copyBtn" class="primary" type="button">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </button>

        </div>
        <pre id="commandPreview" style="white-space:pre-wrap;word-break:break-word;margin:0;"></pre>
      </section>
    `;
  }

  class AppConfiguration {
    constructor() {
      this.buildId = '';
      this.backend = 'Baseball';
      this.region = '';
      this.activeFlags = [];

      // Catálogo de flags del UI
      this.AVAILABLE_FLAGS = [
        'PC', 'Switch', 
        'Trace', 'LLM',
        'LWM (BR)', 'LWM (No BR)',
        // agrega más si quieres:
        // 'forcetest', 'skippatchcheck', ...
      ];

      this.initializeElements();
      this.renderFlagButtons();
      this.bindEvents();
      this.updateSummary();
      this.updatePreview();
    }

    initializeElements() {
      this.buildIdInput = document.getElementById('buildId');
      this.backendSelect = document.getElementById('backend');
      this.regionInput = document.getElementById('region');

      this.flagsContainer = document.getElementById('flagsContainer');
      this.copyBtn = document.getElementById('copyBtn');

      this.summaryBuildId = document.getElementById('summaryBuildId');
      this.summaryBackend = document.getElementById('summaryBackend');
      this.summaryRegion = document.getElementById('summaryRegion');
      this.summaryFlags = document.getElementById('summaryFlags');

      this.commandPreview = document.getElementById('commandPreview');
    }

    renderFlagButtons() {
      this.flagsContainer.innerHTML = '';
      this.AVAILABLE_FLAGS.forEach(flag => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn';
        btn.dataset.filter = flag;
        btn.textContent = flag;
        this.flagsContainer.appendChild(btn);
      });
      this.flagButtons = this.flagsContainer.querySelectorAll('.filter-btn');
    }

    bindEvents() {
      // Build ID
      this.buildIdInput.addEventListener('input', (e) => {
        this.buildId = e.target.value.trim();
        this.updateSummary(); this.updatePreview();
      });

      // Backend
      this.backendSelect.addEventListener('change', (e) => {
        this.backend = e.target.value;
        this.updateSummary(); this.updatePreview();
      });

      // Región
      this.regionInput.addEventListener('input', (e) => {
        this.region = e.target.value.trim();
        this.updateSummary(); this.updatePreview();
      });

      // Flags
      this.flagButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const flag = e.currentTarget.dataset.filter;
          this.toggleFlag(flag);
          this.updateSummary(); this.updatePreview();
        });
      });

      // Copiar
      this.copyBtn.addEventListener('click', () => this.copyConfiguration());

      // Atajo Ctrl+C (fuera de inputs/select/textarea)
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C') &&
            !['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault();
          this.copyConfiguration();
        }
      });
    }

    toggleFlag(flag) {
      const button = this.flagsContainer.querySelector(`[data-filter="${CSS.escape(flag)}"]`);

      if (this.activeFlags.includes(flag)) {
        // quitar
        this.activeFlags = this.activeFlags.filter(f => f !== flag);
        button?.classList.remove('active');
      } else {
        // Exclusiones PC/Switch
        if (flag === 'PC' && this.activeFlags.includes('Switch')) {
          this.activeFlags = this.activeFlags.filter(f => f !== 'Switch');
          this.flagsContainer.querySelector(`[data-filter="Switch"]`)?.classList.remove('active');
        } else if (flag === 'Switch' && this.activeFlags.includes('PC')) {
          this.activeFlags = this.activeFlags.filter(f => f !== 'PC');
          this.flagsContainer.querySelector(`[data-filter="PC"]`)?.classList.remove('active');
        }

        // Exclusiones LWM
        if (flag === 'LWM (BR)' && this.activeFlags.includes('LWM (No BR)')) {
          this.activeFlags = this.activeFlags.filter(f => f !== 'LWM (No BR)');
          this.flagsContainer.querySelector(`[data-filter="LWM (No BR)"]`)?.classList.remove('active');
        } else if (flag === 'LWM (No BR)' && this.activeFlags.includes('LWM (BR)')) {
          this.activeFlags = this.activeFlags.filter(f => f !== 'LWM (BR)');
          this.flagsContainer.querySelector(`[data-filter="LWM (BR)"]`)?.classList.remove('active');
        }

        // añadir
        this.activeFlags.push(flag);
        button?.classList.add('active');
      }

      this.syncVisualState();
    }

    syncVisualState() {
      this.flagButtons.forEach(btn => {
        const flag = btn.dataset.filter;
        if (this.activeFlags.includes(flag)) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }

    updateSummary() {
      this.summaryBuildId.textContent = this.buildId || 'Not set';
      this.summaryBackend.textContent = this.backend;
      this.summaryRegion.textContent = this.region || 'Not set';
      this.summaryFlags.textContent = this.activeFlags.length ? this.activeFlags.join(', ') : 'None';
    }

    updatePreview() {
      this.commandPreview.textContent = this.generateConfigurationText();
    }

    generateConfigurationText() {
      const buildId = this.buildId || 'Not set';
      const region = this.region || 'Not set';
      const backend = this.backend;

      const isPC = this.activeFlags.includes('PC');
      const isSwitch = this.activeFlags.includes('Switch');
      

      const { autoperfFlag, otherFlags } = this.generateFlags(isPC, isSwitch);

      let command = `${autoperfFlag} -mcpregion=${region} -buildidoverride=${buildId} -epicapp=${backend}`;
      if (otherFlags.length > 0) command += ` ${otherFlags}`;
      return command;
    }

    generateFlags(isPC, isSwitch) {
      const flags = [];
      let autoperfFlag = '-autoperf';

      // Base por plataforma
      if (isPC) {
        flags.push('-forcetest');
      } else if (isSwitch) {
        flags.push('-skippatchcheck');
        flags.push('-hostwrite=C:\\\\SwitchLogs');
      } else {
        flags.push('-skippatchcheck');
      }

      // Perfiles
      const hasTrace = this.activeFlags.includes('Trace');
      const hasLLM = this.activeFlags.includes('LLM');
      const hasLWM_BR = this.activeFlags.includes('LWM (BR)');
      const hasLWM_NoBR = this.activeFlags.includes('LWM (No BR)');

      if (hasTrace) {
        autoperfFlag = '-autoperf=trace,csv';
        flags.push('-csvNamedEvents');
      }

      if (hasLLM || hasLWM_BR) {
        flags.push('-llm', '-llmcsv');
      }

      if (hasLWM_BR || hasLWM_NoBR) {
        flags.push('-trace=memalloc,memtag,module,log,region,metadata,assetmetadata', '-tracefile');
      }

      return { autoperfFlag, otherFlags: flags.join(' ') };
    }

    async copyConfiguration() {
      try {
        const configText = this.generateConfigurationText();
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(configText);
          this.showCopyFeedback();
        } else {
          this.fallbackCopyTextToClipboard(configText);
        }
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert(`Copia manual:\n\n${this.generateConfigurationText()}`);
      }
    }

    fallbackCopyTextToClipboard(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand('copy');
        if (ok) this.showCopyFeedback(); else alert(`Copia manual:\n\n${text}`);
      } catch {
        alert(`Copia manual:\n\n${text}`);
      }
      document.body.removeChild(ta);
    }

    showCopyFeedback() {
      this.copyBtn.classList.add('copied');
      const prev = this.copyBtn.textContent;
      this.copyBtn.textContent = '¡Copiado!';
      setTimeout(() => {
        this.copyBtn.classList.remove('copied');
        this.copyBtn.textContent = prev;
      }, 1500);
    }
  }

  // Montar al cargar (o cuando abras el modal si prefieres)
  document.addEventListener('DOMContentLoaded', () => {
    renderCommandsPanel();
    new AppConfiguration();
  });

 
  // window.renderCommandsApp = function () {
  //   renderCommandsPanel();
  //   new AppConfiguration();
  // };
})();
