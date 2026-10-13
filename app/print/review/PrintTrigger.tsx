"use client";

import { useEffect } from "react";

// Opens the print dialog once the page has settled. Waiting a frame past load
// matters: firing print() before the QR image has decoded produces a sheet
// with an empty square where the code should be, which is the one defect a
// business would not notice until after printing a stack of them.
export default function PrintTrigger() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) =>
          img.complete ? Promise.resolve() : new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          }),
        ),
      );
      if (!cancelled) {
        requestAnimationFrame(() => window.print());
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
