// Normalise un numéro de téléphone français vers le format WhatsApp (33XXXXXXXXX)
export function toWhatsAppUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  // 06/07 → 336/337
  if (digits.startsWith("0")) digits = "33" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

/**
 * Clé téléphone canonique pour la déduplication fuzzy.
 * Ramène tous les formats au même 10 chiffres : "+33 6 12-34-56-78",
 * "0033612345678", "06.12.34.56.78" → "0612345678".
 * Retourne "" si le numéro est trop court pour être fiable (< 9 chiffres).
 */
export function normalizePhoneKey(phone: string): string {
  let d = (phone || "").replace(/\D/g, "");
  if (!d) return "";
  // Préfixes internationaux France : 0033… ou 33… → 0…
  if (d.startsWith("0033")) d = "0" + d.slice(4);
  else if (d.startsWith("33") && d.length >= 11) d = "0" + d.slice(2);
  // Numéro national sans le 0 initial (9 chiffres) → ajout du 0
  if (d.length === 9) d = "0" + d;
  return d.length >= 9 ? d : "";
}

/**
 * Clé nom canonique pour la déduplication fuzzy.
 * Minuscule, accents retirés, formes juridiques et ponctuation supprimées,
 * tokens triés : "Plomberie Dupont SARL" et "dupont  plomberie (s.a.r.l)"
 * produisent la même clé.
 */
export function normalizeNameKey(name: string): string {
  const LEGAL = new Set([
    "sarl", "sas", "sasu", "eurl", "sa", "ei", "eirl", "sci", "scp", "snc",
    "auto", "entrepreneur", "autoentrepreneur", "micro", "entreprise",
    "ets", "etablissements", "ste", "societe", "co", "company", "cie",
  ]);
  const tokens = (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // accents (diacritiques combinants)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")      // ponctuation → espace
    .split(/\s+/)
    .filter(t => t.length > 1 && !LEGAL.has(t));
  return tokens.sort().join(" ");
}
