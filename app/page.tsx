import Link from "next/link";
import QRCode from "qrcode";

const tickIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const arrowIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

interface PassProps {
  bg: string;
  fg: string;
  label: string;
  chipBg?: string;
  chipFg?: string;
  initials: string;
  business: string;
  program: string;
  headerValue: string;
  fieldLabel: string;
  fieldValue: string;
  dots?: boolean;
  nextReward: string;
  qr: string;
}

// One wallet card, laid out the way a real Apple Wallet store card is:
// brand row with a header field top right, the reserved strip band holding the
// program title, two secondary fields side by side, then the barcode.
function Pass({
  bg,
  fg,
  label,
  chipBg,
  chipFg,
  initials,
  business,
  program,
  headerValue,
  fieldLabel,
  fieldValue,
  dots,
  nextReward,
  qr,
}: PassProps) {
  return (
    <div className="pass" style={{ "--pass-bg": bg, "--pass-fg": fg, "--pass-label": label } as React.CSSProperties}>
      <div className="pass-head">
        <div className="pass-brand">
          <span className="pl" style={chipBg ? { background: chipBg, color: chipFg } : undefined}>
            {initials}
          </span>
          {business}
        </div>
        <div className="pass-hfield">
          <div className="field-label">Points</div>
          <div className="field-val">{headerValue}</div>
        </div>
      </div>

      <div className="pass-strip">
        <div className="pass-title">{program}</div>
      </div>

      <div className="pass-fields">
        <div className="field">
          <div className="field-label">{fieldLabel}</div>
          <div className={dots ? "field-val pass-dots" : "field-val"}>{fieldValue}</div>
        </div>
        <div className="field right">
          <div className="field-label">Next reward</div>
          <div className="field-val" style={{ fontSize: 12, fontWeight: 600 }}>
            {nextReward}
          </div>
        </div>
      </div>

      <div className="pass-barcode">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="" width={68} height={68} />
      </div>

      <div className="pass-foot">
        <span className="dot" />
        {business}
      </div>
    </div>
  );
}

