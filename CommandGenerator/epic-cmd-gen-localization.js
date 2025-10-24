/**
 * Epic Command Generator - Localization System
 * Provides multi-language support for the application
 */

class EpicCmdGenLocalization {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {
            en: {
                // Header
                title: "Command Generator",
                subtitle: "Configure your launch options by adding the correct arguments and parameters",
                
                // Input fields
                buildIdOverride: "Build ID Override",
                buildIdPlaceholder: "ej. 42069",
                backend: "Backend",
                region: "Region",
                
                // Sections
                platforms: "Platforms",
                arguments: "Arguments",
                summary: "Summary",
                generatedCommand: "Generated Command",
                
                // Platform options
                other: "OTHER",
                ps4: "PS4",
                ps5: "PS5",
                pc: "PC",
                switch: "SWITCH",
                
                // Argument options
                trace: "TRACE",
                llm: "LLM",
                lwmBr: "LWM (BR)",
                lwmNoBr: "LWM (NO BR)",
                razor: "RAZOR",
                noTimeout: "NOTIMEOUT",
                
                // Backend options
                cry: "Cry",
                devPlayTestH: "DevPlayTestH",
                baseball: "Baseball",
                backflip: "Backflip",
                
                // Region options
                asia: "ASIA",
                br: "BR",
                eu: "EU",
                me: "ME",
                nac: "NAC",
                nae: "NAE",
                naw: "NAW",
                oce: "OCE",
                
                // Region toggle
                allRegions: "All Regions",
                
                // Summary labels
                buildIdLabel: "Build ID:",
                backendLabel: "Backend:",
                regionLabel: "Region:",
                argumentsLabel: "Arguments:",
                
                // Default values
                notSet: "Not set",
                none: "None",
                
                // Notes
                platformNote: "Only one platform can be selected at a time.",
                argNote: "LLM, LWM (BR) and LWM (No BR) are mutually exclusive. Razor is only available for PS4 and PS5 platforms. NoTimeout is only available for Switch platform with LLM or LWM arguments.",
                
                // Buttons
                copy: "Copy",
                copied: "Copied!",
                close: "Close",
                launch: "Launch",
                
                // Tooltips
                copyTooltip: "Copy configuration to clipboard",
                closeTooltip: "Close",
                launchTooltip: "Launch PS configuration"
            },
            es: {
                // Header
                title: "Generador de Comandos",
                subtitle: "Configura tus opciones de lanzamiento agregando los argumentos y parámetros correctos",
                
                // Input fields
                buildIdOverride: "Build ID Override",
                buildIdPlaceholder: "ej. 42069",
                backend: "Backend",
                region: "Región",
                
                // Sections
                platforms: "Plataformas",
                arguments: "Argumentos",
                summary: "Resumen",
                generatedCommand: "Comando generado",
                
                // Platform options
                other: "OTRO",
                ps4: "PS4",
                ps5: "PS5",
                pc: "PC",
                switch: "SWITCH",
                
                // Argument options
                trace: "TRACE",
                llm: "LLM",
                lwmBr: "LWM (BR)",
                lwmNoBr: "LWM (NO BR)",
                razor: "RAZOR",
                noTimeout: "NOTIMEOUT",
                
                // Backend options
                cry: "Cry",
                devPlayTestH: "DevPlayTestH",
                baseball: "Baseball",
                backflip: "Backflip",
                
                // Region options
                asia: "ASIA",
                br: "BR",
                eu: "EU",
                me: "ME",
                nac: "NAC",
                nae: "NAE",
                naw: "NAW",
                oce: "OCE",
                
                // Region toggle
                allRegions: "Todas las Regiones",
                
                // Summary labels
                buildIdLabel: "Build ID:",
                backendLabel: "Backend:",
                regionLabel: "Región:",
                argumentsLabel: "Argumentos:",
                
                // Default values
                notSet: "No establecido",
                none: "Ninguno",
                
                // Notes
                platformNote: "Solo se puede seleccionar una plataforma a la vez.",
                argNote: "LLM, LWM (BR) y LWM (No BR) son mutuamente excluyentes. Razor solo está disponible para plataformas PS4 y PS5. NoTimeout solo está disponible para la plataforma Switch con argumentos LLM o LWM.",
                
                // Buttons
                copy: "Copiar",
                copied: "¡Copiado!",
                close: "Cerrar",
                launch: "Lanzar",
                
                // Tooltips
                copyTooltip: "Copiar configuración al portapapeles",
                closeTooltip: "Cerrar",
                launchTooltip: "Lanzar configuración PS"
            }
        };
    }
    
    /**
     * Set the current language
     * @param {string} lang - Language code ('en' or 'es')
     * @param {HTMLElement} container - Optional container to update
     */
    setLanguage(lang, container = document) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.updateUI(container);
        }
    }
    
    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @returns {string} Translated text
     */
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    /**
     * Update UI with current language translations
     * @param {HTMLElement} container - Container to update (defaults to document)
     */
    updateUI(container = document) {
        // Update all text elements with current language
        const elements = container.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // Update placeholders
        const placeholders = container.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Update titles
        const titles = container.querySelectorAll('[data-i18n-title]');
        titles.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }
}

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpicCmdGenLocalization;
} else {
    window.EpicCmdGenLocalization = EpicCmdGenLocalization;
}

