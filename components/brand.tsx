// Single source of truth for the Repass Connect mark and wordmark. The icon
// was previously duplicated inline in four places, which meant a logo change
// was a four-file search-and-replace with no guarantee of catching them all.
//
// The artwork is the symbol lifted from "REPASS CONNECT LOGO.svg". The source
// file is the full lockup (symbol plus the words drawn as outlined type); only
// the symbol is used here, with the wordmark set live in Poppins instead. Live
// text stays crisp at any size, is selectable and searchable, and keeps the
// lockup legible at nav scale, where outlined type that small turns to mush.
//
// Drawn with currentColor rather than the source file's hard-coded #fff, so
// one component works on the dark tile, on light grounds, and anywhere else.

import Link from "next/link";

/** Symbol only. viewBox matches the artwork's own symbol bounds. */
export function BrandIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 238.6 238.56"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M203.55,203.52l35.04,35.04h-119.28v-68.16c14.06,0,26.84-5.76,36.1-15.01,9.26-9.27,15.01-22.05,15.01-36.1s-5.76-26.84-15.01-36.1c-9.27-9.26-22.05-15.01-36.1-15.01s-26.84,5.76-36.1,15.01c-9.26,9.27-15.01,22.05-15.01,36.1v119.28H.03v-119.28C.03,86.48,13.45,56.66,35.07,35.04c9.58-9.58,20.77-17.55,33.12-23.45C83.7,4.17,101.05,0,119.31,0c32.8,0,62.62,13.42,84.24,35.04,21.61,21.62,35.04,51.44,35.04,84.24,0,18.26-4.17,35.6-11.59,51.12-5.9,12.35-13.87,23.54-23.45,33.12Z" />
    </svg>
  );
}

/**
 * The lockup: symbol in its tile, plus the wordmark set in Poppins.
 *
 * `iconOnly` drops the wordmark for tight spots. The symbol reads on its own,
 * so prefer it anywhere the name is already established by context.
 */
export function Brand({
  href = "/",
  size = 31,
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
      <span className="mark" style={{ width: size, height: size, borderRadius: Math.round(size / 3.4) }}>
        {/* The glyph is open at the lower left, so it needs slightly less
            inset than a visually closed mark to sit optically centred. */}
        <BrandIcon size={Math.round(size * 0.56)} />
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
