// Normalise un numéro de téléphone français vers le format WhatsApp (33XXXXXXXXX)
export function toWhatsAppUrl(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  // 06/07 → 336/337
  if (digits.startsWith("0")) digits = "33" + digits.slice(1);
  return `https://wa.me/${digits}`;
}
