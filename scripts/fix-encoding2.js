/**
 * fix-encoding2.js — Smart mojibake fix
 *
 * Strategy:
 * 1. Each character's codepoint is used as its original "byte" value
 * 2. Multi-byte clean Unicode chars (cp >= 256) are kept as-is
 * 3. The accumulated byte sequence is decoded as lenient UTF-8
 *    (invalid sequences → keep as Latin-1 chars, NOT U+FFFD)
 *
 * This correctly:
 * - Fixes mojibake like Ã© → é (double-encoded UTF-8)
 * - Keeps clean UTF-8 like é intact (it's a "standalone invalid" 0xE9 byte, returned as-is)
 */

const fs   = require("fs");
const path = require("path");

// cp1252 byte (0x80-0x9F) -> Unicode codepoint
const CP1252_EXTRA = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178
};

const UNICODE_TO_CP1252 = {};
for (const [byte, cp] of Object.entries(CP1252_EXTRA)) {
  UNICODE_TO_CP1252[cp] = parseInt(byte);
}

/**
 * Decode a byte Buffer as UTF-8, but for invalid/incomplete sequences
 * fall back to Latin-1 codepoint (not U+FFFD).
 */
function decodeBytes(buf) {
  const parts = [];
  let i = 0;
  while (i < buf.length) {
    const b = buf[i];
    if (b < 0x80) {
      parts.push(String.fromCharCode(b));
      i++;
    } else if ((b & 0xE0) === 0xC0 && i+1 < buf.length && (buf[i+1] & 0xC0) === 0x80) {
      parts.push(String.fromCodePoint(((b & 0x1F) << 6) | (buf[i+1] & 0x3F)));
      i += 2;
    } else if ((b & 0xF0) === 0xE0 && i+2 < buf.length && (buf[i+1] & 0xC0) === 0x80 && (buf[i+2] & 0xC0) === 0x80) {
      parts.push(String.fromCodePoint(((b & 0x0F) << 12) | ((buf[i+1] & 0x3F) << 6) | (buf[i+2] & 0x3F)));
      i += 3;
    } else if ((b & 0xF8) === 0xF0 && i+3 < buf.length && (buf[i+1] & 0xC0) === 0x80 && (buf[i+2] & 0xC0) === 0x80 && (buf[i+3] & 0xC0) === 0x80) {
      parts.push(String.fromCodePoint(((b & 0x07) << 18) | ((buf[i+1] & 0x3F) << 12) | ((buf[i+2] & 0x3F) << 6) | (buf[i+3] & 0x3F)));
      i += 4;
    } else {
      // Invalid: keep as Latin-1 char
      parts.push(String.fromCodePoint(b));
      i++;
    }
  }
  return parts.join("");
}

function fixMojibake(str) {
  const result = [];
  let accumulated = [];

  for (const char of str) {
    const cp = char.codePointAt(0);
    if (UNICODE_TO_CP1252[cp] !== undefined) {
      // cp1252 special char (€, curly quotes, em dash…) — treat as its byte value
      accumulated.push(UNICODE_TO_CP1252[cp]);
    } else if (cp >= 256) {
      // Truly multi-byte char (not in cp1252): flush accumulated, keep as-is
      if (accumulated.length > 0) {
        result.push(decodeBytes(Buffer.from(accumulated)));
        accumulated = [];
      }
      result.push(char);
    } else {
      // ASCII or Latin-1: accumulate
      accumulated.push(cp);
    }
  }

  if (accumulated.length > 0) {
    result.push(decodeBytes(Buffer.from(accumulated)));
  }
  return result.join("");
}

// ── Tests ────────────────────────────────────────────────────────────────────
const TESTS = [
  // Old mojibake (must be fixed)
  ["Ã©",                         "é"],
  ["Â§",                         "§"],
  ["FonctionnalitÃ©s",           "Fonctionnalités"],
  // em dash mojibake: â (0xE2) + € (cp1252 0x80) + " right-quote (cp1252 0x94) -> — (U+2014)
  ["â€”",          "—"],
  // right arrow mojibake: â (0xE2) +  (cp1252 0x96->endash? no...) let me check
  // Actually arrow is: 0xE2, 0x86, 0x92 in UTF-8 → â (0xE2) + † (cp1252 0x86=†) + ' (cp1252 0x92=')
  ["â†’",          "→"],  // right arrow →
  // Clean strings (must be kept as-is)
  ["é",                           "é"],
  ["à",                           "à"],
  ["Fonctionnalités",             "Fonctionnalités"],
  ["CRM de prospection pour commerciaux indépendants", "CRM de prospection pour commerciaux indépendants"],
  ["hello world",                  "hello world"],
];

let allPassed = true;
for (const [input, expected] of TESTS) {
  const result = fixMojibake(input);
  if (result !== expected) {
    const iShort = JSON.stringify(input.slice(0, 30));
    const rShort = JSON.stringify(result.slice(0, 30));
    const eShort = JSON.stringify(expected.slice(0, 30));
    console.error("FAIL:", iShort, "=>", rShort, "(expected", eShort + ")");
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("Tests failed — aborting file fixes.");
  process.exit(1);
}
console.log("All tests passed.");

// ── Files ────────────────────────────────────────────────────────────────────
const FILES = [
  "app/page.tsx",
  "app/app/page.tsx",
  "app/app/dashboard/page.tsx",
  "app/app/inpi/page.tsx",
  "app/app/scripts/page.tsx",
  "app/app/auto-scrape/page.tsx",
  "app/app/admin/page.tsx",
  "components/leads/LeadDrawer.tsx",
  "components/leads/LeadsTable.tsx",
  "components/leads/CallSession.tsx",
  "components/leads/ScrapeForm.tsx",
  "components/leads/KanbanView.tsx",
  "components/leads/FilterPills.tsx",
  "components/leads/StatsBar.tsx",
  "components/leads/ImportCSV.tsx",
  "components/leads/EnrichButton.tsx",
  "components/ui/OnboardingModal.tsx",
  "components/ui/UpgradeGate.tsx",
  "components/ui/ContactModal.tsx",
  "components/ui/TrialCodeModal.tsx",
  "components/ui/ConfirmModal.tsx",
  "components/ui/CommandPalette.tsx",
  "components/layout/Sidebar.tsx",
  "components/landing/AnimatedDemo.tsx",
  "lib/plan.ts",
  "lib/email.ts",
];

const ROOT = path.resolve(__dirname, "..");

for (const relPath of FILES) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) { console.log("SKIP:", relPath); continue; }
  const original = fs.readFileSync(filePath, "utf8");
  const fixed    = fixMojibake(original);
  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, "utf8");
    console.log("FIXED:", relPath);
  } else {
    console.log("OK:", relPath);
  }
}
console.log("\nDone!");
