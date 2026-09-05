// Client for the WalletWallet API (https://api.walletwallet.dev) — issues and
// updates Apple/Google Wallet passes. See docs/walletwallet.md for the full
// captured API reference this is built against.

const BASE_URL = "https://api.walletwallet.dev";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WALLETWALLET_API_KEY}`,
  };
}

export interface PassBusinessInput {
  name: string;
  programName?: string | null;
  colorPreset?: string | null;
  logoUrl?: string | null;
}

export interface PassCustomerInput {
  id: string;
  pointsBalance: number;
  /**
   * The current value of the seeded "Notifications" backFields anchor.
   * Must be resent unchanged (' ' if no custom banner has been sent yet) to
   * avoid re-firing an old message — only bump it when intentionally pushing
   * a new lock-screen banner. See the "seed-then-bump" pattern in the docs.
   */
  notification: string;
}

// Single source of truth for pass field shape/order. WalletWallet identifies
// backFields by array position, so this order must never change once passes
// have been issued — see docs/walletwallet.md.
export function buildPassBody(business: PassBusinessInput, customer: PassCustomerInput) {
  const body: Record<string, unknown> = {
    barcodeValue: customer.id,
    barcodeFormat: "QR",
    logoText: business.name,
    organizationName: business.name,
    colorPreset: business.colorPreset || "dark",
    primaryFields: [{ value: business.programName || business.name }],
    secondaryFields: [
      {
        label: "POINTS",
        value: String(customer.pointsBalance),
        changeMessage: "You now have %@ points",
      },
    ],
    backFields: [{ label: "Notifications", value: customer.notification, changeMessage: "%@" }],
  };

  if (business.logoUrl) {
    body.logoURL = business.logoUrl;
  }

  return body;
}

async function parseErrorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  return (data && typeof data.error === "string" && data.error) || res.statusText;
}

export interface CreatePassResult {
  serialNumber: string;
  shareUrl: string;
  googleSaveUrl: string;
}

export async function createPass(
  business: PassBusinessInput,
  customer: PassCustomerInput,
): Promise<CreatePassResult> {
  const res = await fetch(`${BASE_URL}/api/passes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(buildPassBody(business, customer)),
  });

  if (!res.ok) {
    throw new Error(`WalletWallet create pass failed: ${await parseErrorMessage(res)}`);
  }

  const data = await res.json();
  return { serialNumber: data.serialNumber, shareUrl: data.shareUrl, googleSaveUrl: data.googleSaveUrl };
}

export interface UpdatePassResult {
  notifiedDevices: number;
  unchanged: boolean;
}

export async function updatePass(
  serial: string,
  business: PassBusinessInput,
  customer: PassCustomerInput,
): Promise<UpdatePassResult> {
  const res = await fetch(`${BASE_URL}/api/passes/${encodeURIComponent(serial)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(buildPassBody(business, customer)),
  });

  if (!res.ok) {
    throw new Error(`WalletWallet update pass failed: ${await parseErrorMessage(res)}`);
  }

  const data = await res.json();
  return { notifiedDevices: data.notifiedDevices, unchanged: data.unchanged };
}

export async function revokePass(serial: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/passes/${encodeURIComponent(serial)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.WALLETWALLET_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`WalletWallet revoke pass failed: ${await parseErrorMessage(res)}`);
  }
}
