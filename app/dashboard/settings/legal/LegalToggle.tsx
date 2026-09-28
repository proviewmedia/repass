"use client";

import { useState } from "react";
import TermsContent from "@/components/legal/TermsContent";
import PrivacyContent from "@/components/legal/PrivacyContent";

export default function LegalToggle() {
  const [view, setView] = useState<"terms" | "privacy">("terms");

  return (
    <div className="flex flex-col gap-4">
      <div className="card-preview-toggle w-fit">
        <button type="button" className={view === "terms" ? "active" : ""} onClick={() => setView("terms")}>
          Terms of Service
        </button>
        <button type="button" className={view === "privacy" ? "active" : ""} onClick={() => setView("privacy")}>
          Privacy Notice
        </button>
      </div>

      {view === "terms" ? <TermsContent /> : <PrivacyContent />}
    </div>
  );
}
