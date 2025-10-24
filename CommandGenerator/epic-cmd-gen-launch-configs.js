/**
 * Epic Command Generator - Launch Configuration Templates
 * Handles platform-specific launch file generation (PS4/PS5)
 */

class EpicCmdGenLaunchConfigs {
    /**
     * Generate PlayStation launch JSON configuration
     * @param {string} platform - 'PS4' or 'PS5'
     * @param {Object} params - Configuration parameters
     * @param {string} params.buildId - Build ID override
     * @param {string} params.region - MCP region
     * @param {string} params.backend - Backend/epicapp value
     * @param {Array<string>} params.args - Command line arguments array
     * @returns {string} JSON string for launch file
     */
    static generatePSLaunchJSON(platform, params) {
        const { buildId, region, backend, args } = params;

        // PS5 Configuration Template
        const ps5Config = {
            "launchOptions": {
                "app": "PPSA01922",
                "args": args,
                "executableOverlay": "",
                "systemLibraryVerification": null,
                "flexibleMemory": 0,
                "extendedDirectMemory": "PLACEHOLDER_FOR_EXTENDED_MEMORY",
                "noDebug": false
            }
        };

        // PS4 Configuration Template
        const ps4Config = {
            "launchOptions": {
                "app": "CUSA07022",
                "args": args,
                "device": "raw"
            }
        };

        // Return appropriate configuration based on platform
        if (platform === "PS5") {
            // Use string replacement to preserve exact numeric value
            // (JavaScript loses precision with this large number)
            let jsonString = JSON.stringify(ps5Config, null, 4);
            jsonString = jsonString.replace(
                '"PLACEHOLDER_FOR_EXTENDED_MEMORY"',
                '18446744073709551615'
            );
            return jsonString;
        }

        if (platform === "PS4") {
            return JSON.stringify(ps4Config, null, 4);
        }

        throw new Error(`Unknown platform: ${platform}`);
    }

    /**
     * Build command line arguments array from configuration
     * @param {Object} config - Configuration object
     * @param {string} config.autoperfArg - Autoperf argument value
     * @param {string} config.region - MCP region
     * @param {string} config.buildId - Build ID override
     * @param {string} config.backend - Backend/epicapp value
     * @param {string} config.otherArgs - Other arguments as space-separated string
     * @returns {Array<string>} Array of command line arguments
     */
    static buildArgsArray(config) {
        const { autoperfArg, region, buildId, backend, otherArgs } = config;

        const args = [autoperfArg];
        args.push(`-mcpregion=${region}`);
        args.push(`-buildidoverride=${buildId}`);
        args.push(`-epicapp=${backend}`);

        // Add other arguments as separate array items
        if (otherArgs) {
            const argsArray = otherArgs.split(' ').filter(f => f.trim());
            args.push(...argsArray);
        }

        return args;
    }

    /**
     * Get platform-specific file extension
     * @param {string} platform - Platform name
     * @returns {string} File extension including the dot
     */
    static getFileExtension(platform) {
        const extensions = {
            'PS4': '.ps4launch',
            'PS5': '.ps5launch'
        };
        return extensions[platform] || '.launch';
    }

    /**
     * Get platform-specific app ID
     * @param {string} platform - Platform name
     * @returns {string} App ID for the platform
     */
    static getAppId(platform) {
        const appIds = {
            'PS4': 'CUSA07022',
            'PS5': 'PPSA01922'
        };
        return appIds[platform] || null;
    }

    /**
     * Get list of supported platforms for launch file generation
     * @returns {Array<string>} Array of supported platform names
     */
    static getSupportedPlatforms() {
        return ['PS4', 'PS5'];
    }

    /**
     * Check if a platform supports launch file generation
     * @param {string} platform - Platform name to check
     * @returns {boolean} True if platform supports launch files
     */
    static isPlatformSupported(platform) {
        return this.getSupportedPlatforms().includes(platform);
    }
}

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EpicCmdGenLaunchConfigs;
} else {
    window.EpicCmdGenLaunchConfigs = EpicCmdGenLaunchConfigs;
}

