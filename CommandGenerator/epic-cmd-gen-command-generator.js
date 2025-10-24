/**
 * Epic Command Generator - Standalone Command Builder
 * 
 * This module provides a programmatic way to generate Epic Games launch commands
 * without requiring the UI. Can be used for automation, testing, or integration.
 * 
 * @module commandGenerator
 */

/**
 * Generates an Epic Games launch command string
 * 
 * @param {Object} config - Configuration object
 * @param {string} [config.buildIDOverride=''] - Build ID (numeric string, empty shows ❓)
 * @param {string} [config.backend='Cry'] - Backend name (Cry, DevPlayTestH, Baseball, Backflip)
 * @param {string} [config.region='EU'] - Region code (EU, BR, NAE, ASIA, ME, NAC, NAW, OCE)
 * @param {string} [config.platform='Other'] - Platform (Other, PS4, PS5, PC, Switch)
 * @param {string[]} [config.args=[]] - Array of argument names (Trace, LLM, LWM_BR, LWM_NoBR, Razor, NoTimeout)
 * 
 * @returns {string} Generated command string
 * 
 * @example
 * // Basic command
 * const cmd = generateCommand({
 *   buildIDOverride: '12345',
 *   backend: 'DevPlayTestH',
 *   region: 'NAE',
 *   platform: 'Other'
 * });
 * // Returns: "-autoperf -mcpregion=NAE -buildidoverride=12345 -epicapp=DevPlayTestH -skippatchcheck"
 * 
 * @example
 * // With arguments
 * const cmd = generateCommand({
 *   buildIDOverride: '98765',
 *   backend: 'Baseball',
 *   region: 'EU',
 *   platform: 'PS5',
 *   args: ['Trace', 'Razor']
 * });
 * // Returns: "-autoperf=trace,csv -csvNamedEvents -mcpregion=EU -buildidoverride=98765 -epicapp=Baseball -skippatchcheck -ExecCmds=fx.DetailedCSVStats 1, fx.DetailedCSVStats.MemoryMode 2"
 * 
 * @example
 * // PC platform (no epicapp)
 * const cmd = generateCommand({
 *   buildIDOverride: '55555',
 *   backend: 'Cry',
 *   region: 'NAE',
 *   platform: 'PC',
 *   args: ['LLM']
 * });
 * // Returns: "-autoperf -mcpregion=NAE -buildidoverride=55555 -forcetest -llm -llmcsv"
 * 
 * @example
 * // Switch with NoTimeout
 * const cmd = generateCommand({
 *   buildIDOverride: '42099',
 *   backend: 'Backflip',
 *   region: 'NAE',
 *   platform: 'Switch',
 *   args: ['LLM', 'NoTimeout']
 * });
 * // Returns: "-autoperf -mcpregion=NAE -buildidoverride=42099 -epicapp=Backflip -skippatchcheck -hostwrite=C:\SwitchLogs -llm -llmcsv -nothreadtimeout"
 */
function generateCommand(config = {}) {
    // Default values
    const {
        buildIDOverride = '',
        backend = 'Cry',
        region = 'EU',
        platform = 'Other',
        args = []
    } = config;

    // Validate platform
    const validPlatforms = ['Other', 'PS4', 'PS5', 'PC', 'Switch'];
    if (!validPlatforms.includes(platform)) {
        throw new Error(`Invalid platform: ${platform}. Must be one of: ${validPlatforms.join(', ')}`);
    }

    // Validate args
    const validArgs = ['Trace', 'LLM', 'LWM_BR', 'LWM_NoBR', 'Razor', 'NoTimeout'];
    const normalizedArgs = args.map(arg => {
        // Allow both "LWM (BR)" and "LWM_BR" formats
        if (arg === 'LWM (BR)') return 'LWM_BR';
        if (arg === 'LWM (No BR)') return 'LWM_NoBR';
        return arg;
    });
    
    for (const arg of normalizedArgs) {
        if (!validArgs.includes(arg)) {
            throw new Error(`Invalid argument: ${arg}. Must be one of: ${validArgs.join(', ')}`);
        }
    }

    // Build ID display (show ❓ if empty)
    const buildIDDisplay = buildIDOverride.trim() || '❓';

    // Start building command parts
    let commandParts = [];

    // 1. Autoperf (modified by Trace)
    if (normalizedArgs.includes('Trace')) {
        commandParts.push('-autoperf=trace,csv');
    } else {
        commandParts.push('-autoperf');
    }

    // 2. Region
    commandParts.push(`-mcpregion=${region}`);

    // 3. Build ID Override
    commandParts.push(`-buildidoverride=${buildIDDisplay}`);

    // 4. Backend (epicapp) - skip for PC platform
    if (platform !== 'PC') {
        commandParts.push(`-epicapp=${backend}`);
    }

    // 5. Platform-specific flags
    if (platform === 'PC') {
        commandParts.push('-forcetest');
    } else if (platform === 'Switch') {
        commandParts.push('-skippatchcheck');
        commandParts.push('-hostwrite=C:\\SwitchLogs');
    } else {
        // Other, PS4, PS5
        commandParts.push('-skippatchcheck');
    }

    // 6. Trace-specific flags
    if (normalizedArgs.includes('Trace')) {
        commandParts.push('-csvNamedEvents');
    }

    // 7. LLM, LWM flags (mutually exclusive)
    const hasLWM_BR = normalizedArgs.includes('LWM_BR');
    const hasLWM_NoBR = normalizedArgs.includes('LWM_NoBR');
    const hasLLM = normalizedArgs.includes('LLM');

    if (hasLWM_BR || hasLWM_NoBR) {
        // LWM memory trace arguments
        commandParts.push('-trace=memalloc,memtag,module,log,region,metadata,assetmetadata');
        commandParts.push('-tracefile');
        
        // LWM (BR) includes LLM flags
        if (hasLWM_BR) {
            commandParts.push('-llm');
            commandParts.push('-llmcsv');
        }
    } else if (hasLLM) {
        // LLM only
        commandParts.push('-llm');
        commandParts.push('-llmcsv');
    }

    // 8. Razor (PS4/PS5 only)
    if (normalizedArgs.includes('Razor') && (platform === 'PS4' || platform === 'PS5')) {
        commandParts.push('-ExecCmds=fx.DetailedCSVStats 1, fx.DetailedCSVStats.MemoryMode 2');
    }

    // 9. NoTimeout (Switch only with LLM/LWM)
    if (normalizedArgs.includes('NoTimeout') && platform === 'Switch' && (hasLLM || hasLWM_BR || hasLWM_NoBR)) {
        commandParts.push('-nothreadtimeout');
    }

    return commandParts.join(' ');
}