export default async function Home() {
  const mockQr = await QRCode.toDataURL("https://repass-virid.vercel.app", { margin: 0, width: 136 });

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
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
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
              <span className="g" /> No app to download. iPhone and Android.
            </span>
            <h1>
              Loyalty cards that live in your customers&apos; <em>phones.</em>
            </h1>
            <p className="lead">
              Repass runs Apple and Google Wallet loyalty programs for local businesses. Your customers add a card
              once, and it keeps itself up to date. Nothing to install, nothing to carry.
            </p>
            <div className="hero-cta">
              <Link href="/signup" className="btn">
                Start your program
                {arrowIcon}
              </Link>
              <a href="#gallery" className="btn ghost">
                See examples
              </a>
            </div>
            <div className="hero-badges">
              <div className="cap">One tap to add, works with</div>
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
                  <div className="pass" style={{ "--pass-bg": "#1e3a5f", "--pass-fg": "#eaf2ff", "--pass-label": "#eaf2ffa6" } as React.CSSProperties}>
                    <div className="pass-head">
                      <div className="pass-brand">
                        <span className="pl" style={{ background: "#7fb2ff", color: "#0f2340" }}>
                          IY
                        </span>
                        Iron Yard
                      </div>
                      <div className="pass-hfield">
                        <div className="field-label">Points</div>
                        <div className="field-val">40</div>
                      </div>
                    </div>
                  </div>
                  <div className="pass" style={{ "--pass-bg": "#7c2d4a", "--pass-fg": "#ffffff", "--pass-label": "#ffffffb3" } as React.CSSProperties}>
                    <div className="pass-head">
                      <div className="pass-brand">
                        <span className="pl">BV</span> Bloom &amp; Vine
                      </div>
                      <div className="pass-hfield">
                        <div className="field-label">Points</div>
                        <div className="field-val">6</div>
                      </div>
                    </div>
                  </div>
                  <Pass
                    bg="#3b2a20"
                    fg="#f5ede2"
                    label="#f5ede2aa"
                    chipBg="#c98a4b"
                    chipFg="#2a1c12"
                    initials="CL"
                    business="Café Lumen"
                    program="Café Lumen Rewards"
                    headerValue="7/10"
                    fieldLabel="Points"
                    fieldValue="●●●●●●●○○○"
                    dots
                    nextReward="3 away from a free drink"
                    qr={mockQr}
                  />
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
            <h2>What your card looks like.</h2>
            <p>
              Your colours, your logo, your reward. Laid out exactly the way Apple Wallet renders a store card, because
              that is what your customers get.
            </p>
          </div>
          <div className="gallery">
            <div className="gcell">
              <div className="passwrap">
                <Pass
                  bg="#3b2a20"
                  fg="#f5ede2"
                  label="#f5ede2aa"
                  chipBg="#c98a4b"
                  chipFg="#2a1c12"
                  initials="CL"
                  business="Café Lumen"
                  program="Café Lumen Rewards"
                  headerValue="7/10"
                  fieldLabel="Points"
                  fieldValue="●●●●●●●○○○"
                  dots
                  nextReward="3 away from a free drink"
                  qr={mockQr}
                />
              </div>
              <div className="gcap">
                <div className="type">Stamp card</div>
                <div className="name">Café Lumen</div>
                <div className="desc">Free drink every 10 visits</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <Pass
                  bg="#14312a"
                  fg="#e8f7f0"
                  label="#e8f7f0a6"
                  chipBg="#5ddfae"
                  chipFg="#0a2b22"
                  initials="NB"
                  business="North Barber"
                  program="North Barber Club"
                  headerValue="4/6"
                  fieldLabel="Points"
                  fieldValue="●●●●○○"
                  dots
                  nextReward="2 away from a free cut"
                  qr={mockQr}
                />
              </div>
              <div className="gcap">
                <div className="type">Stamp card</div>
                <div className="name">North Barber</div>
                <div className="desc">Sixth cut on the house</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <Pass
                  bg="#7c2d4a"
                  fg="#ffffff"
                  label="#ffffffb3"
                  chipBg="#f7c9d9"
                  chipFg="#7c2d4a"
                  initials="BV"
                  business="Bloom & Vine"
                  program="Bloom Rewards"
                  headerValue="320"
                  fieldLabel="Points"
                  fieldValue="320"
                  nextReward="180 to a free bouquet"
                  qr={mockQr}
                />
              </div>
              <div className="gcap">
                <div className="type">Points program</div>
                <div className="name">Bloom &amp; Vine</div>
                <div className="desc">Spend based, 500 point reward</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <Pass
                  bg="#1e3a5f"
                  fg="#eaf2ff"
                  label="#eaf2ffa6"
                  chipBg="#7fb2ff"
                  chipFg="#0f2340"
                  initials="IY"
                  business="Iron Yard"
                  program="Iron Yard Members"
                  headerValue="40"
                  fieldLabel="Visits"
                  fieldValue="40"
                  nextReward="Free month at 50"
                  qr={mockQr}
                />
              </div>
              <div className="gcap">
                <div className="type">Membership</div>
                <div className="name">Iron Yard</div>
                <div className="desc">Visit streak, monthly perk</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <Pass
                  bg="#4a2d6b"
                  fg="#f3ecff"
                  label="#f3ecffa6"
                  chipBg="#c9a7f7"
                  chipFg="#33194f"
                  initials="PP"
                  business="Paper Press"
                  program="Paper Press Readers"
                  headerValue="5/8"
                  fieldLabel="Points"
                  fieldValue="●●●●●○○○"
                  dots
                  nextReward="3 away from 20% off"
                  qr={mockQr}
                />
              </div>
              <div className="gcap">
                <div className="type">Stamp card</div>
                <div className="name">Paper Press</div>
                <div className="desc">Bookshop, eighth visit reward</div>
              </div>
            </div>

            <div className="gcell">
              <div className="passwrap">
                <Pass
                  bg="#6b2f15"
                  fg="#fdeee3"
                  label="#fdeee3a6"
                  chipBg="#f5a86a"
                  chipFg="#4a1f0c"
                  initials="SF"
                  business="Sunday Flour"
                  program="Sunday Flour Rewards"
                  headerValue="12"
                  fieldLabel="Points"
                  fieldValue="12"
                  nextReward="3 to a free loaf"
                  qr={mockQr}
                />
              </div>
              <div className="gcap">
                <div className="type">Points program</div>
                <div className="name">Sunday Flour</div>
                <div className="desc">Bakery, one point per visit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">Features</span>
            <h2>Everything a points program needs. Nothing it doesn&apos;t.</h2>
            <p>One card, one plan, no software for you or your customers to learn.</p>
          </div>
          <div className="grid-3">
            <div className="card">
              <div className="kicker">Your brand</div>
              <h3>The card looks like you</h3>
              <p>
                Set your colours, logo, and program name. Save once and the design pushes to every card already in a
                customer&apos;s phone.
              </p>
            </div>
            <div className="card">
              <div className="kicker">Earning</div>
              <h3>Points add themselves</h3>
              <p>
                Connect Square, Clover, or Stripe and a completed sale awards a point automatically, matched by the
                phone or email on the sale.
              </p>
            </div>
            <div className="card">
              <div className="kicker">No POS needed</div>
              <h3>A QR on the counter</h3>
              <p>
                Not connected to a till? Customers scan a check in code and add their own point. No staff action, no
                app, no scanner to buy.
              </p>
            </div>
            <div className="card">
              <div className="kicker">Redeeming</div>
              <h3>Rewards that apply themselves</h3>
              <p>
                Link a reward to a Square discount and it comes off at checkout, with the points deducted at the same
                time.
              </p>
            </div>
            <div className="card">
              <div className="kicker">Staying in touch</div>
              <h3>A nudge on the lock screen</h3>
              <p>
                When someone earns a reward, their card updates and a notification lands on their lock screen. No
                mailing list required.
              </p>
            </div>
            <div className="card">
              <div className="kicker">Signing up</div>
              <h3>A link and a QR code</h3>
              <p>
                Share a join link or print the QR for your counter. They fill in a short form and the card is in their
                wallet seconds later.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DEEP DIVES ================= */}
      <section>
        <div className="wrap">
          <div className="split">
            <div className="split-copy">
              <span className="sec-eyebrow">Automatic earning</span>
              <h2>Connect your till and stop thinking about it.</h2>
              <p>
                Repass watches for completed sales and matches them to the customer by the phone number or email on the
                sale. The point is on their card before they leave the counter.
              </p>
              <ul className="ticks">
                <li>
                  {tickIcon}
                  <span>
                    <b>Square, Clover, and Stripe.</b> Connect in a couple of clicks, no hardware to change.
                  </span>
                </li>
                <li>
                  {tickIcon}
                  <span>
                    <b>Read only.</b> Repass sees whether a sale completed and the contact on it. Never card numbers.
                  </span>
                </li>
                <li>
                  {tickIcon}
                  <span>
                    <b>Import your existing customers</b> from the till in one click.
                  </span>
                </li>
              </ul>
            </div>
            <div className="split-art">
              <div className="app-shot">
                <div className="app-side">
                  <div className="biz">Café Lumen</div>
                  <div className="row">
                    <i /> Dashboard
                  </div>
                  <div className="row">
                    <i /> Customers
                  </div>
                  <div className="row">
                    <i /> Rewards
                  </div>
                  <div className="row">
                    <i /> Card Design
                  </div>
                  <div className="row on">
                    <i /> Settings
                  </div>
                </div>
                <div className="app-main">
                  <div className="h">Settings</div>
                  <div className="sub">Connections</div>
                  <div className="app-card">
                    <div className="app-row">
                      <span className="ico" />
                      <span className="txt">
                        <b>Square</b>
                        <span>Awards a point on every sale</span>
                      </span>
                      <span className="app-chip">Connected</span>
                    </div>
                    <div className="app-row">
                      <span className="ico" />
                      <span className="txt">
                        <b>Clover</b>
                        <span>Awards a point on every sale</span>
                      </span>
                      <span className="app-chip warn">Connect</span>
                    </div>
                    <div className="app-row">
                      <span className="ico" />
                      <span className="txt">
                        <b>Stripe</b>
                        <span>Awards a point on every payment</span>
                      </span>
                      <span className="app-chip warn">Connect</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="split rev">
            <div className="split-copy">
              <span className="sec-eyebrow">Your dashboard</span>
              <h2>See the program at a glance.</h2>
              <p>
                Who joined, how many points went out, how many rewards came back. Plus a setup checklist so you always
                know what is left to turn on.
              </p>
              <ul className="ticks">
                <li>
                  {tickIcon}
                  <span>
                    <b>Customer list</b> you can search, edit, and add to by hand.
                  </span>
                </li>
                <li>
                  {tickIcon}
                  <span>
                    <b>Printable signage</b> for the counter, generated for your shop.
                  </span>
                </li>
                <li>
                  {tickIcon}
                  <span>
                    <b>Live card preview</b> while you design, plus a real card you can send to your own phone.
                  </span>
                </li>
              </ul>
            </div>
            <div className="split-art">
              <div className="app-shot">
                <div className="app-side">
                  <div className="biz">Café Lumen</div>
                  <div className="row on">
                    <i /> Dashboard
                  </div>
                  <div className="row">
                    <i /> Customers
                  </div>
                  <div className="row">
                    <i /> Rewards
                  </div>
                  <div className="row">
                    <i /> Card Design
                  </div>
                  <div className="row">
                    <i /> Settings
                  </div>
                </div>
                <div className="app-main">
                  <div className="h">Dashboard</div>
                  <div className="sub">Café Lumen, 1 pt/visit, 2 rewards available</div>
                  <div className="app-stats">
                    <div className="app-stat">
                      <div className="n">
                        214<span className="d">+12</span>
                      </div>
                      <div className="l">Customers</div>
                    </div>
                    <div className="app-stat">
                      <div className="n">
                        1,480<span className="d">+96</span>
                      </div>
                      <div className="l">Points out</div>
                    </div>
                    <div className="app-stat">
                      <div className="n">
                        63<span className="d">+5</span>
                      </div>
                      <div className="l">Rewards</div>
                    </div>
                  </div>
                  <div className="app-chips">
                    <span className="app-chip">Card designed</span>
                    <span className="app-chip">Reward added</span>
                    <span className="app-chip">POS connected</span>
                  </div>
                  <div className="app-card">
                    <div className="t">Signage</div>
                    <div className="s">Print these for your counter</div>
                    <div className="app-row">
                      <span className="ico" />
                      <span className="txt">
                        <b>New customer sign up</b>
                        <span>repass.app/join/cafe-lumen</span>
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mockQr} alt="" className="qr" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">How it works</span>
            <h2>Live in about a minute.</h2>
            <p>Three steps, then your card is real and ready to hand out.</p>
          </div>
          <div className="steps" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="step">
              <div className="num">1</div>
              <h3>Design your card</h3>
              <p>Name your program, pick a colour, drop in your logo, and set what earns a point.</p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Connect or print</h3>
              <p>Link Square, Clover, or Stripe so points add themselves, or print the counter QR and skip it.</p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>Share the link</h3>
              <p>Customers tap once to add the card. From then on it updates itself in their wallet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">Pricing</span>
            <h2>One plan. No percentage of your sales.</h2>
            <p>Everything is included. There is no card tier, no push notification tier, and no per customer fee.</p>
          </div>
          <div className="price-wrap">
            <div className="price-card">
              <div className="plan">Repass</div>
              <div className="price-amt">
                <span className="n">$49</span>
                <span className="per">per month</span>
              </div>
              <ul className="ticks">
                <li>
                  {tickIcon}
                  <span>Unlimited customers and unlimited cards</span>
                </li>
                <li>
                  {tickIcon}
                  <span>Apple Wallet and Google Wallet included</span>
                </li>
                <li>
                  {tickIcon}
                  <span>Lock screen notifications included</span>
                </li>
                <li>
                  {tickIcon}
                  <span>Square, Clover, and Stripe connections</span>
                </li>
                <li>
                  {tickIcon}
                  <span>No transaction fee, ever</span>
                </li>
                <li>
                  {tickIcon}
                  <span>Cancel any time from your dashboard</span>
                </li>
              </ul>
              <Link href="/signup" className="btn">
                Start your program
                {arrowIcon}
              </Link>
            </div>
            <p className="price-note">Billed monthly. Cancel whenever, it ends at the end of the period.</p>
          </div>
        </div>
      </section>

      {/* ================= COMPARISON ================= */}
      <section className="alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">How we compare</span>
            <h2>The short version.</h2>
            <p>Published pricing, checked October 2026. Every product here does different things, so weigh what you actually need.</p>
          </div>
          <div className="cmp-scroll">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th />
                  <th className="us">Repass</th>
                  <th>Kangaroo Rewards</th>
                  <th>Join It</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Card lives in Apple / Google Wallet</td>
                  <td className="us">Yes</td>
                  <td>No</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Customer downloads an app</td>
                  <td className="us">Never</td>
                  <td>Required</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>Push to the card</td>
                  <td className="us">Included</td>
                  <td>App notifications</td>
                  <td>On the $199 tier</td>
                </tr>
                <tr>
                  <td>Cut of your transactions</td>
                  <td className="us">None</td>
                  <td>None</td>
                  <td>1.5% to 3%</td>
                </tr>
                <tr>
                  <td>Points added from a POS sale</td>
                  <td className="us">Square, Clover, Stripe</td>
                  <td>Via integrations</td>
                  <td>Not a POS product</td>
                </tr>
                <tr>
                  <td>Email and SMS campaigns</td>
                  <td className="us">Not yet</td>
                  <td>Yes</td>
                  <td>Via integrations</td>
                </tr>
                <tr>
                  <td>Starting price</td>
                  <td className="us">$49/mo</td>
                  <td>$79/mo</td>
                  <td>$29/mo, wallet cards from $99</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="cmp-note">
            Kangaroo is a bigger suite built around its own customer app. Join It is membership software for clubs and
            nonprofits. Repass does one thing: a wallet loyalty card for a local business.
          </p>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-eyebrow">Questions</span>
            <h2>The things people ask first.</h2>
          </div>
          <div className="faq">
            <div className="faq-item">
              <h3>Do my customers have to download anything?</h3>
              <p>
                No. Apple Wallet and Google Wallet are already on their phone. They tap a link, the card is added, and
                that is the whole setup.
              </p>
            </div>
            <div className="faq-item">
              <h3>What if a customer doesn&apos;t have a smartphone?</h3>
              <p>
                You can still add them from your dashboard and add points by hand. They just won&apos;t carry a card,
                so you look them up by name or email.
              </p>
            </div>
            <div className="faq-item">
              <h3>What can Repass see from my point of sale?</h3>
              <p>
                Only whether a sale completed and the phone or email attached to it, which is what we use to find the
                right customer. Repass never requests or stores card numbers, CVV codes, or what was bought.
              </p>
            </div>
            <div className="faq-item">
              <h3>How do points actually get added?</h3>
              <p>
                Three ways, and you can use any mix: automatically from a connected till, by the customer scanning a
                check in QR at the counter, or by you tapping a button in the dashboard.
              </p>
            </div>
            <div className="faq-item">
              <h3>Does the card update itself?</h3>
              <p>
                Yes. A balance change pushes straight to the card in their wallet, and crossing a reward sends a
                notification to their lock screen. You never ask anyone to re download anything.
              </p>
            </div>
            <div className="faq-item">
              <h3>What happens if I cancel?</h3>
              <p>
                Cancel from the billing page any time. The program runs to the end of the period you have paid for, and
                there is no cancellation fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="contact">
        <div className="wrap">
          <div className="cta">
            <span className="sec-eyebrow">Get started</span>
            <h2>Your loyalty card could be live today.</h2>
            <p>
              Set it up in about a minute, print the QR for your counter, and start handing out cards this afternoon.
            </p>
            <Link href="/signup" className="btn">
              Start your program
              {arrowIcon}
            </Link>
            <div className="cta-note">$49 per month. Cancel any time.</div>
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
              <p>Apple and Google Wallet loyalty programs for local businesses.</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h4>Product</h4>
                <a href="#gallery">Examples</a>
                <a href="#features">Features</a>
                <a href="#how">How it works</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className="foot-col">
                <h4>Account</h4>
                <Link href="/signup">Start your program</Link>
                <Link href="/login">Log in</Link>
                <a href="mailto:hello@proviewmedia.co">Contact</a>
              </div>
              <div className="foot-col">
                <h4>Legal</h4>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy Notice</Link>
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
