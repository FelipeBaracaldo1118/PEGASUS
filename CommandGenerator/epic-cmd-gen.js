/**
 * Epic Command Generator - Main API
 * Provides simple initialization and modal rendering functions
 */

(function(global) {
    'use strict';

    const EpicCmdGen = {
        // Store instances
        instances: new Map(),
        
        /**
         * HTML Template for the app
         */
        getTemplate() {
            return `
                <div class="epic-cmd-gen">
                    <div class="main-card">
                        <!-- Header -->
                        <div class="header">
                            <div class="header-content">
                                <div class="title-section">
                                    <h1 class="title" data-i18n="title">Command Generator</h1>
                                    <p class="subtitle" data-i18n="subtitle">Configure your launch options by adding the correct arguments and parameters</p>
                                </div>
                                <button class="close-btn" id="closeBtn" title="Close" data-i18n-title="closeTooltip">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Main Content - Two Columns -->
                        <div class="main-content">
                            <!-- Left Column - Configuration -->
                            <div class="config-column">
                                <!-- Input Fields -->
                                <div class="input-section">
                                    <div class="input-group">
                                        <label class="input-label" data-i18n="buildIdOverride">Build ID Override</label>
                                        <input type="text" id="buildId" class="input-field" placeholder="ej. 42069" data-i18n-placeholder="buildIdPlaceholder" inputmode="numeric" pattern="[0-9]*">
                                    </div>

                                    <div class="input-group">
                                        <label class="input-label" data-i18n="backend">Backend</label>
                                        <select id="backend" class="select-field">
                                            <option value="Cry" data-i18n="cry">Cry</option>
                                            <option value="DevPlayTestH" data-i18n="devPlayTestH">DevPlayTestH</option>
                                            <option value="Baseball" data-i18n="baseball">Baseball</option>
                                            <option value="Backflip" data-i18n="backflip">Backflip</option>
                                        </select>
                                    </div>

                                    <div class="input-group">
                                        <div class="region-header">
                                            <label class="input-label" data-i18n="region">Region</label>
                                            <label class="toggle-switch">
                                                <input type="checkbox" id="allRegions">
                                                <span class="toggle-slider"></span>
                                                <span class="toggle-label" data-i18n="allRegions">All Regions</span>
                                            </label>
                                        </div>
                                        <select id="region" class="select-field">
                                            <option value="EU" data-i18n="eu">EU</option>
                                            <option value="BR" data-i18n="br">BR</option>
                                            <option value="NAE" data-i18n="nae">NAE</option>
                                            <option value="ASIA" data-i18n="asia" hidden disabled>ASIA</option>
                                            <option value="ME" data-i18n="me" hidden disabled>ME</option>
                                            <option value="NAC" data-i18n="nac" hidden disabled>NAC</option>
                                            <option value="NAW" data-i18n="naw" hidden disabled>NAW</option>
                                            <option value="OCE" data-i18n="oce" hidden disabled>OCE</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Platforms Section -->
                                <div class="platforms-section">
                                    <label class="input-label" data-i18n="platforms">Platforms</label>
                                    <div class="platforms-container">
                                        <button class="filter-btn active" data-filter="Other" data-i18n="other">OTHER</button>
                                        <button class="filter-btn" data-filter="PS4" data-i18n="ps4">PS4</button>
                                        <button class="filter-btn" data-filter="PS5" data-i18n="ps5">PS5</button>
                                        <button class="filter-btn" data-filter="PC" data-i18n="pc">PC</button>
                                        <button class="filter-btn" data-filter="Switch" data-i18n="switch">SWITCH</button>
                                    </div>
                                    <div class="note" data-i18n="platformNote">Note: Only one platform can be selected at a time.</div>
                                </div>

                                <!-- Arguments Section -->
                                <div class="args-section">
                                    <label class="input-label" data-i18n="arguments">Arguments</label>
                                    <div class="args-container">
                                        <button class="filter-btn" data-filter="Trace" data-i18n="trace">TRACE</button>
                                        <button class="filter-btn" data-filter="LLM" data-i18n="llm">LLM</button>
                                        <button class="filter-btn" data-filter="LWM (BR)" data-i18n="lwmBr">LWM (BR)</button>
                                        <button class="filter-btn" data-filter="LWM (No BR)" data-i18n="lwmNoBr">LWM (NO BR)</button>
                                        <button class="filter-btn disabled" data-filter="Razor" data-i18n="razor" id="razorBtn">RAZOR</button>
                                        <button class="filter-btn disabled" data-filter="NoTimeout" data-i18n="noTimeout" id="noTimeoutBtn">NOTIMEOUT</button>
                                    </div>
                                    <div class="note" data-i18n="argNote">LLM, LWM (BR) and LWM (No BR) are mutually exclusive. Razor is only available for PS4 and PS5 platforms. NoTimeout is only available for Switch platform with LLM or LWM arguments.</div>
                                </div>
                            </div>

                            <!-- Right Column - Summary and Command -->
                            <div class="summary-column">
                                <!-- Summary Section -->
                                <div class="summary-section">
                                    <h3 class="summary-title" data-i18n="summary">Summary</h3>
                                    <div class="summary-content">
                                        <div class="summary-item">
                                            <span class="summary-label" data-i18n="buildIdLabel">Build ID:</span>
                                            <span class="summary-value" id="summaryBuildId" data-i18n="notSet">Not set</span>
                                        </div>
                                        <div class="summary-item">
                                            <span class="summary-label" data-i18n="backendLabel">Backend:</span>
                                            <span class="summary-value" id="summaryBackend">Cry</span>
                                        </div>
                                        <div class="summary-item">
                                            <span class="summary-label" data-i18n="regionLabel">Region:</span>
                                            <span class="summary-value" id="summaryRegion">EU</span>
                                        </div>
                                        <div class="summary-item">
                                            <span class="summary-label" data-i18n="argumentsLabel">Arguments:</span>
                                            <span class="summary-value" id="summaryFlags" data-i18n="none">None</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Generated Command Section -->
                                <div class="command-section">
                                    <div class="command-header">
                                        <h3 class="command-title" data-i18n="generatedCommand">Generated Command</h3>
                                        <div class="action-buttons">
                                            <button class="launch-btn" id="launchBtn" title="Launch PS5 configuration" data-i18n-title="launchTooltip" style="display: none;">
                                                <span class="launch-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                    </svg>
                                                </span>
                                                <span class="launch-text" data-i18n="launch">Launch</span>
                                            </button>
                                            <button class="copy-btn" id="copyBtn" title="Copy configuration to clipboard" data-i18n-title="copyTooltip">
                                                <span class="copy-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </span>
                                                <span class="copy-text" data-i18n="copy">Copy</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="command-display">
                                        <textarea id="generatedCommand" class="command-textarea" readonly></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Initialize Epic Command Generator
         * @param {Object} options - Configuration options
         * @param {string} options.containerId - ID of container element
         * @param {boolean} [options.modal=false] - Render as modal
         * @param {boolean} [options.fullscreen=true] - Fullscreen mode (only for non-modal)
         * @param {string} [options.language='en'] - Language code ('en' or 'es')
         * @param {Function} [options.onClose] - Callback when closed
         * @param {string} [options.storageKey='epicCommandConfig'] - LocalStorage key
         * @returns {Object} Instance with methods
         */
        init(options = {}) {
            const containerId = options.containerId || 'epicCmdGenRoot';
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error(`Container with id "${containerId}" not found`);
                return null;
            }

            // Create localization instance
            const localization = new EpicCmdGenLocalization();
            if (options.language) {
                localization.setLanguage(options.language);
            }

            // Render template
            container.innerHTML = this.getTemplate();

            // Get the main container
            const appContainer = container.querySelector('.epic-cmd-gen');
            
            // Apply fullscreen class if not modal
            if (!options.modal && options.fullscreen !== false) {
                appContainer.classList.add('fullscreen');
            }

            // Hide close button if not modal
            const closeBtn = container.querySelector('#closeBtn');
            if (!options.modal) {
                closeBtn.style.display = 'none';
            }

            // Initialize core
            const core = new EpicCmdGenCore({
                container: appContainer,
                localization: localization,
                onClose: options.onClose,
                storageKey: options.storageKey || 'epicCommandConfig'
            });

            // Initialize UI
            core.initializeUI(appContainer);

            // Update localization
            localization.updateUI(appContainer);

            // Store instance
            const instance = {
                core: core,
                localization: localization,
                container: container,
                destroy: () => {
                    container.innerHTML = '';
                    this.instances.delete(containerId);
                },
                getConfiguration: () => core.getConfiguration(),
                setLanguage: (lang) => localization.setLanguage(lang, appContainer)
            };

            this.instances.set(containerId, instance);
            return instance;
        },

        /**
         * Open as modal
         * @param {Object} options - Configuration options
         * @param {string} [options.language='en'] - Language code
         * @param {Function} [options.onClose] - Callback when closed
         * @param {string} [options.storageKey='epicCommandConfig'] - LocalStorage key
         * @returns {Object} Modal instance with close method
         */
        openModal(options = {}) {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'epic-cmd-gen-modal-overlay';
            overlay.id = 'epicCmdGenModal';

            // Create modal container
            const modalContainer = document.createElement('div');
            modalContainer.id = 'epicCmdGenModalContainer';
            overlay.appendChild(modalContainer);

            // Add to body
            document.body.appendChild(overlay);

            // Close function
            const close = () => {
                if (options.onClose) {
                    options.onClose();
                }
                document.body.removeChild(overlay);
                this.instances.delete('epicCmdGenModalContainer');
            };

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    close();
                }
            });

            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Initialize inside modal
            const instance = this.init({
                containerId: 'epicCmdGenModalContainer',
                modal: true,
                language: options.language,
                onClose: close,
                storageKey: options.storageKey
            });

            return {
                close: close,
                getInstance: () => instance
            };
        },

        /**
         * Get instance by container ID
         * @param {string} containerId - Container ID
         * @returns {Object|null} Instance or null
         */
        getInstance(containerId) {
            return this.instances.get(containerId) || null;
        }
    };

    // Export to global scope
    global.EpicCmdGen = EpicCmdGen;

})(typeof window !== 'undefined' ? window : global);

