/**
 * fix-encoding.js
 * Corrige le mojibake UTF-8/cp1252 dans les fichiers TSX.
 *
 * Problème : UTF-8 bytes ont été lus comme cp1252, puis re-stockés en UTF-8.
 * Solution : re-convertir chaque char via son codepoint → byte original → re-décoder en UTF-8.
 */

const fs   = require('fs');
const path = require('path');

// cp1252 byte (0x80-0x9F) -> Unicode codepoint
const CP1252_EXTRA = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178
};

// Reverse: Unicode codepoint -> cp1252 byte
const UNICODE_TO_CP1252 = {};
for (const [byte, cp] of Object.entries(CP1252_EXTRA)) {
  UNICODE_TO_CP1252[cp] = parseInt(byte);
}

function fixMojibake(str) {
  const bytes = [];
  for (const char of str) {
    const cp = char.codePointAt(0);
    if (cp < 128) {
      bytes.push(cp);
    } else if (UNICODE_TO_CP1252[cp] !== undefined) {
      bytes.push(UNICODE_TO_CP1252[cp]);
    } else if (cp < 256) {
      bytes.push(cp);
    } else {
      // Properly-encoded multi-byte char: encode as UTF-8 and keep
      const utf8 = Buffer.from(char, 'utf8');
      for (const b of utf8) bytes.push(b);
    }
  }
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch (e) {
    return str;
  }
}

// Test cases — real mojibake sequences from the files
// Em dash: â€” (U+00E2 + U+20AC + U+201D) should become — (U+2014)
// a-grave: Ã  (U+00C3 + U+00A0 NBSP) should become à (U+00E0)
const tests = [
  ['Ã©', 'é'],
  ['â€”', '—'],  // em dash
  ['Â§', '§'],
  ['FonctionnalitÃ©s', 'Fonctionnalités'],
  ['rÃ©siliable Ã tout moment', 'résiliable à tout moment'],
  ['hello world', 'hello world'],
];

let allPassed = true;
for (const [input, expected] of tests) {
  const result = fixMojibake(input);
  const pass = result === expected;
  if (!pass) {
    console.error('FAIL:', JSON.stringify(input), '=>', JSON.stringify(result), '(expected', JSON.stringify(expected), ')');
    allPassed = false;
  }
}

if (!allPassed) {
  process.exit(1);
}
console.log('All tests passed.');

// Files to fix
const FILES = [
  'app/page.tsx',
  'app/app/page.tsx',
  'app/app/dashboard/page.tsx',
  'app/app/inpi/page.tsx',
  'app/app/scripts/page.tsx',
  'app/app/auto-scrape/page.tsx',
  'app/app/admin/page.tsx',
  'components/leads/LeadDrawer.tsx',
  'components/leads/LeadsTable.tsx',
  'components/leads/CallSession.tsx',
  'components/leads/ScrapeForm.tsx',
  'components/leads/KanbanView.tsx',
  'components/leads/FilterPills.tsx',
  'components/leads/StatsBar.tsx',
  'components/leads/ImportCSV.tsx',
  'components/leads/EnrichButton.tsx',
  'components/ui/OnboardingModal.tsx',
  'components/ui/UpgradeGate.tsx',
  'components/ui/ContactModal.tsx',
  'components/ui/TrialCodeModal.tsx',
  'components/ui/ConfirmModal.tsx',
  'components/ui/CommandPalette.tsx',
  'components/layout/Sidebar.tsx',
  'components/landing/AnimatedDemo.tsx',
  'lib/plan.ts',
  'lib/email.ts',
];

const ROOT = path.join(__dirname, '..');

for (const relPath of FILES) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found):', relPath);
    continue;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  const fixed    = fixMojibake(original);
  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    // Count diff
    let diffCount = 0;
    for (let i = 0; i < Math.min(original.length, fixed.length); i++) {
      if (original[i] !== fixed[i]) diffCount++;
    }
    console.log('FIXED:', relPath, '(' + diffCount + ' chars changed)');
  } else {
    console.log('OK (no change):', relPath);
  }
}

console.log('\nDone.');
