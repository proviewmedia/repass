import { Card, CardContent } from "@/components/ui/card";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-[14.5px] leading-relaxed text-foreground-soft">{children}</div>
    </section>
  );
}

// Shared by the public /terms page (pre-signup, logged-out access) and the
// in-app Settings > Legal tab, so the content is written once.
export default function TermsContent() {
  return (
    <>
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="text-[28px] font-bold tracking-tight">Terms of Service</h1>
        <p className="text-[13.5px] text-muted-foreground">
          Effective and last updated: September 28, 2026. This agreement is between you (a business owner operating
          a loyalty program) and CV Management Solutions, LLC (&ldquo;CV Management Solutions,&rdquo;
          &ldquo;Repass,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), the operator of Repass.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-8 py-8">
          <Section title="1. Agreement to these Terms">
            <p>
              By creating a Repass account, subscribing to the service, or using any part of the Repass dashboard,
              you agree to these Terms of Service. If you do not agree, do not create an account or use Repass. You
              must be at least 18 years old and authorized to bind the business you are signing up on behalf of.
            </p>
          </Section>

          <Section title="2. What Repass is">
            <p>
              Repass is a subscription service that lets a local business create and manage a digital loyalty,
              stamp-card, or membership program. Repass issues passes that your customers add to Apple Wallet or
              Google Wallet, tracks points customers earn and redeem, and — if you choose to connect a supported
              point-of-sale system — can automatically award a point when a customer completes a purchase.
            </p>
            <p>
              Repass is a tool for you, the business owner, to operate your own loyalty program. Repass is not a
              party to the transactions between you and your customers, does not set your reward terms, and does
              not process payments between you and your customers.
            </p>
          </Section>

          <Section title="3. Your account">
            <p>
              You are responsible for the accuracy of the information you provide (business name, branding, reward
              rules, and any content you upload) and for maintaining the security of your login credentials. You are
              responsible for all activity that occurs under your account, including actions taken by staff you
              give access to.
            </p>
          </Section>

          <Section title="4. Subscription, billing, and cancellation">
            <p>
              Repass is billed at $49/month on a recurring basis, processed by our payment processor, Stripe. By
              subscribing, you authorize us to charge your payment method on file each billing period until you
              cancel. You can cancel at any time from the Billing page in your dashboard; cancellation takes effect
              at the end of your current billing period, and we do not provide partial-period refunds except where
              required by law or at our discretion.
            </p>
            <p>
              If a payment fails, your account&apos;s customer-facing sign-up page may be paused until payment is
              resolved. We may change our pricing on a going-forward basis with notice to active subscribers before
              the change takes effect on their next billing cycle.
            </p>
          </Section>

          <Section title="5. Acceptable use">
            <p>You agree not to use Repass to:</p>
            <ul className="list-disc pl-5">
              <li>Operate a loyalty program for an illegal business or illegal purpose;</li>
              <li>Upload content you don&apos;t have the rights to use (logos, images, trademarks);</li>
              <li>Attempt to access another business&apos;s account, data, or customers;</li>
              <li>Interfere with or disrupt the Repass service or its infrastructure; or</li>
              <li>Use Repass to collect customer data for a purpose unrelated to your loyalty program.</li>
            </ul>
          </Section>

          <Section title="6. Payment and point-of-sale integrations (Square, Clover, Stripe)">
            <p>
              If you connect a supported point-of-sale or payment system, Repass requests only the minimum data
              needed to match a completed sale to one of your enrolled customers and award them a point: the
              sale&apos;s completion status, and the contact information (phone or email) associated with that
              sale. Repass never requests, receives, or stores card numbers, CVV codes, bank details, or full
              transaction line items from any of these integrations. A complete, code-referenced account of
              exactly what each integration accesses is maintained in our internal engineering documentation and
              available on request.
            </p>
            <p>
              Connecting your own Stripe account for this purpose is entirely separate from the Stripe billing
              used to charge your Repass subscription. The connection is granted read-only, and you can revoke it
              at any time from your Repass dashboard or from your own Stripe account settings.
            </p>
            <p>
              You are responsible for having the right to connect your point-of-sale account to Repass and for your
              own compliance obligations as a merchant (including PCI-DSS, which is unaffected by Repass since
              Repass never touches payment card data).
            </p>
          </Section>

          <Section title="7. Wallet passes and your branding">
            <p>
              Passes are generated on your behalf using the name, colors, logo, and reward rules you configure.
              You represent that you have the right to use any logo, name, or image you upload. You retain
              ownership of your brand assets; you grant Repass a license to use them solely to generate and update
              your customers&apos; wallet passes and to operate the service.
            </p>
          </Section>

          <Section title="8. Third-party services">
            <p>
              Repass relies on third-party services to operate, including Stripe (billing), Supabase (database and
              authentication), WalletWallet (wallet pass generation), Resend (transactional email), Vercel
              (hosting), and, if you connect them, Square, Clover, and/or your own Stripe account. Your use of
              Repass is also subject to those providers&apos; own terms where applicable. We are not responsible
              for outages or issues originating from a third-party provider outside our control.
            </p>
          </Section>

          <Section title="9. Service availability">
            <p>
              We aim to keep Repass available and reliable but do not guarantee uninterrupted access. Repass is
              provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express
              or implied, including merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </Section>

          <Section title="10. Limitation of liability">
            <p>
              To the maximum extent permitted by law, CV Management Solutions, LLC will not be liable for indirect,
              incidental, special, consequential, or punitive damages, or for lost profits or revenue, arising from
              your use of Repass. Our total liability for any claim relating to Repass is limited to the amount you
              paid us in the three months before the claim arose.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to indemnify and hold CV Management Solutions, LLC harmless from claims arising out of your
              use of Repass, your loyalty program&apos;s terms or rewards, content you upload, or your violation of
              these Terms or applicable law.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              You may cancel your subscription and close your account at any time. We may suspend or terminate an
              account that violates these Terms, engages in fraudulent or illegal activity, or where required by
              law. Upon termination, your customers&apos; wallet passes may stop updating; we will make reasonable
              efforts to provide notice before termination except in cases of fraud, abuse, or legal requirement.
            </p>
          </Section>

          <Section title="13. Changes to these Terms">
            <p>
              We may update these Terms from time to time. We will update the &ldquo;last updated&rdquo; date above
              and, for material changes, notify active subscribers by email before the change takes effect.
              Continued use of Repass after a change takes effect constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="14. Governing law">
            <p>
              These Terms are governed by the laws of the United States and the state in which CV Management
              Solutions, LLC is organized, without regard to conflict-of-law principles.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              Questions about these Terms can be sent to{" "}
              <a href="mailto:cuadventuresllc@gmail.com" className="underline">
                cuadventuresllc@gmail.com
              </a>
              .
            </p>
          </Section>
        </CardContent>
      </Card>
    </>
  );
}
