"use client";

import { useState } from "react";
import { Check, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CopyQrButton({ dataUrl }: { dataUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard image writes aren't supported everywhere — the QR is still
      // a plain <img>, so right-click-and-save-image always works as a fallback.
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5" /> : <ImageDown className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy QR"}
    </Button>
  );
}
