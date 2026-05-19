/**
 * scripts/check-encoding.js
 * Garde anti-mojibake : refuse tout octet de contrôle cp1252 (U+0080-U+009F)
 * ou BOM (U+FEFF) en tête de fichier dans les sources.
 * Ces caractères = « carrés blancs » à l'écran (€ — … ' mal encodés).
 *
 * Usage : node scripts/check-encoding.js   (exit 1 si problème)
 * Lancé automatiquement en pre-commit (cf. scripts/install-hooks.js).
 */

const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components", "lib", "hooks"];
const EXT = /\.(tsx?|css|js|json)$/;
const SKIP = new Set(["node_modules", ".next", ".git"]);

const problems = [];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { scan(f); continue; }
    if (!EXT.test(e.name)) continue;
    const c = fs.readFileSync(f, "utf8");
    const ctrl = [];
    for (let i = 0; i < c.length; i++) {
      const n = c.charCodeAt(i);
      if (n >= 0x80 && n <= 0x9f) ctrl.push(n);
    }
    const bom = c.charCodeAt(0) === 0xfeff;
    if (ctrl.length || bom) {
      problems.push({ f, ctrl: ctrl.length, bom });
    }
  }
}

ROOTS.forEach(scan);

if (problems.length) {
  console.error("\n\x1b[31m✗ Encodage invalide détecté (mojibake cp1252 / BOM) :\x1b[0m");
  for (const p of problems) {
    console.error(`  ${p.f}` +
      (p.ctrl ? `  — ${p.ctrl} car. 0x80-0x9F` : "") +
      (p.bom ? "  — BOM en tête" : ""));
  }
  console.error(
    "\nCes octets s'affichent en carrés blancs. " +
    "Réenregistrez le fichier en UTF-8 (sans BOM) ou lancez le script de réparation.\n"
  );
  process.exit(1);
}

console.log("✓ Encodage OK (aucun mojibake cp1252 / BOM)");
