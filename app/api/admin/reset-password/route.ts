/**
 * POST /api/admin/reset-password
 * Crée un token de connexion Clerk (magic link) et l'envoie par email.
 * Permet à l'admin de redonner accès à un compte sans connaître le mot de passe.
 * Body : { userId, email, firstName }
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { mailer }             from "@/lib/email";
import { NextResponse }       from "next/server";

function isAdmin(userId: string): boolean {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .includes(userId);
}

const FONT = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

function buildResetEmail(firstName: string, magicUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;${FONT}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
        <tr><td style="height:4px;background:linear-gradient(to right,#7c3aed,#4f46e5)"></td></tr>
        <tr><td style="padding:36px 40px 40px">
          <!-- Logo -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr>
              <td style="width:34px;height:34px;background:#1e1b4b;border-radius:8px;text-align:center;vertical-align:middle">
                <span style="color:#a78bfa;font-size:17px;font-weight:700;line-height:34px">P</span>
              </td>
              <td style="padding-left:10px;vertical-align:middle">
                <span style="color:#0f172a;font-size:15px;font-weight:600;${FONT}">Prospeo</span>
              </td>
            </tr>
          </table>

          <p style="${FONT};font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px">
            Accès à votre compte 🔑
          </p>
          <p style="${FONT};font-size:15px;color:#64748b;margin:0 0 24px;line-height:1.6">
            Bonjour ${firstName || ""},<br/>
            L'administrateur de Prospeo vous a envoyé un lien de connexion sécurisé.
            Cliquez sur le bouton ci-dessous pour accéder à votre compte — aucun mot de passe requis.
          </p>

          <!-- CTA principal -->
          <table cellpadding="0" cellspacing="0" style="margin:28px 0">
            <tr>
              <td style="background:#7c3aed;border-radius:10px">
                <a href="${magicUrl}"
                   style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;${FONT}">
                  Accéder à mon compte →
                </a>
              </td>
            </tr>
          </table>

          <!-- Lien texte de secours -->
          <p style="${FONT};font-size:12px;color:#94a3b8;margin:0 0 4px">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          </p>
          <p style="${FONT};font-size:11px;color:#7c3aed;word-break:break-all;margin:0 0 24px">
            ${magicUrl}
          </p>

          <div style="height:1px;background:#e2e8f0;margin:24px 0"></div>

          <p style="${FONT};font-size:12px;color:#94a3b8;margin:0;line-height:1.6">
            ⚠️ Ce lien est valable <strong>24 heures</strong> et ne peut être utilisé qu'une seule fois.<br/>
            Si vous n'avez pas demandé cet accès, ignorez simplement cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId)           return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!isAdmin(adminId))  return NextResponse.json({ error: "Accès refusé" },   { status: 403 });

  const { userId, email, firstName } = await req.json() as {
    userId:    string;
    email:     string;
    firstName?: string;
  };

  if (!userId || !email) {
    return NextResponse.json({ error: "userId et email requis" }, { status: 400 });
  }

  // Créer un token de connexion Clerk (valable 24h)
  const client = await clerkClient();
  const tokenObj = await client.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 86400, // 24h
  });

  // URL de connexion avec le token
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const magicUrl = `${appUrl}/sign-in?__clerk_ticket=${tokenObj.token}`;

  // Envoi de l'email
  await mailer.sendMail({
    from:    `"Prospeo" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject: "Accès à votre compte Prospeo",
    html:    buildResetEmail(firstName || "", magicUrl),
  });

  console.log(`[ADMIN] Reset password envoyé à ${email} (userId: ${userId})`);

  return NextResponse.json({ success: true });
}
