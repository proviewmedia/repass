import PrivacyContent from "@/components/legal/PrivacyContent";

export const metadata = {
  title: "Privacy Notice — Repass Connect",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-secondary py-14">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <PrivacyContent />
      </div>
    </main>
  );
}
