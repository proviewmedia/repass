// Shared between the /join and /checkin flows: the cookie that lets a
// customer's own phone recognize them on a return visit, without a login.
export function checkinCookieName(businessId: string) {
  return `repass_cid_${businessId}`;
}

// Minimum time between self-check-ins for the same customer, so the same
// static counter QR code can't be scanned repeatedly in one sitting.
export const CHECKIN_COOLDOWN_MS = 12 * 60 * 60 * 1000;
