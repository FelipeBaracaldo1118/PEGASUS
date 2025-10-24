/**
 * Epic Command Generator - Core Application Logic
 * Handles all configuration state and command generation
 */

class EpicCmdGenCore {
    constructor(options = {}) {
        this.buildId = '';
        this.backend = 'Cry';
        this.region = 'EU';
        this.activeArgs = [];
        this.activePlatform = 'Other';
        this.allRegionsEnabled = false;
        this.isCopying = false;
        this.container = options.container || null;
        this.localization = options.localization || null;
        this.onClose = options.onClose || null;
        this.storageKey = options.storageKey || 'epicCommandConfig';
        
        // Load cached values from localStorage
        this.loadFromCache();
    }

    /**
     * Initialize UI elements and bind events
     * @param {HTMLElement} container - Container element
     */
    initializeUI(container) {
        this.container = container;
        this.initializeElements();
        this.bindEvents();
        this.applyCachedValues();
        this.updateRazorAvailability();
        this.updateNoTimeoutAvailability();
        this.updateLaunchButtonVisibility();
        this.updateLaunchButtonState();
        this.updateRegionDropdown();
        this.updateSummary();
        this.updateGeneratedCommand();
    }

    initializeElements() {
        if (!this.container) return;

        // Input elements
        this.buildIdInput = this.container.querySelector('#buildId');
        this.backendSelect = this.container.querySelector('#backend');
        this.regionSelect = this.container.querySelector('#region');
        this.allRegionsToggle = this.container.querySelector('#allRegions');
        
        // Platform buttons
        this.platformButtons = this.container.querySelectorAll('.platforms-container .filter-btn');
        
        // Argument buttons
        this.argButtons = this.container.querySelectorAll('.args-container .filter-btn');
        this.razorBtn = this.container.querySelector('#razorBtn');
        this.noTimeoutBtn = this.container.querySelector('#noTimeoutBtn');
        
        // Action buttons
        this.copyBtn = this.container.querySelector('#copyBtn');
        this.launchBtn = this.container.querySelector('#launchBtn');
        this.closeBtn = this.container.querySelector('#closeBtn');
        
        // Summary elements
        this.summaryBuildId = this.container.querySelector('#summaryBuildId');
        this.summaryBackend = this.container.querySelector('#summaryBackend');
        this.summaryRegion = this.container.querySelector('#summaryRegion');
        this.summaryFlags = this.container.querySelector('#summaryFlags');
        
        // Generated command
        this.generatedCommand = this.container.querySelector('#generatedCommand');
    }

