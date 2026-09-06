"use client";

import { useState } from "react";
import { Check, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CopyQrButton({ dataUrl, filename }: { dataUrl: string; filename: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "downloaded">("idle");

  async function onClick() {
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) {
        throw new Error("Clipboard image writes unsupported");
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setStatus("copied");
    } catch {
      // Clipboard image writes aren't reliably supported everywhere — fall
      // back to a plain download so the button always does something useful.
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
      setStatus("downloaded");
    }
    setTimeout(() => setStatus("idle"), 1500);
  }

  const label = status === "copied" ? "Copied" : status === "downloaded" ? "Downloaded" : "Copy QR";

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} className="gap-1.5">
      {status !== "idle" ? <Check className="h-3.5 w-3.5" /> : <ImageDown className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
