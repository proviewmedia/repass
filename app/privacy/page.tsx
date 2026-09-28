import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Notice — Repass",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-[14.5px] leading-relaxed text-foreground-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-secondary py-14">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="flex flex-col gap-2 pb-6">
          <h1 className="text-[28px] font-bold tracking-tight">Privacy Notice</h1>
          <p className="text-[13.5px] text-muted-foreground">
            Effective and last updated: September 28, 2026. This notice explains what CV Management Solutions, LLC, operator of
            Repass (&ldquo;we,&rdquo; &ldquo;us&rdquo;), collects, how it&apos;s used, and how it&apos;s protected.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-8 py-8">
            <Section title="1. Scope of this notice">
              <p>
                This notice covers Repass&apos;s dashboard (used by business owners) and the wallet-pass sign-up and
                check-in pages used by their customers. It does not cover the point-of-sale systems you connect
                (Square, Clover, etc.) or Apple/Google&apos;s own Wallet apps, which have their own privacy
                practices.
              </p>
            </Section>

            <Section title="2. Information we collect">
              <p>
                <strong className="font-semibold text-foreground">From business owners:</strong> your name, email,
                business name, branding assets you upload, reward rules, and billing information (processed
                directly by Stripe — Repass does not store your card number).
              </p>
              <p>
                <strong className="font-semibold text-foreground">From your customers, on your behalf:</strong>{" "}
                first and last name, email address, phone number, and points balance, collected when they sign up
                for your loyalty program or when you add them manually or import them from a connected
                point-of-sale system.
              </p>
              <p>
                <strong className="font-semibold text-foreground">Automatically:</strong> only what&apos;s needed to
                keep you signed in (an authentication session). Repass does not currently use analytics or
                advertising tracking cookies, and does not run any session-recording or screen-recording tool on
                its site.
              </p>
            </Section>

            <Section title="3. How we use this information">
              <ul className="list-disc pl-5">
                <li>To operate the loyalty program you configure — issuing and updating wallet passes;</li>
                <li>To send transactional email (a wallet-card link, a receipt) via our email provider, Resend;</li>
                <li>To process your subscription payment via Stripe;</li>
                <li>To award a point automatically when you connect a supported point-of-sale system; and</li>
                <li>To provide customer support and maintain the security of the service.</li>
              </ul>
              <p>We do not sell customer data, and we do not use it for advertising.</p>
            </Section>

            <Section title="4. Where this information lives">
              <p>
                Customer and account data is stored in our database, hosted by Supabase. Depending on which
                features you use, data also passes through: Stripe (billing), WalletWallet (wallet pass
                generation), Resend (transactional email), Vercel (hosting), and, if connected, Square and/or
                Clover. Each of these providers processes data only as needed to provide their part of the service
                to us.
              </p>
            </Section>

            <Section title="5. Point-of-sale integrations">
              <p>
                If you connect Square, Clover, or a similar system, Repass reads only whether a sale completed and
                the contact information (phone or email) tied to that sale, in order to match it to one of your
                enrolled customers and award a point. Repass never requests or stores card numbers, CVV codes, bank
                account details, or itemized purchase contents from any point-of-sale integration.
              </p>
            </Section>

            <Section title="6. Data retention">
              <p>
                Customer records are retained for as long as your account is active. Removing a customer from your
                dashboard marks their record as removed and revokes their wallet pass; it does not immediately
                erase their historical point-activity records, which are kept for your own program&apos;s
                recordkeeping. You can request permanent deletion of a specific customer&apos;s data by contacting
                us at the address below.
              </p>
            </Section>

            <Section title="7. Your rights and choices">
              <p>
                Business owners can access, correct, or delete their account information directly from the
                dashboard. If you are a business owner&apos;s customer and want to access, correct, or request
                deletion of your information, contact the business whose program you joined, or reach us directly
                at the email below and we will forward your request.
              </p>
            </Section>

            <Section title="8. Security">
              <p>
                Point-of-sale access tokens are encrypted at rest (AES-256-GCM). Access to a business&apos;s data is
                restricted to that business&apos;s own account via database-level row security. All traffic to
                Repass is encrypted in transit (HTTPS). See our published security practices for full detail.
              </p>
            </Section>

            <Section title="9. AI tools used to build and operate Repass">
              <p>
                Repass is built and maintained with the help of Anthropic&apos;s Claude, an AI coding assistant.
                Claude is used during development and maintenance of the Repass codebase and does not have standing
                access to production customer data as part of that process.
              </p>
            </Section>

            <Section title="10. Children&apos;s privacy">
              <p>
                Repass is intended for use by business owners aged 18 and older. It is not directed at children,
                and we do not knowingly collect information from children under 13.
              </p>
            </Section>

            <Section title="11. Changes to this notice">
              <p>
                We may update this notice from time to time. We will update the &ldquo;last updated&rdquo; date
                above, and for material changes, notify active business-owner subscribers by email.
              </p>
            </Section>

            <Section title="12. Contact">
              <p>
                Questions about this notice, or a data access/deletion request, can be sent to{" "}
                <a href="mailto:cuadventuresllc@gmail.com" className="underline">
                  cuadventuresllc@gmail.com
                </a>
                .
              </p>
            </Section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
