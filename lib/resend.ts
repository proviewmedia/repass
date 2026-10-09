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

// The Resend SDK does NOT throw on API errors: send() resolves to
// { data, error } and leaves it to the caller to check (see
// node_modules/resend/dist/index.d.mts, `type Response<T>`). Awaiting it
// without inspecting the result swallows every failure there is — invalid
// API key, unverified sending domain, a sandboxed from-address, rate limits.
// Callers then report success to the user and no email exists. Converting
// the error into a throw is what makes those failures visible to the
// try/catch and logging the callers already have.
async function send(payload: { to: string; subject: string; html: string }) {
  const { error } = await getResend().emails.send({ from: FROM_EMAIL, ...payload });
  if (error) {
    throw new Error(`Resend rejected the email: ${error.name}: ${error.message}`);
  }
}

export async function sendBusinessWelcomeEmail(to: string, businessName: string, dashboardUrl: string) {
  await send({
    to,
    subject: "Welcome to Repass",
    html: `<p>Your Repass subscription for <strong>${businessName}</strong> is active.</p><p>Head to your dashboard to share your join link and start signing up customers:</p><p><a href="${dashboardUrl}">${dashboardUrl}</a></p>`,
  });
}

export async function sendWalletLinkEmail(to: string, businessName: string, shareUrl: string) {
  await send({
    to,
    subject: `Your ${businessName} loyalty card`,
    html: `<p>Here's your loyalty card for ${businessName}. Open this link on your phone to add it to Apple or Google Wallet:</p><p><a href="${shareUrl}">${shareUrl}</a></p>`,
  });
}
