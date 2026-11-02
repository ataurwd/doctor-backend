const app = require('../server');

if (!app || typeof app !== 'function') {
  console.error('[FAIL] Express app failed to initialize or export properly');
  process.exit(1);
}

console.log('[PASS] Express backend initialized and exported correctly');
process.exit(0);
