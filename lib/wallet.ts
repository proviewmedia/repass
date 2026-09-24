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

export type PointsDisplayStyle = "number" | "stamps";

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
  /** "number" (plain points balance) or "stamps" (a filled/empty dot row sized to the next reward). */
  pointsDisplayStyle?: PointsDisplayStyle | null;
}

export function isCustomHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

// The cheapest active tier the customer hasn't reached yet — shared by the
// "next reward" message and the stamp-dot display so both always agree on
// which reward a customer is progressing toward.
function cheapestUnreachedTier(pointsBalance: number, tiers: RewardTier[] | null | undefined): RewardTier | null {
  const unreached = (tiers || [])
    .filter((t) => t.pointsCost > pointsBalance)
    .sort((a, b) => a.pointsCost - b.pointsCost);
  return unreached[0] || null;
}

// "3 more points to a free coffee!" for the cheapest tier not yet reached, or a
// generic nudge once every active tier is already redeemable, or a blank line if
// the business has no active tiers at all.
export function renderNextRewardMessage(pointsBalance: number, tiers: RewardTier[] | null | undefined): string {
  const next = cheapestUnreachedTier(pointsBalance, tiers);

  if (next) {
    const remaining = next.pointsCost - pointsBalance;
    return `${remaining} more point${remaining === 1 ? "" : "s"} to ${next.label}!`;
  }

  if (tiers && tiers.length > 0) return "🎁 You have a reward available!";

  return " ";
}

const MAX_STAMP_DOTS = 20;

// Plain balance ("7") for "number" style. For "stamps", a filled/empty dot row
// sized to the next reward's points cost (e.g. "●●●○○○○○○○" for 3 of 10) — falls
// back to the plain number once there's no reward to size the row against, or
// the reward costs more points than MAX_STAMP_DOTS can render legibly.
export function renderPointsValue(
  pointsBalance: number,
  tiers: RewardTier[] | null | undefined,
  style: PointsDisplayStyle | null | undefined,
): string {
  if (style !== "stamps") return String(pointsBalance);

  const next = cheapestUnreachedTier(pointsBalance, tiers);
  if (!next || next.pointsCost > MAX_STAMP_DOTS) return String(pointsBalance);

  const filled = Math.min(pointsBalance, next.pointsCost);
  return "●".repeat(filled) + "○".repeat(next.pointsCost - filled);
}

// Column list for `.select()` calls against `businesses` wherever a pass needs to be
// built — pair with toPassBusinessInput() so a new branding field only has to be
// threaded through in one place instead of every call site.
export const BUSINESS_BRANDING_COLUMNS =
  "name, program_name, color_preset, logo_url, wide_logo_url, icon_url, thumbnail_url, strip_url, sharing_prohibited, points_display_style";

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
  points_display_style?: string | null;
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
    pointsDisplayStyle: row.points_display_style === "stamps" ? "stamps" : "number",
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
  const pointsValue = renderPointsValue(customer.pointsBalance, business.rewardTiers, business.pointsDisplayStyle);

  const body: Record<string, unknown> = {
    barcodeValue: customer.id,
    barcodeFormat: "QR",
    logoText: business.name,
    organizationName: business.name,
    primaryFields: [{ value: business.programName || business.name }],
    // Visible even when the pass is folded/stacked in Wallet — the only real
    // estate that is. Always the plain number here regardless of display
    // style: this space is tiny, and a 20-dot stamp row wouldn't fit legibly.
    headerFields: [
      {
        label: "POINTS",
        value: String(customer.pointsBalance),
        changeMessage: "You now have %@ points",
      },
    ],
    secondaryFields: [
      {
        label: "POINTS",
        value: pointsValue,
        changeMessage: "You now have %@ points",
      },
      {
        label: "NEXT REWARD",
        value: renderNextRewardMessage(customer.pointsBalance, business.rewardTiers),
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
