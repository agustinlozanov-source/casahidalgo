#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);

if (missing.length) {
  console.error('\n❌ ERROR: Variables de entorno faltantes:');
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\nConfigúralas en Netlify → Site settings → Environment variables\n');
  process.exit(1);
}

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
};

const content = `// AUTO-GENERATED en build time. NO EDITAR.
window.__APP_CONFIG__ = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'config.js'), content);
console.log('✓ public/config.js generado');
console.log(`  SUPABASE_URL: ${config.SUPABASE_URL}`);
