// Client for the WalletWallet API (https://api.walletwallet.dev) — issues and
// updates Apple/Google Wallet passes. See docs/walletwallet.md for the full
// captured API reference this is built against.
//
// Client-safe: SettingsForm.tsx (a "use client" component) imports
// renderNextRewardMessage from here, so this file must never import Node
// builtins (crypto, etc.) or a Supabase client — that pulls a large
// browser polyfill into the client bundle. Server-only helpers that need
// those (e.g. provisionCustomerPass) live in lib/customer-provisioning.ts.

const BASE_URL = "https://api.walletwallet.dev";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WALLETWALLET_API_KEY}`,
  };
}

export interface RewardTier {
  pointsCost: number;
  label: string;
}

export interface PassBusinessInput {
  name: string;
  programName?: string | null;
  /** Either a known preset name ("dark", "blue", …) or a "#rrggbb" custom hex color — see isCustomHexColor. */
  colorPreset?: string | null;
  logoUrl?: string | null;
  wideLogoUrl?: string | null;
  iconUrl?: string | null;
  thumbnailUrl?: string | null;
  stripUrl?: string | null;
  sharingProhibited?: boolean | null;
  /** Active (non-archived) reward tiers, cheapest first. */
  rewardTiers?: RewardTier[];
}

export function isCustomHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

// "3 more points to a free coffee!" for the cheapest tier not yet reached, or a
// generic nudge once every active tier is already redeemable, or a blank line if
// the business has no active tiers at all.
export function renderNextRewardMessage(pointsBalance: number, tiers: RewardTier[] | null | undefined): string {
  const unreached = (tiers || [])
    .filter((t) => t.pointsCost > pointsBalance)
    .sort((a, b) => a.pointsCost - b.pointsCost);

  if (unreached.length > 0) {
    const next = unreached[0];
    const remaining = next.pointsCost - pointsBalance;
    return `${remaining} more point${remaining === 1 ? "" : "s"} to ${next.label}!`;
  }

  if (tiers && tiers.length > 0) return "🎁 You have a reward available!";

  return " ";
}

// Column list for `.select()` calls against `businesses` wherever a pass needs to be
// built — pair with toPassBusinessInput() so a new branding field only has to be
// threaded through in one place instead of every call site.
export const BUSINESS_BRANDING_COLUMNS =
  "name, program_name, color_preset, logo_url, wide_logo_url, icon_url, thumbnail_url, strip_url, sharing_prohibited";

export interface BusinessBrandingRow {
  name: string;
  program_name?: string | null;
  color_preset?: string | null;
  logo_url?: string | null;
  wide_logo_url?: string | null;
  icon_url?: string | null;
  thumbnail_url?: string | null;
  strip_url?: string | null;
  sharing_prohibited?: boolean | null;
}

export function toPassBusinessInput(row: BusinessBrandingRow, rewardTiers: RewardTier[] = []): PassBusinessInput {
  return {
    name: row.name,
    programName: row.program_name,
    colorPreset: row.color_preset,
    logoUrl: row.logo_url,
    wideLogoUrl: row.wide_logo_url,
    iconUrl: row.icon_url,
    thumbnailUrl: row.thumbnail_url,
    stripUrl: row.strip_url,
    sharingProhibited: row.sharing_prohibited,
    rewardTiers,
  };
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
    primaryFields: [{ value: business.programName || business.name }],
    secondaryFields: [
      {
        label: "POINTS",
        value: String(customer.pointsBalance),
        changeMessage: "You now have %@ points",
      },
    ],
    // Index 0 ("Notifications") is the seed-then-bump anchor for the reward-unlock
    // banner — never move it. New fields must only ever be appended after it.
    backFields: [
      { label: "Notifications", value: customer.notification, changeMessage: "%@" },
      {
        label: "Next reward",
        value: renderNextRewardMessage(customer.pointsBalance, business.rewardTiers),
      },
    ],
  };

  if (isCustomHexColor(business.colorPreset)) {
    body.color = business.colorPreset;
  } else {
    body.colorPreset = business.colorPreset || "dark";
  }

  if (business.logoUrl) {
    body.logoURL = business.logoUrl;
  }
  if (business.wideLogoUrl) {
    body.wideLogoURL = business.wideLogoUrl;
  }
  if (business.iconUrl) {
    body.iconURL = business.iconUrl;
  }
  if (business.thumbnailUrl) {
    body.thumbnailURL = business.thumbnailUrl;
  }
  if (business.stripUrl) {
    body.stripURL = business.stripUrl;
  }
  if (business.sharingProhibited != null) {
    body.sharingProhibited = business.sharingProhibited;
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
