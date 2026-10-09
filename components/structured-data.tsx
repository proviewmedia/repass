// JSON-LD for the marketing page.
//
// The FAQ entries below must stay word-for-word identical to the visible FAQ
// in app/page.tsx. Google treats FAQ markup that does not match what a visitor
// sees as a structured-data violation, and the penalty is losing the rich
// result entirely. If you edit one, edit both.

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repassconnect.com";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Do my customers have to download anything?",
    a: "No. Apple Wallet and Google Wallet are already on their phone. They tap a link, the card is added, and that is the whole setup.",
  },
  {
    q: "What if a customer doesn't have a smartphone?",
    a: "You can still add them from your dashboard and add points by hand. They just won't carry a card, so you look them up by name or email.",
  },
  {
    q: "What can Repass Connect see from my point of sale?",
    a: "Only whether a sale completed and the phone or email attached to it, which is what we use to find the right customer. Repass Connect never requests or stores card numbers, CVV codes, or what was bought.",
  },
  {
    q: "How do points actually get added?",
    a: "Three ways, and you can use any mix: automatically from a connected till, by the customer scanning a check in QR at the counter, or by you tapping a button in the dashboard.",
  },
  {
    q: "Which point of sale systems do you work with?",
    a: "Square, Clover, and Stripe. Toast is not available: they are not accepting new developers onto their integration platform at the moment. If you are on a system we do not support, the counter QR code and the dashboard both work on their own, with no till connection at all.",
  },
  {
    q: "Does the card update itself?",
    a: "Yes. A balance change pushes straight to the card in their wallet, and crossing a reward sends a notification to their lock screen. You never ask anyone to re download anything.",
  },
  {
    q: "What happens if I cancel?",
    a: "Cancel from the billing page any time. The program runs to the end of the period you have paid for, and there is no cancellation fee.",
  },
];

export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Repass Connect",
        legalName: "CV Management Solutions, LLC",
        url: SITE_URL,
        logo: `${SITE_URL}/repass-connect-logo.svg`,
        email: "cuadventuresllc@gmail.com",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Repass Connect",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "Repass Connect",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        description:
          "Digital loyalty, stamp card, and membership programs that live in Apple Wallet and Google Wallet, with no app for customers to download.",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        offers: {
          "@type": "Offer",
          price: "49.00",
          priceCurrency: "USD",
          // One flat plan, which is the actual pricing and also the thing that
          // differentiates it from competitors who take a cut per transaction.
          category: "subscription",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Content is authored here, not user input, so there is nothing to
      // escape beyond closing-tag injection, which JSON.stringify cannot emit.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
