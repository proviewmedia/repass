"use client";

import { useState } from "react";
import { Check, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export default function CopyQrButton({ dataUrl, filename }: { dataUrl: string; filename: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "downloaded">("idle");

  async function onClick() {
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) {
        throw new Error("Clipboard image writes unsupported");
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      // Some browsers silently hang instead of rejecting when a clipboard
      // image write can't complete — race it so this can never hang the
      // button, and always fall back to a real download.
      await withTimeout(navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]), 1500);
      setStatus("copied");
    } catch {
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
