import { Resend } from "resend";

let cached: Resend | null = null;

// Lazily constructed so importing this module doesn't require
// RESEND_API_KEY at build time — only when an email actually sends.
function getResend(): Resend {
  if (!cached) {
    cached = new Resend(process.env.RESEND_API_KEY!);
  }
  return cached;
}

// resend.dev's shared sending address works without domain verification but
// is sandboxed to the account owner's own inbox — set RESEND_FROM_EMAIL to a
// verified domain address before relying on this for real customers.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Repass <onboarding@resend.dev>";

export async function sendBusinessWelcomeEmail(to: string, businessName: string, dashboardUrl: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to Repass",
    html: `<p>Your Repass subscription for <strong>${businessName}</strong> is active.</p><p>Head to your dashboard to share your join link and start signing up customers:</p><p><a href="${dashboardUrl}">${dashboardUrl}</a></p>`,
  });
}

export async function sendWalletLinkEmail(to: string, businessName: string, shareUrl: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ${businessName} loyalty card`,
    html: `<p>Here's your loyalty card for ${businessName} — open this link on your phone to add it to Apple or Google Wallet:</p><p><a href="${shareUrl}">${shareUrl}</a></p>`,
  });
}