    bindEvents() {
        if (!this.container) return;

        // Build ID input - Only allow numeric values
        this.buildIdInput?.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;
            this.buildId = value.trim();
            this.saveToCache();
            this.updateSummary();
            this.updateGeneratedCommand();
            this.updateLaunchButtonState();
        });

        // Backend select
        this.backendSelect?.addEventListener('change', (e) => {
            this.backend = e.target.value;
            this.saveToCache();
            this.updateSummary();
            this.updateGeneratedCommand();
        });

        // Region select
        this.regionSelect?.addEventListener('change', (e) => {
            this.region = e.target.value;
            this.saveToCache();
            this.updateSummary();
            this.updateGeneratedCommand();
        });

        // All Regions toggle
        this.allRegionsToggle?.addEventListener('change', (e) => {
            this.allRegionsEnabled = e.target.checked;
            this.saveToCache();
            this.updateRegionDropdown();
        });

        // Platform buttons
        this.platformButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.target.dataset.filter;
                this.selectPlatform(platform);
                this.saveToCache();
                this.updateRazorAvailability();
                this.updateNoTimeoutAvailability();
                this.updateSummary();
                this.updateGeneratedCommand();
            });
        });

        // Argument buttons
        this.argButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const arg = e.target.dataset.filter;
                if (arg === 'Razor' && this.razorBtn?.classList.contains('disabled')) {
                    return;
                }
                if (arg === 'NoTimeout' && this.noTimeoutBtn?.classList.contains('disabled')) {
                    return;
                }
                this.toggleArg(arg);
                this.saveToCache();
                this.updateNoTimeoutAvailability();
                this.updateSummary();
                this.updateGeneratedCommand();
            });
        });

        // Copy button
        this.copyBtn?.addEventListener('click', () => {
            this.copyConfiguration();
        });

        // Launch button
        this.launchBtn?.addEventListener('click', () => {
            this.launchPSConfiguration();
        });

        // Close button
        this.closeBtn?.addEventListener('click', () => {
            if (this.onClose) {
                this.onClose();
            }
        });

        // Keyboard shortcuts
        const handleKeydown = (e) => {
            // Copy shortcut (Ctrl+C outside of inputs)
            if (e.ctrlKey && e.key === 'c' && 
                e.target.tagName !== 'INPUT' && 
                e.target.tagName !== 'SELECT' && 
                e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.copyConfiguration();
            }
            
            // Close shortcut (Escape)
            if (e.key === 'Escape' && this.onClose) {
                this.onClose();
            }
        };

        this.container.addEventListener('keydown', handleKeydown);
    }

    selectPlatform(platform) {
        if (this.activePlatform === platform) {
            // Reset: Clear all arguments when clicking the same platform
            this.activeArgs = [];
            this.argButtons?.forEach(btn => {
                btn.classList.remove('active');
            });
            this.saveToCache();
            this.updateSummary();
            this.updateGeneratedCommand();
            return;
        }
        
        const prevButton = this.container.querySelector(`[data-filter="${this.activePlatform}"]`);
        if (prevButton) {
            prevButton.classList.remove('active');
        }
        
        this.activePlatform = platform;
        const newButton = this.container.querySelector(`[data-filter="${platform}"]`);
        if (newButton) {
            newButton.classList.add('active');
        }
        
        this.updateLaunchButtonVisibility();
    }

    updateLaunchButtonVisibility() {
        if (!this.launchBtn) return;
        
        if (this.activePlatform === 'PS4' || this.activePlatform === 'PS5') {
            this.launchBtn.style.display = 'flex';
            this.updateLaunchButtonState();
        } else {
            this.launchBtn.style.display = 'none';
        }
    }

    updateLaunchButtonState() {
        if (!this.launchBtn) return;
        
        if (!this.buildId || this.buildId.trim() === '') {
            this.launchBtn.disabled = true;
            this.launchBtn.style.opacity = '0.5';
            this.launchBtn.style.cursor = 'not-allowed';
        } else {
            this.launchBtn.disabled = false;
            this.launchBtn.style.opacity = '1';
            this.launchBtn.style.cursor = 'pointer';
        }
    }

    toggleArg(arg) {
        const button = this.container.querySelector(`[data-filter="${arg}"]`);
        
        if (this.activeArgs.includes(arg)) {
            this.activeArgs = this.activeArgs.filter(a => a !== arg);
            button?.classList.remove('active');
        } else {
            const mutuallyExclusiveGroups = [
                ['LWM (BR)', 'LWM (No BR)', 'LLM']
            ];

            mutuallyExclusiveGroups.forEach(group => {
                if (group.includes(arg)) {
                    group.forEach(exclusiveArg => {
                        if (exclusiveArg !== arg && this.activeArgs.includes(exclusiveArg)) {
                            this.activeArgs = this.activeArgs.filter(a => a !== exclusiveArg);
                            const exclusiveButton = this.container.querySelector(`[data-filter="${exclusiveArg}"]`);
                            if (exclusiveButton) exclusiveButton.classList.remove('active');
                        }
                    });
                }
            });
            
            this.activeArgs.push(arg);
            button?.classList.add('active');
        }
        
        this.syncArgVisualState();
    }

    updateRazorAvailability() {
        if (!this.razorBtn) return;
        
        if (this.activePlatform === 'PS4' || this.activePlatform === 'PS5') {
            this.razorBtn.classList.remove('disabled');
        } else {
            this.razorBtn.classList.add('disabled');
            if (this.activeArgs.includes('Razor')) {
                this.activeArgs = this.activeArgs.filter(a => a !== 'Razor');
                this.razorBtn.classList.remove('active');
            }
        }
    }

    updateNoTimeoutAvailability() {
        if (!this.noTimeoutBtn) return;
        
        const isSwitchPlatform = this.activePlatform === 'Switch';
        const hasLLMorLWM = this.activeArgs.includes('LLM') || 
                           this.activeArgs.includes('LWM (BR)') || 
                           this.activeArgs.includes('LWM (No BR)');
        
        if (isSwitchPlatform && hasLLMorLWM) {
            this.noTimeoutBtn.classList.remove('disabled');
        } else {
            this.noTimeoutBtn.classList.add('disabled');
            if (this.activeArgs.includes('NoTimeout')) {
                this.activeArgs = this.activeArgs.filter(a => a !== 'NoTimeout');
                this.noTimeoutBtn.classList.remove('active');
            }
        }
    }

    updateRegionDropdown() {
        if (!this.regionSelect) return;
        
        const allOptions = this.regionSelect.querySelectorAll('option');
        
        allOptions.forEach(option => {
            const value = option.value;
            if (value === 'EU' || value === 'BR' || value === 'NAE') {
                option.removeAttribute('hidden');
                option.disabled = false;
                return;
            }
            
            if (this.allRegionsEnabled) {
                option.removeAttribute('hidden');
                option.disabled = false;
            } else {
                option.setAttribute('hidden', '');
                option.disabled = true;
                if (value === this.region) {
                    this.region = 'EU';
                    this.regionSelect.value = 'EU';
                    this.saveToCache();
                    this.updateSummary();
                    this.updateGeneratedCommand();
                }
            }
        });
    }

    syncArgVisualState() {
        this.argButtons?.forEach(btn => {
            const arg = btn.dataset.filter;
            if (this.activeArgs.includes(arg)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateSummary() {
        if (!this.summaryBuildId) return;
        
        const notSetText = this.localization ? this.localization.t('notSet') : 'Not set';
        this.summaryBuildId.textContent = this.buildId || notSetText;
        this.summaryBackend.textContent = this.backend;
        this.summaryRegion.textContent = this.region;
        
        const allActiveItems = [this.activePlatform, ...this.activeArgs];
        if (allActiveItems.length === 1 && allActiveItems[0] === 'Other') {
            this.summaryFlags.textContent = 'Other';
        } else if (this.activeArgs.length === 0) {
            this.summaryFlags.textContent = this.activePlatform;
        } else {
            this.summaryFlags.textContent = allActiveItems.join(', ');
        }
    }

    updateGeneratedCommand() {
        if (!this.generatedCommand) return;
        
        const command = this.generateConfigurationText();
        this.generatedCommand.value = command;
    }

    generateConfigurationText() {
        // Use the centralized commandGenerator module if available
        if (typeof generateCommand !== 'undefined') {
            // Normalize argument names for the API (convert display format to API format)
            const normalizedArgs = this.activeArgs.map(arg => {
                if (arg === 'LWM (BR)') return 'LWM_BR';
                if (arg === 'LWM (No BR)') return 'LWM_NoBR';
                return arg;
            });
            
            try {
                return generateCommand({
                    buildIDOverride: this.buildId,
                    backend: this.backend,
                    region: this.region,
                    platform: this.activePlatform,
                    args: normalizedArgs
                });
            } catch (error) {
                console.warn('Error in commandGenerator, using fallback:', error);
                return this.generateConfigurationTextFallback();
            }
        }
        
        // Fallback if commandGenerator is not loaded
        console.warn('commandGenerator module not available, using fallback');
        return this.generateConfigurationTextFallback();
    }
    
    /**
     * Fallback command generation (only used if commandGenerator is unavailable)
     * @private
     */
    generateConfigurationTextFallback() {
        const buildId = this.buildId || '❓';
        const region = this.region;
        const backend = this.backend;
        
        const { autoperfArg, otherArgs } = this.generateArgs();
        
        let command = `${autoperfArg} -mcpregion=${region} -buildidoverride=${buildId}`;
        
        if (this.activePlatform !== 'PC') {
            command += ` -epicapp=${backend}`;
        }
        
        if (otherArgs.length > 0) {
            command += ` ${otherArgs}`;
        }
        
        return command;
    }
    
    /**
     * Fallback argument generation (only used if commandGenerator is unavailable)
     * @private
     */
    generateArgs() {
        const platformArgs = [];
        let autoperfArg = '-autoperf';
        
        if (this.activePlatform === 'PC') {
            platformArgs.push('-forcetest');
        } else if (this.activePlatform === 'Switch') {
            platformArgs.push('-skippatchcheck');
            platformArgs.push('-hostwrite=C:\\SwitchLogs');
        } else if (this.activePlatform === 'PS4' || this.activePlatform === 'PS5') {
            platformArgs.push('-skippatchcheck');
        } else {
            platformArgs.push('-skippatchcheck');
        }
        
        const hasTrace = this.activeArgs.includes('Trace');
        const hasLLM = this.activeArgs.includes('LLM');
        const hasLWM_BR = this.activeArgs.includes('LWM (BR)');
        const hasLWM_NoBR = this.activeArgs.includes('LWM (No BR)');
        const hasRazor = this.activeArgs.includes('Razor');
        const hasNoTimeout = this.activeArgs.includes('NoTimeout');
        
        if (hasTrace) {
            autoperfArg = '-autoperf=trace,csv';
            platformArgs.push('-csvNamedEvents');
        }
        
        const needsLLMArgs = hasLLM || hasLWM_BR;
        if (needsLLMArgs) {
            platformArgs.push('-llm');
            platformArgs.push('-llmcsv');
        }
        
        if (hasLWM_BR || hasLWM_NoBR) {
            platformArgs.push('-trace=memalloc,memtag,module,log,region,metadata,assetmetadata');
            platformArgs.push('-tracefile');
        }
        
        if (hasRazor && (this.activePlatform === 'PS4' || this.activePlatform === 'PS5')) {
            platformArgs.push('-ExecCmds=fx.DetailedCSVStats 1, fx.DetailedCSVStats.MemoryMode 2');
        }
        
        if (hasNoTimeout && this.activePlatform === 'Switch') {
            platformArgs.push('-nothreadtimeout');
        }
        
        return {
            autoperfArg: autoperfArg,
            otherArgs: platformArgs.join(' ')
        };
    }

    async copyConfiguration() {
        if (this.isCopying) return;
        
        this.isCopying = true;
        
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
            alert(`Copy this text manually:\n\n${this.generateConfigurationText()}`);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopyFeedback();
            } else {
                alert(`Copy this text manually:\n\n${text}`);
            }
        } catch (err) {
            alert(`Copy this text manually:\n\n${text}`);
        }
        
        document.body.removeChild(textArea);
    }

    showCopyFeedback() {
        if (!this.copyBtn) return;
        
        const copyText = this.copyBtn.querySelector('.copy-text');
        const copiedText = this.localization ? this.localization.t('copied') : 'Copied!';
        const originalText = copyText.textContent;
        
        this.copyBtn.classList.add('copied');
        copyText.textContent = copiedText;
        
        this.copyBtn.disabled = true;
        this.copyBtn.style.pointerEvents = 'none';
        
        const resetButton = () => {
            this.copyBtn.classList.remove('copied');
            copyText.textContent = originalText;
            this.copyBtn.disabled = false;
            this.copyBtn.style.pointerEvents = 'auto';
            this.isCopying = false;
        };
        
        this.copyBtn.addEventListener('animationend', resetButton, { once: true });
        setTimeout(resetButton, 2500);
    }

    generatePSLaunchJSON() {
        const buildId = this.buildId || '❓';
        const region = this.region;
        const backend = this.backend;
        
        const { autoperfArg, otherArgs } = this.generateArgs();
        
        const args = EpicCmdGenLaunchConfigs.buildArgsArray({
            autoperfArg,
            region,
            buildId,
            backend,
            otherArgs
        });
        
        return EpicCmdGenLaunchConfigs.generatePSLaunchJSON(this.activePlatform, {
            buildId,
            region,
            backend,
            args
        });
    }

    async launchPSConfiguration() {
        try {
            const isPSFive = this.activePlatform === 'PS5';
            const isPSFour = this.activePlatform === 'PS4';
            
            if (!isPSFour && !isPSFive) {
                console.error('Launch button clicked but no PS platform selected');
                return;
            }
            
            const jsonContent = this.generatePSLaunchJSON();
            const extension = isPSFive ? '.ps5launch' : '.ps4launch';
            
            // Web version - download the file
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ps${isPSFive ? '5' : '4'}_launch_${Date.now()}${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to launch PS configuration: ', err);
            alert(`Failed to launch PS configuration: ${err.message}`);
        }
    }

    getConfiguration() {
        return {
            buildId: this.buildId,
            backend: this.backend,
            region: this.region,
            activePlatform: this.activePlatform,
            activeArgs: this.activeArgs,
            allRegionsEnabled: this.allRegionsEnabled,
            generatedText: this.generateConfigurationText()
        };
    }

    saveToCache() {
        const config = {
            buildId: this.buildId,
            backend: this.backend,
            region: this.region,
            activePlatform: this.activePlatform,
            activeArgs: this.activeArgs,
            allRegionsEnabled: this.allRegionsEnabled
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(config));
        } catch (e) {
            console.error('Failed to save to cache:', e);
        }
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.storageKey);
            if (cached) {
                const config = JSON.parse(cached);
                this.buildId = config.buildId || '';
                this.backend = config.backend || 'Cry';
                this.region = config.region || 'EU';
                this.activePlatform = config.activePlatform || 'Other';
                this.activeArgs = config.activeArgs || [];
                this.allRegionsEnabled = config.allRegionsEnabled || false;
            }
        } catch (e) {
            console.error('Failed to load from cache:', e);
        }
    }

    applyCachedValues() {
        if (!this.container) return;
        
        if (this.buildIdInput) this.buildIdInput.value = this.buildId;
        if (this.backendSelect) this.backendSelect.value = this.backend;
        if (this.regionSelect) this.regionSelect.value = this.region;
        if (this.allRegionsToggle) this.allRegionsToggle.checked = this.allRegionsEnabled;
        
        this.platformButtons?.forEach(btn => {
            if (btn.dataset.filter === this.activePlatform) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.argButtons?.forEach(btn => {
            if (this.activeArgs.includes(btn.dataset.filter)) {
                btn.classList.add('active');
            }
        });
    }
}

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpicCmdGenCore;
} else {
    window.EpicCmdGenCore = EpicCmdGenCore;
}

