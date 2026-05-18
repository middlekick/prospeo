import nodemailer from "nodemailer";

const GMAIL_USER     = process.env.GMAIL_USER         || "";
const GMAIL_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const MON_PRENOM     = process.env.CONTACT_PRENOM     || "Téo";
const MON_NOM        = process.env.CONTACT_NOM        || "Mikulic";
const MON_TEL        = process.env.CONTACT_TEL        || "";

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
});

// Convertit "06 18 14 62 83" → "+33618146283" pour les liens tel: et sms:
function toIntlPhone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("33")) return `+${digits}`;
  if (digits.startsWith("0"))  return `+33${digits.slice(1)}`;
  return `+33${digits}`;
}

// ── Éléments partagés ────────────────────────────────────────────────────────

const FONT = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

// Logo P en haut de chaque mail
function logo(): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:36px;height:36px;background:#1e1b4b;border-radius:8px;text-align:center;vertical-align:middle">
              <span style="color:#a78bfa;font-size:18px;font-weight:700;line-height:36px">P</span>
            </td>
            <td style="padding-left:10px;vertical-align:middle">
              <span style="color:#0f172a;font-size:15px;font-weight:600;${FONT}">Prospo</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// Boutons CTA email + SMS/appel
function ctaButtons(): string {
  const intlTel  = MON_TEL ? toIntlPhone(MON_TEL) : "";
  const telLabel = MON_TEL || "Appeler";

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px">
    <tr>
      <td>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <!-- Bouton email -->
            <td style="padding-right:10px">
              <a href="mailto:${GMAIL_USER}"
                 style="display:inline-block;padding:12px 22px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;${FONT}">
                ✉ Répondre par mail
              </a>
            </td>
            ${intlTel ? `
            <!-- Bouton SMS/appel -->
            <td>
              <a href="sms:${intlTel}"
                 style="display:inline-block;padding:12px 22px;background:#0f172a;color:#a78bfa;border:1px solid #312e81;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;${FONT}">
                💬 ${telLabel}
              </a>
            </td>` : ""}
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// Séparateur violet
function divider(): string {
  return `<div style="height:1px;background:linear-gradient(to right,#7c3aed22,#7c3aed55,#7c3aed22);margin:24px 0"></div>`;
}

// Footer signature
function footer(): string {
  const intlTel = MON_TEL ? toIntlPhone(MON_TEL) : "";
  return `
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0">
    <p style="${FONT};font-size:13px;color:#64748b;margin:0;line-height:1.6">
      <strong style="color:#0f172a">${MON_PRENOM} ${MON_NOM}</strong><br/>
      Acquisition client pour artisans
      ${MON_TEL ? `<br/><a href="tel:${intlTel}" style="color:#7c3aed;text-decoration:none">${MON_TEL}</a>` : ""}
      ${GMAIL_USER ? `&nbsp;·&nbsp;<a href="mailto:${GMAIL_USER}" style="color:#7c3aed;text-decoration:none">${GMAIL_USER}</a>` : ""}
    </p>
  </div>`;
}

// Wrapper HTML commun
function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Message de ${MON_PRENOM}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;${FONT}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;
                      box-shadow:0 4px 24px rgba(0,0,0,.06);overflow:hidden">
          <!-- Barre violet en haut -->
          <tr>
            <td style="height:4px;background:linear-gradient(to right,#7c3aed,#4f46e5)"></td>
          </tr>
          <!-- Corps -->
          <tr>
            <td style="padding:36px 40px 40px">
              ${content}
            </td>
          </tr>
        </table>
        <!-- Pied de page global -->
        <table width="560" cellpadding="0" cellspacing="0" style="margin-top:16px">
          <tr>
            <td style="${FONT};font-size:11px;color:#94a3b8;text-align:center;padding:8px 0">
              Pour ne plus recevoir ces messages, répondez "STOP".
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Template : offre semaine gratuite ────────────────────────────────────────

interface EmailParams {
  prenom: string;
  nomEntreprise: string;
  urlSite: string;
  screenshotUrl?: string;
}

export function buildEmailHTML({ prenom, nomEntreprise, urlSite, screenshotUrl }: EmailParams): string {
  const screenshot = screenshotUrl ||
    `https://s0.wordpress.com/mshots/v1/${encodeURIComponent(urlSite)}?w=600`;

  const body = `
    ${logo()}

    <p style="${FONT};font-size:22px;font-weight:700;color:#0f172a;margin:0 0 6px">
      Bonjour ${prenom} 👋
    </p>
    <p style="${FONT};font-size:14px;color:#7c3aed;font-weight:500;margin:0 0 24px;letter-spacing:.3px;text-transform:uppercase">
      ${nomEntreprise}
    </p>

    <p style="${FONT};font-size:15px;color:#334155;line-height:1.75;margin:0 0 14px">
      Je me permets de vous contacter car j'ai analysé votre présence en ligne
      et j'ai identifié plusieurs opportunités qui pourraient vous ramener plus de clients rapidement.
    </p>

    <!-- Aperçu du site -->
    <div style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:20px 0">
      <img src="${screenshot}" alt="Aperçu de ${nomEntreprise}"
           width="100%" style="display:block;max-width:100%"/>
    </div>

    ${divider()}

    <!-- Proposition de valeur -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:20px 24px;background:#faf5ff;border-radius:10px;border:1px solid #e9d5ff">
          <p style="${FONT};font-size:13px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px">
            Ma proposition
          </p>
          <p style="${FONT};font-size:15px;color:#1e1b4b;font-weight:600;margin:0 0 6px">
            1 semaine d'acquisition sans frais d'agence
          </p>
          <p style="${FONT};font-size:14px;color:#475569;line-height:1.6;margin:0">
            Vous payez uniquement le budget publicitaire (~100 €) directement à la régie publicitaire.
            Je ne me facture rien sur la semaine test — je vous prouve les résultats d'abord.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButtons()}
    ${footer()}
  `;

  return wrapEmail(body);
}

// ── Template : confirmation RDV ──────────────────────────────────────────────

export function buildRdvConfirmationEmail({
  nomSociete, rdvDate, rdvHeure,
}: { nomSociete: string; rdvDate: string; rdvHeure: string }): string {
  const dateFormatted = new Date(rdvDate + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const body = `
    ${logo()}

    <p style="${FONT};font-size:22px;font-weight:700;color:#0f172a;margin:0 0 6px">
      C'est confirmé ✅
    </p>
    <p style="${FONT};font-size:14px;color:#7c3aed;font-weight:500;margin:0 0 24px;letter-spacing:.3px;text-transform:uppercase">
      ${nomSociete}
    </p>

    <p style="${FONT};font-size:15px;color:#334155;line-height:1.75;margin:0 0 20px">
      Bonjour, je vous confirme notre échange téléphonique :
    </p>

    <!-- Bloc date/heure -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:24px 28px;background:#0f172a;border-radius:12px;border-left:4px solid #7c3aed">
          <p style="${FONT};font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px">
            Échange téléphonique
          </p>
          <p style="${FONT};font-size:20px;font-weight:700;color:#f1f5f9;margin:0;line-height:1.3;text-transform:capitalize">
            ${dateFormatted}
          </p>
          ${rdvHeure ? `
          <p style="${FONT};font-size:16px;color:#a78bfa;font-weight:600;margin:6px 0 0">
            à ${rdvHeure}
          </p>` : ""}
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="${FONT};font-size:15px;color:#334155;line-height:1.75;margin:0">
      Je vous appellerai à l'heure prévue. Si vous avez des questions d'ici là,
      n'hésitez pas à me contacter directement :
    </p>

    ${ctaButtons()}
    ${footer()}
  `;

  return wrapEmail(body);
}

// ── Template : rappel J-1 ────────────────────────────────────────────────────

export function buildRdvReminderEmail({
  nomSociete, rdvHeure,
}: { nomSociete: string; rdvHeure: string }): string {
  const body = `
    ${logo()}

    <p style="${FONT};font-size:22px;font-weight:700;color:#0f172a;margin:0 0 6px">
      On se parle demain 👋
    </p>
    <p style="${FONT};font-size:14px;color:#7c3aed;font-weight:500;margin:0 0 24px;letter-spacing:.3px;text-transform:uppercase">
      ${nomSociete}
    </p>

    <p style="${FONT};font-size:15px;color:#334155;line-height:1.75;margin:0 0 20px">
      Juste un petit rappel — notre échange téléphonique est prévu <strong>demain</strong>.
    </p>

    ${rdvHeure ? `
    <!-- Bloc heure -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:20px 28px;background:#0f172a;border-radius:12px;border-left:4px solid #7c3aed">
          <p style="${FONT};font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px">
            Heure de l'appel
          </p>
          <p style="${FONT};font-size:24px;font-weight:700;color:#f1f5f9;margin:0">
            ${rdvHeure}
          </p>
        </td>
      </tr>
    </table>` : ""}

    ${divider()}

    <p style="${FONT};font-size:15px;color:#334155;line-height:1.75;margin:0">
      Je vous appellerai à l'heure convenue. Si votre emploi du temps a changé,
      contactez-moi dès maintenant :
    </p>

    ${ctaButtons()}
    ${footer()}
  `;

  return wrapEmail(body);
}
