import TermsContent from "@/components/legal/TermsContent";

export const metadata = {
  title: "Terms of Service — Repass",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-secondary py-14">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <TermsContent />
      </div>
    </main>
  );
}
