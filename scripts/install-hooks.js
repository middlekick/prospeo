/**
 * scripts/install-hooks.js
 * Installe le hook git pre-commit (garde anti-mojibake) sans dépendance
 * externe ni modification de la config git. Lancé via `npm run prepare`
 * (donc automatiquement après `npm install`).
 */

const fs = require("fs");
const path = require("path");

const hookDir = path.join(__dirname, "..", ".git", "hooks");
if (!fs.existsSync(hookDir)) {
  // Pas un clone git (ex: déploiement Vercel) → rien à faire, on sort proprement.
  process.exit(0);
}

const hookPath = path.join(hookDir, "pre-commit");
const script = `#!/bin/sh
# Garde anti-mojibake — généré par scripts/install-hooks.js
node scripts/check-encoding.js || {
  echo "Commit bloqué : encodage invalide (voir ci-dessus)."
  exit 1
}
`;

fs.writeFileSync(hookPath, script, { mode: 0o755 });
console.log("✓ Hook pre-commit anti-mojibake installé");
