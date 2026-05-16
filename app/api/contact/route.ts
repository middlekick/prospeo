/**
 * POST /api/contact
 * Reçoit un message depuis le formulaire de contact de la landing page
 * et l'envoie par email à GMAIL_USER (Téo).
 * Route publique — pas d'auth requise.
 */

import { NextRequest, NextResponse } from "next/server";
import { mailer }                     from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!process.env.GMAIL_USER) {
    return NextResponse.json({ error: "Gmail non configuré" }, { status: 500 });
  }

  const { nom, email, sujet, message } = await req.json() as {
    nom?:     string;
    email?:   string;
    sujet?:   string;
    message?: string;
  };

  if (!nom?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  // Validation email basique (protection SMTP header injection)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  }

  try {
    await mailer.sendMail({
      from:    `"Prospeo Contact" <${process.env.GMAIL_USER}>`,
      to:      process.env.GMAIL_USER,
      replyTo: `"${nom}" <${email}>`,
      subject: `[Prospeo] ${sujet?.trim() || "Nouveau message de " + nom}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#7c3aed,#6366f1);padding:24px 28px">
            <p style="margin:0;font-size:18px;font-weight:700;color:#fff">Nouveau message — Prospeo</p>
          </div>
          <div style="padding:28px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:80px">Nom</td>
                  <td style="padding:8px 0;font-size:14px;font-weight:600">${nom}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Email</td>
                  <td style="padding:8px 0;font-size:14px"><a href="mailto:${email}" style="color:#a78bfa">${email}</a></td></tr>
              ${sujet ? `<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Sujet</td>
                  <td style="padding:8px 0;font-size:14px">${sujet}</td></tr>` : ""}
            </table>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0"/>
            <p style="margin:0 0 8px;color:#94a3b8;font-size:13px">Message</p>
            <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <div style="padding:16px 28px;background:rgba(255,255,255,0.03);font-size:12px;color:#475569">
            Réponds directement à cet email pour contacter ${nom}.
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[CONTACT]", (e as Error).message);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}