/**
 * Validates a configuration object before generating a command
 * 
 * @param {Object} config - Configuration object (same as generateCommand)
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 * 
 * @example
 * const result = validateConfig({
 *   platform: 'Invalid',
 *   args: ['BadArg']
 * });
 * // Returns: { valid: false, errors: ['Invalid platform: Invalid', 'Invalid argument: BadArg'] }
 */
function validateConfig(config = {}) {
    const errors = [];
    const {
        platform = 'Other',
        args = []
    } = config;

    // Validate platform
    const validPlatforms = ['Other', 'PS4', 'PS5', 'PC', 'Switch'];
    if (!validPlatforms.includes(platform)) {
        errors.push(`Invalid platform: ${platform}. Must be one of: ${validPlatforms.join(', ')}`);
    }

    // Validate args
    const validArgs = ['Trace', 'LLM', 'LWM_BR', 'LWM_NoBR', 'LWM (BR)', 'LWM (No BR)', 'Razor', 'NoTimeout'];
    for (const arg of args) {
        if (!validArgs.includes(arg)) {
            errors.push(`Invalid argument: ${arg}. Must be one of: ${validArgs.join(', ')}`);
        }
    }

    // Check for mutually exclusive args
    const normalizedArgs = args.map(arg => {
        if (arg === 'LWM (BR)') return 'LWM_BR';
        if (arg === 'LWM (No BR)') return 'LWM_NoBR';
        return arg;
    });

    const hasLWM_BR = normalizedArgs.includes('LWM_BR');
    const hasLWM_NoBR = normalizedArgs.includes('LWM_NoBR');
    const hasLLM = normalizedArgs.includes('LLM');

    if ((hasLWM_BR && hasLWM_NoBR) || (hasLWM_BR && hasLLM) || (hasLWM_NoBR && hasLLM)) {
        errors.push('LLM, LWM_BR, and LWM_NoBR are mutually exclusive. Only one can be used at a time.');
    }

    // Check Razor availability
    if (normalizedArgs.includes('Razor') && platform !== 'PS4' && platform !== 'PS5') {
        errors.push('Razor argument is only available for PS4 and PS5 platforms.');
    }

    // Check NoTimeout availability
    if (normalizedArgs.includes('NoTimeout')) {
        if (platform !== 'Switch') {
            errors.push('NoTimeout argument is only available for Switch platform.');
        } else if (!hasLLM && !hasLWM_BR && !hasLWM_NoBR) {
            errors.push('NoTimeout requires LLM, LWM_BR, or LWM_NoBR to be enabled.');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Gets available arguments for a given platform
 * 
 * @param {string} platform - Platform name
 * @returns {string[]} Array of available argument names
 * 
 * @example
 * getAvailableArgs('PS5');
 * // Returns: ['Trace', 'LLM', 'LWM_BR', 'LWM_NoBR', 'Razor']
 * 
 * @example
 * getAvailableArgs('Switch');
 * // Returns: ['Trace', 'LLM', 'LWM_BR', 'LWM_NoBR', 'NoTimeout']
 */
function getAvailableArgs(platform) {
    const baseArgs = ['Trace', 'LLM', 'LWM_BR', 'LWM_NoBR'];
    
    if (platform === 'PS4' || platform === 'PS5') {
        return [...baseArgs, 'Razor'];
    } else if (platform === 'Switch') {
        return [...baseArgs, 'NoTimeout'];
    } else {
        return baseArgs;
    }
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateCommand,
        validateConfig,
        getAvailableArgs
    };
}

// Export for ES6 modules
if (typeof exports !== 'undefined') {
    exports.generateCommand = generateCommand;
    exports.validateConfig = validateConfig;
    exports.getAvailableArgs = getAvailableArgs;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.EpicCommandGenerator = {
        generateCommand,
        validateConfig,
        getAvailableArgs
    };
}
