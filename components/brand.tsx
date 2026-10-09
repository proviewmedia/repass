// Single source of truth for the Repass Connect mark and wordmark. The icon
// was duplicated inline in four places, which meant a logo change was a
// four-file search-and-replace with no guarantee of catching them all.
//
// TO DROP IN THE REAL LOGO: replace the <svg> inside BrandIcon with the
// exported SVG's contents. Keep the viewBox the artwork was drawn at and
// leave the width/height driven by the `size` prop, so every usage below
// scales with it. Nothing else needs to change.

import Link from "next/link";

export function BrandIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
    </svg>
  );
}

/**
 * The lockup: icon tile plus the wordmark, set in Poppins via `.brand`.
 *
 * `iconOnly` drops the wordmark for tight spots, which is also what you want
 * once the real mark is distinctive enough to stand alone.
 */
export function Brand({
  href = "/",
  size = 32,
  iconOnly = false,
  className = "",
}: {
  href?: string | null;
  size?: number;
  iconOnly?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <span className="mark" style={{ width: size, height: size, borderRadius: Math.round(size / 3.6) }}>
        <BrandIcon size={Math.round(size * 0.5)} />
      </span>
      {!iconOnly && <span className="brand-word">Repass Connect</span>}
    </>
  );

  const classes = `brand${className ? ` ${className}` : ""}`;

  if (href === null) {
    return <div className={classes}>{inner}</div>;
  }

  return (
    <Link href={href} className={classes} aria-label="Repass Connect home">
      {inner}
    </Link>
  );
}
