import nodemailer from "nodemailer";

/*
  Email sending for K18.

  DEV/TEST MODE (default): if no SMTP_* vars are set in .env, we create a
  throwaway Ethereal account on first send. Nothing goes to a real inbox —
  instead the backend console logs a preview URL where you can view the
  rendered email in a browser.

  PRODUCTION: set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS (and optionally
  SMTP_SECURE=true, EMAIL_FROM) in k18-backend/.env. When those are present we
  use them instead of Ethereal — no code change required.
*/

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

function usingRealSmtp(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (usingRealSmtp()) {
      console.log("[mailer] Using real SMTP transport:", process.env.SMTP_HOST);
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }

    // Dev/test: Ethereal throwaway account (no real delivery).
    const testAccount = await nodemailer.createTestAccount();
    console.log("[mailer] DEV MODE — Ethereal test inbox:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

export interface MailInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/** Sends an email. In dev mode, logs an Ethereal preview URL to the console. */
export async function sendMail(mail: MailInput) {
  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || "K18 Store <no-reply@k18.test>";
  const info = await transporter.sendMail({ from, ...mail });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`[mailer] "${mail.subject}" → ${mail.to}\n[mailer] Preview: ${preview}`);
  } else {
    console.log(`[mailer] "${mail.subject}" → ${mail.to} (id ${info.messageId})`);
  }
  return { info, previewUrl: preview || null };
}
