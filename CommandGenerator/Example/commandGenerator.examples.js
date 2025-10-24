/**
 * Epic Command Generator - Usage Examples
 * 
 * Run this file with: node src/commandGenerator.examples.js
 */

const { generateCommand, validateConfig, getAvailableArgs } = require('./epic-cmd-gen-command-generator');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Epic Command Generator - Programmatic API Examples');
console.log('═══════════════════════════════════════════════════════════\n');

// Example 1: Basic CSV/FPS Profile
console.log('📌 Example 1: Basic CSV/FPS Profile (Other platform)');
console.log('───────────────────────────────────────────────────────────');
const cmd1 = generateCommand({
    buildIDOverride: '12345',
    backend: 'DevPlayTestH',
    region: 'NAE',
    platform: 'Other',
    args: []
});
console.log('Command:', cmd1);
console.log('');

// Example 2: CPU Profiling with Trace
console.log('📌 Example 2: CPU Profiling (Trace argument)');
console.log('───────────────────────────────────────────────────────────');
const cmd2 = generateCommand({
    buildIDOverride: '98765',
    backend: 'Baseball',
    region: 'EU',
    platform: 'Other',
    args: ['Trace']
});
console.log('Command:', cmd2);
console.log('');

// Example 3: PC Platform (no epicapp)
console.log('📌 Example 3: PC Platform (no -epicapp flag)');
console.log('───────────────────────────────────────────────────────────');
const cmd3 = generateCommand({
    buildIDOverride: '55555',
    backend: 'Cry',
    region: 'NAE',
    platform: 'PC',
    args: ['LLM']
});
console.log('Command:', cmd3);
console.log('');

// Example 4: PS5 with Razor
console.log('📌 Example 4: PS5 with Razor argument');
console.log('───────────────────────────────────────────────────────────');
const cmd4 = generateCommand({
    buildIDOverride: '42069',
    backend: 'DevPlayTestH',
    region: 'EU',
    platform: 'PS5',
    args: ['Razor']
});
console.log('Command:', cmd4);
console.log('');

// Example 5: Switch with LWM and NoTimeout
console.log('📌 Example 5: Switch with LWM (BR) and NoTimeout');
console.log('───────────────────────────────────────────────────────────');
const cmd5 = generateCommand({
    buildIDOverride: '42099',
    backend: 'Backflip',
    region: 'NAE',
    platform: 'Switch',
    args: ['LWM_BR', 'NoTimeout']
});
console.log('Command:', cmd5);
console.log('');

// Example 6: Empty Build ID
console.log('📌 Example 6: Empty Build ID (shows ❓)');
console.log('───────────────────────────────────────────────────────────');
const cmd6 = generateCommand({
    buildIDOverride: '',
    backend: 'Cry',
    region: 'EU',
    platform: 'Other'
});
console.log('Command:', cmd6);
console.log('');

// Example 7: Validation
console.log('📌 Example 7: Configuration Validation');
console.log('───────────────────────────────────────────────────────────');
const invalidConfig = {
    platform: 'Other',
    args: ['Razor']  // Razor only available for PS4/PS5
};
const validation = validateConfig(invalidConfig);
console.log('Config:', JSON.stringify(invalidConfig, null, 2));
console.log('Valid:', validation.valid);
if (!validation.valid) {
    console.log('Errors:');
    validation.errors.forEach(err => console.log('  -', err));
}
console.log('');

// Example 8: Get Available Args
console.log('📌 Example 8: Get Available Arguments per Platform');
console.log('───────────────────────────────────────────────────────────');
const platforms = ['Other', 'PS4', 'PS5', 'PC', 'Switch'];
platforms.forEach(platform => {
    const args = getAvailableArgs(platform);
    console.log(`${platform}:`, args.join(', '));
});
console.log('');

// Example 9: Batch Generation
console.log('📌 Example 9: Batch Command Generation');
console.log('───────────────────────────────────────────────────────────');
const batchConfigs = [
    { buildIDOverride: '111', backend: 'Cry', region: 'EU', platform: 'PS4', args: [] },
    { buildIDOverride: '222', backend: 'Baseball', region: 'NAE', platform: 'PS5', args: ['LLM'] },
    { buildIDOverride: '333', backend: 'Backflip', region: 'BR', platform: 'Switch', args: ['Trace'] }
];

batchConfigs.forEach((config, index) => {
    const command = generateCommand(config);
    console.log(`Config ${index + 1}:`);
    console.log(`  Platform: ${config.platform}, Backend: ${config.backend}, Build ID: ${config.buildIDOverride}`);
    console.log(`  Command: ${command}`);
    console.log('');
});

// Example 10: Error Handling
console.log('📌 Example 10: Error Handling');
console.log('───────────────────────────────────────────────────────────');
try {
    generateCommand({
        platform: 'Xbox',  // Invalid platform
        args: []
    });
} catch (error) {
    console.log('Caught error:', error.message);
}
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('  All examples completed successfully! ✅');
console.log('═══════════════════════════════════════════════════════════');

