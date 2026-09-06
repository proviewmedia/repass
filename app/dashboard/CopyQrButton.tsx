"use client";

import { useState } from "react";
import { Check, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CopyQrButton({ dataUrl, filename }: { dataUrl: string; filename: string }) {
  const [downloaded, setDownloaded] = useState(false);

  function onClick() {
    // Trigger synchronously, in direct response to the click — any async
    // work first (e.g. a clipboard-image attempt) risks losing the user-
    // activation window a download needs to fire without being blocked.
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} className="gap-1.5">
      {downloaded ? <Check className="h-3.5 w-3.5" /> : <ImageDown className="h-3.5 w-3.5" />}
      {downloaded ? "Downloaded" : "Download QR"}
    </Button>
  );
}
