import Link from "next/link";

const stampCheck = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const checkIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const newCheckIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const oldXIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function Home() {
  return (
    <>
      <nav>
        <div className="wrap nav-inner">
          <div className="brand">
            <span className="mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2.5" />
                <path d="M2 10h20" />
              </svg>
            </span>
            Repass
          </div>
          <div className="nav-links">
            <a href="#gallery">Examples</a>
            <a href="#programs">Programs</a>
            <a href="#how">How it works</a>
            <Link href="/login" className="btn ghost sm">
              Log in
            </Link>
            <Link href="/signup" className="btn sm">
              Start your program
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">
              <span className="g" /> No app to download · iPhone &amp; Android
            </span>
            <h1>
              Loyalty cards that live in your customers&apos; <em>phones.</em>
            </h1>
            <p className="lead">
              Repass designs and runs Apple &amp; Google Wallet programs for local businesses — loyalty, coupons, and
              memberships that update themselves. You run your shop. We handle the tech.
            </p>
            <div className="hero-cta">
              <Link href="/signup" className="btn">
                Start your program
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a href="#gallery" className="btn ghost">
                See examples
              </a>
            </div>
            <div className="hero-badges">
              <div className="cap">One tap to add — works with</div>
              <div className="wallet-badges">
                <span className="wbadge">
                  <svg width="20" height="24" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.46 7.8 1.3 10.36.86 1.25 1.88 2.66 3.22 2.61 1.29-.05 1.78-.83 3.34-.83 1.55 0 2 .83 3.37.81 1.39-.03 2.27-1.28 3.12-2.54.98-1.46 1.39-2.87 1.41-2.94-.03-.01-2.7-1.04-2.73-4.11l.85-.03zM14.6 4.4c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z" />
                  </svg>
                  <span className="lbl">
                    <small>Add to</small>
                    <span>Apple Wallet</span>
                  </span>
                </span>
                <span className="wbadge">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2.06H12v3.9h5.9a5.05 5.05 0 0 1-2.19 3.31v2.74h3.54c2.07-1.9 3.25-4.72 3.25-7.89z" />
                    <path fill="#34A853" d="M12 23c2.95 0 5.42-.98 7.23-2.65l-3.54-2.74c-.98.66-2.24 1.05-3.69 1.05-2.84 0-5.24-1.92-6.1-4.5H2.25v2.83A10.94 10.94 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M5.9 14.16a6.57 6.57 0 0 1 0-4.2V7.13H2.25a11 11 0 0 0 0 9.86l3.65-2.83z" />
                    <path fill="#EA4335" d="M12 5.46c1.6 0 3.04.55 4.17 1.63l3.13-3.13C17.42 2.16 14.95 1 12 1 7.7 1 3.99 3.47 2.25 7.13L5.9 9.96C6.76 7.38 9.16 5.46 12 5.46z" />
                  </svg>
                  <span className="lbl">
                    <small>Add to</small>
                    <span>Google Wallet</span>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Apple Wallet, in context */}
          <div className="phone-stage">
            <div className="phone">
              <div className="phone-screen">
                <div className="island" />
                <div className="statusbar">
                  <span>9:41</span>
                  <span className="icons">
                    <svg width="17" height="11" viewBox="0 0 17 11" fill="#0a0a0f">
                      <rect x="0" y="6" width="3" height="5" rx="1" />
                      <rect x="4.5" y="4" width="3" height="7" rx="1" />
                      <rect x="9" y="2" width="3" height="9" rx="1" />
                      <rect x="13.5" y="0" width="3" height="11" rx="1" />
                    </svg>
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="#0a0a0f" strokeWidth="1.4">
                      <path d="M1 4.5C4.5 1 11.5 1 15 4.5M3.5 7C6 4.5 10 4.5 12.5 7M6 9.3c1-1 3-1 4 0" strokeLinecap="round" />
                    </svg>
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                      <rect x="1" y="1" width="20" height="10" rx="2.5" stroke="#0a0a0f" strokeOpacity=".5" />
                      <rect x="2.5" y="2.5" width="15" height="7" rx="1.3" fill="#0a0a0f" />
                      <rect x="22" y="4" width="1.6" height="4" rx="1" fill="#0a0a0f" fillOpacity=".5" />
                    </svg>
                  </span>
                </div>
                <div className="wallet-head">
                  <div className="t">Wallet</div>
                  <div className="s">3 passes</div>
                </div>
                <div className="stack">
                  <div className="pass" style={{ "--pass-bg": "#0f5132", "--pass-fg": "#ffffff", "--pass-label": "#ffffffb0" } as React.CSSProperties}>
                    <div className="pass-row">
                      <div className="pass-brand">
                        <span className="pl">IY</span> Iron Yard
                      </div>
                      <div className="field right">
                        <div className="field-label">Member</div>
                        <div className="field-val">All-Access</div>
                      </div>
                    </div>
                  </div>
                  <div className="pass" style={{ "--pass-bg": "#7c2d4a", "--pass-fg": "#ffffff", "--pass-label": "#ffffffb3" } as React.CSSProperties}>
                    <div className="pass-row">
                      <div className="pass-brand">
                        <span className="pl">BV</span> Bloom &amp; Vine
                      </div>
                      <div className="field right">
                        <div className="field-label">Points</div>
                        <div className="field-val">320</div>
                      </div>
                    </div>
                  </div>
                  <div className="pass" style={{ "--pass-bg": "#3b2a20", "--pass-fg": "#f5ede2", "--pass-label": "#f5ede2aa" } as React.CSSProperties}>
                    <div className="pass-row">
                      <div className="pass-brand">
                        <span className="pl" style={{ background: "#c98a4b", color: "#2a1c12" }}>
                          CL
                        </span>{" "}
                        Café Lumen
                      </div>
                      <div className="field right">
                        <div className="field-label">Reward at</div>
                        <div className="field-val">10 drinks</div>
                      </div>
                    </div>
                    <div className="stamps">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <span className="stamp on" key={i}>
                          {stampCheck}
                        </span>
                      ))}
                      <span className="stamp" />
                      <span className="stamp" />
                      <span className="stamp" />
                    </div>
                    <div className="pass-sub">
                      <div className="field">
                        <div className="field-label">Progress</div>
                        <div className="field-val">7 / 10</div>
                      </div>
                      <div className="field">
                        <div className="field-label">Member</div>
                        <div className="field-val">Ava M.</div>
                      </div>
                    </div>
                    <div className="barcode-box">
                      <div className="barcode" />
                      <div className="barcode-alt">CL-4821-0075</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= INDUSTRIES STRIP ================= */}
      <div className="strip">
        <div className="wrap strip-inner">
          <span className="lead-lbl">Built for</span>
          <span className="ind">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
            </svg>{" "}
            Cafés
          </span>
          <span className="ind">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4l7 7M6 6L4 8m8 8 8 8M14 6l4-4 4 4-4 4M6 12l6 6" />
            </svg>{" "}
            Salons
          </span>
          <span className="ind">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5 17.5 17.5M4 4l2 2M20 20l-2-2M14.5 6.5 17 4M9.5 17.5 7 20M2 9v6M22 9v6" />
            </svg>{" "}
            Gyms
          </span>
          <span className="ind">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>{" "}
            Boutiques
          </span>
          <span className="ind">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M4 11l1 8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l1-8" />
            </svg>{" "}
            Restaurants
          </span>
        </div>
      </div>

      {/* ================= PASS GALLERY ================= */}
      <section id="gallery">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">Examples</span>
            <h2>What your card could look like.</h2>
            <p>Every pass is designed in your brand and lives in Apple or Google Wallet — no plastic, no app. A few of the styles we build.</p>
          </div>
          <div className="gallery">
            <div className="gcell">
              <div className="passwrap">
                <div className="pass" style={{ "--pass-bg": "#3b2a20", "--pass-fg": "#f5ede2", "--pass-label": "#f5ede2aa" } as React.CSSProperties}>
                  <div className="pass-row">
                    <div className="pass-brand">
                      <span className="pl" style={{ background: "#c98a4b", color: "#2a1c12" }}>
                        CL
                      </span>{" "}
                      Café Lumen
                    </div>
                    <div className="field right">
                      <div className="field-label">Reward at</div>
                      <div className="field-val">10 drinks</div>
                    </div>
                  </div>
                  <div className="stamps">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span className="stamp on" key={i}>
                        {stampCheck}
                      </span>
                    ))}
                    <span className="stamp" />
                    <span className="stamp" />
                    <span className="stamp" />
                  </div>
                  <div className="barcode-box">
                    <div className="barcode" />
                    <div className="barcode-alt">CL-4821-0075</div>
                  </div>
                </div>
              </div>
              <div className="gcap">
                <div className="type">Loyalty · Stamp card</div>
                <div className="name">Café Lumen</div>
                <div className="desc">Buy 10, get one free</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <div className="pass" style={{ "--pass-bg": "#7c2d4a", "--pass-fg": "#ffffff", "--pass-label": "#ffffffb3" } as React.CSSProperties}>
                  <div className="pass-row">
                    <div className="pass-brand">
                      <span className="pl" style={{ background: "#f7c9d9", color: "#7c2d4a" }}>
                        BV
                      </span>{" "}
                      Bloom &amp; Vine
                    </div>
                    <div className="field right">
                      <div className="field-label">Tier</div>
                      <div className="field-val">Rose</div>
                    </div>
                  </div>
                  <div className="pass-primary">
                    <div className="field-label">Points balance</div>
                    <div className="field-val">
                      320 <span className="unit">pts</span>
                    </div>
                  </div>
                  <div className="pass-sub">
                    <div className="field">
                      <div className="field-label">Member</div>
                      <div className="field-val">Ava Morales</div>
                    </div>
                    <div className="field">
                      <div className="field-label">Next reward</div>
                      <div className="field-val">80 pts</div>
                    </div>
                  </div>
                  <div className="barcode-box">
                    <div className="barcode" />
                    <div className="barcode-alt">BV-0192-4471</div>
                  </div>
                </div>
              </div>
              <div className="gcap">
                <div className="type">Loyalty · Points</div>
                <div className="name">Bloom &amp; Vine</div>
                <div className="desc">Earn points on every purchase</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <div className="pass" style={{ "--pass-bg": "#b3271e", "--pass-fg": "#fff4e6", "--pass-label": "#fff4e6b3" } as React.CSSProperties}>
                  <div className="pass-row">
                    <div className="pass-brand">
                      <span className="pl" style={{ background: "#f5b841", color: "#7a2410" }}>
                        TV
                      </span>{" "}
                      Taco Verde
                    </div>
                    <div className="field right">
                      <div className="field-label">Expires</div>
                      <div className="field-val">Aug 31</div>
                    </div>
                  </div>
                  <div className="pass-primary">
                    <div className="field-label">Your offer</div>
                    <div className="field-val">20% OFF</div>
                  </div>
                  <div className="pass-sub">
                    <div className="field">
                      <div className="field-label">Applies to</div>
                      <div className="field-val">Next order</div>
                    </div>
                    <div className="field">
                      <div className="field-label">Code</div>
                      <div className="field-val">VERDE20</div>
                    </div>
                  </div>
                  <div className="barcode-box">
                    <div className="barcode" />
                    <div className="barcode-alt">TV-COUPON-20OFF</div>
                  </div>
                </div>
              </div>
              <div className="gcap">
                <div className="type">Coupon · Promo</div>
                <div className="name">Taco Verde</div>
                <div className="desc">Redeemable, one-tap offers</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <div className="pass" style={{ "--pass-bg": "#141416", "--pass-fg": "#ffffff", "--pass-label": "#ffffff99" } as React.CSSProperties}>
                  <div className="pass-row">
                    <div className="pass-brand">
                      <span className="pl" style={{ background: "#d4af37", color: "#141416" }}>
                        FR
                      </span>{" "}
                      Fade Room
                    </div>
                    <div className="field right">
                      <div className="field-label">Status</div>
                      <div className="field-val">Gold</div>
                    </div>
                  </div>
                  <div className="pass-primary">
                    <div className="field-label">Membership</div>
                    <div className="field-val">Unlimited</div>
                  </div>
                  <div className="pass-sub">
                    <div className="field">
                      <div className="field-label">Member since</div>
                      <div className="field-val">2026</div>
                    </div>
                    <div className="field">
                      <div className="field-label">Visits</div>
                      <div className="field-val">18</div>
                    </div>
                  </div>
                  <div className="barcode-box">
                    <div className="barcode" />
                    <div className="barcode-alt">FR-GOLD-3390</div>
                  </div>
                </div>
              </div>
              <div className="gcap">
                <div className="type">Membership</div>
                <div className="name">Fade Room</div>
                <div className="desc">Tiers, status &amp; perks</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <div className="pass" style={{ "--pass-bg": "#0f5132", "--pass-fg": "#eafff4", "--pass-label": "#eafff4a6" } as React.CSSProperties}>
                  <div className="pass-row">
                    <div className="pass-brand">
                      <span className="pl" style={{ background: "#42d392", color: "#063b23" }}>
                        IY
                      </span>{" "}
                      Iron Yard
                    </div>
                    <div className="field right">
                      <div className="field-label">Access</div>
                      <div className="field-val">All hours</div>
                    </div>
                  </div>
                  <div className="pass-primary">
                    <div className="field-label">Plan</div>
                    <div className="field-val">All-Access</div>
                  </div>
                  <div className="pass-sub">
                    <div className="field">
                      <div className="field-label">Member</div>
                      <div className="field-val">M. Morales</div>
                    </div>
                    <div className="field">
                      <div className="field-label">ID</div>
                      <div className="field-val">#0451</div>
                    </div>
                  </div>
                  <div className="barcode-box">
                    <div className="barcode qr" />
                    <div className="barcode-alt">IY-0451</div>
                  </div>
                </div>
              </div>
              <div className="gcap">
                <div className="type">Membership · Access</div>
                <div className="name">Iron Yard</div>
                <div className="desc">Scan-in with a QR code</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <div className="pass" style={{ "--pass-bg": "#1e3a5f", "--pass-fg": "#eaf2ff", "--pass-label": "#eaf2ffa6" } as React.CSSProperties}>
                  <div className="pass-row">
                    <div className="pass-brand">
                      <span className="pl" style={{ background: "#7fb2ff", color: "#0f2340" }}>
                        CM
                      </span>{" "}
                      Corner Market
                    </div>
                    <div className="field right">
                      <div className="field-label">Card</div>
                      <div className="field-val">Store</div>
                    </div>
                  </div>
                  <div className="pass-primary">
                    <div className="field-label">Balance</div>
                    <div className="field-val">$45.00</div>
                  </div>
                  <div className="pass-sub">
                    <div className="field">
                      <div className="field-label">Member</div>
                      <div className="field-val">A. Morales</div>
                    </div>
                    <div className="field">
                      <div className="field-label">Since</div>
                      <div className="field-val">May 2026</div>
                    </div>
                  </div>
                  <div className="barcode-box">
                    <div className="barcode" />
                    <div className="barcode-alt">CM-8820-1174</div>
                  </div>
                </div>
              </div>
              <div className="gcap">
                <div className="type">Store card</div>
                <div className="name">Corner Market</div>
                <div className="desc">Reloadable store credit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROGRAMS ================= */}
      <section id="programs" className="alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">Programs</span>
            <h2>Three ways to bring customers back.</h2>
            <p>Start with one or run all three. Each is a branded pass your customers keep in their wallet.</p>
          </div>
          <div className="grid-3">
            <div className="card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v10M8.5 9.5a2.5 2.5 0 0 1 5 0c0 3-5 1.5-5 4a2.5 2.5 0 0 0 5 0" />
                </svg>
              </div>
              <h3>Loyalty &amp; stamp cards</h3>
              <p>Digital punch cards and points that track themselves.</p>
              <ul>
                <li>{checkIcon} Buy-9-get-1-free, or points</li>
                <li>{checkIcon} Updates instantly at the counter</li>
                <li>{checkIcon} Never lost, never reprinted</li>
              </ul>
            </div>
            <div className="card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3H4a1 1 0 0 0-1 1v5l11 11 6-6L9 3Z" />
                  <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <h3>Coupons &amp; promos</h3>
              <p>Redeemable offers delivered straight to the wallet.</p>
              <ul>
                <li>{checkIcon} Percent-off, BOGO, first-visit</li>
                <li>{checkIcon} Set an expiry date</li>
                <li>{checkIcon} Push to everyone who holds it</li>
              </ul>
            </div>
            <div className="card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20M6 15h4" />
                </svg>
              </div>
              <h3>Membership &amp; store cards</h3>
              <p>VIP tiers, gym access, store credit — always current.</p>
              <ul>
                <li>{checkIcon} Tiers, status &amp; member IDs</li>
                <li>{checkIcon} QR / barcode scan-in</li>
                <li>{checkIcon} Message members directly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPARISON ================= */}
      <section id="why">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">The difference</span>
            <h2>The punch card, reinvented.</h2>
            <p>Everything a paper card can&apos;t do — because the wallet is already open on every phone.</p>
          </div>
          <div className="compare">
            <div className="comp-col old">
              <h3>
                <span className="tag">Paper punch card</span>
              </h3>
              <ul>
                <li>{oldXIcon} Left at home or lost in a drawer</li>
                <li>{oldXIcon} Reprint and restock forever</li>
                <li>{oldXIcon} No way to reach a customer again</li>
                <li>{oldXIcon} Zero data on who&apos;s coming back</li>
              </ul>
            </div>
            <div className="comp-col new">
              <h3>
                <span className="tag">Repass wallet pass</span>
              </h3>
              <ul>
                <li>{newCheckIcon} Always in the phone, next to boarding passes</li>
                <li>{newCheckIcon} Nothing to print — ever</li>
                <li>{newCheckIcon} Push an offer to every holder in seconds</li>
                <li>{newCheckIcon} See visits, redemptions &amp; repeat rate</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">How it works</span>
            <h2>Live in minutes — you set it up yourself.</h2>
            <p>Sign up, set your points rule, and start signing up customers. No developer account, no certificates, nothing to install.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h3>Set up your program</h3>
              <p>Name your rewards, pick a color, and decide what earns a point and what it unlocks.</p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Share your join page</h3>
              <p>Every business gets a public sign-up link and QR code customers scan at the counter.</p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>Customers join</h3>
              <p>They fill in their name and the pass drops straight into Apple or Google Wallet.</p>
            </div>
            <div className="step">
              <div className="num">4</div>
              <h3>You run it</h3>
              <p>Tap Add a point in your dashboard and the customer&apos;s pass updates instantly, on their phone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">Why wallet passes</span>
            <h2>Because the wallet is already open.</h2>
          </div>
          <div className="why">
            <div className="stat-cell">
              <div className="stat">0</div>
              <p>apps to download</p>
            </div>
            <div className="stat-cell">
              <div className="stat">1 tap</div>
              <p>to join at the counter</p>
            </div>
            <div className="stat-cell">
              <div className="stat">iOS + Android</div>
              <p>covered from day one</p>
            </div>
            <div className="stat-cell">
              <div className="stat">Anytime</div>
              <p>push offers to every holder</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="contact">
        <div className="wrap">
          <div className="cta">
            <span className="sec-eyebrow">Get started</span>
            <h2>Start your loyalty program today.</h2>
            <p>Set up your points rule and start signing up customers in the next few minutes — no app for you or them to install.</p>
            <Link href="/signup" className="btn">
              Start your program
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <div className="cta-note">$49/month · Cancel anytime</div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="brand">
                <span className="mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2.5" />
                    <path d="M2 10h20" />
                  </svg>
                </span>
                Repass
              </div>
              <p>Done-for-you Apple &amp; Google Wallet programs for local businesses.</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h4>Product</h4>
                <a href="#gallery">Examples</a>
                <a href="#programs">Programs</a>
                <a href="#how">How it works</a>
              </div>
              <div className="foot-col">
                <h4>Account</h4>
                <Link href="/signup">Start your program</Link>
                <Link href="/login">Log in</Link>
                <a href="mailto:hello@proviewmedia.co">Contact</a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Proview Media Co.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
