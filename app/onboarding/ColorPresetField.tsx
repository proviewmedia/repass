"use client";

import { Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const COLOR_PRESETS = [
  { value: "dark", label: "Dark", hex: "#18181b" },
  { value: "blue", label: "Blue", hex: "#1d4ed8" },
  { value: "green", label: "Green", hex: "#15803d" },
  { value: "red", label: "Red", hex: "#b91c1c" },
  { value: "purple", label: "Purple", hex: "#6d28d9" },
  { value: "orange", label: "Orange", hex: "#c2410c" },
];

export default function ColorPresetField({ defaultValue = "dark" }: { defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Card color</Label>
      <RadioGroup name="colorPreset" defaultValue={defaultValue}>
        {COLOR_PRESETS.map((c) => (
          <div key={c.value} className="flex flex-col items-center gap-1.5">
            <RadioGroupItem
              value={c.value}
              id={`onb-color-${c.value}`}
              className="h-10 w-10 border-2 border-transparent data-[state=checked]:border-foreground"
              style={{ backgroundColor: c.hex }}
            >
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            </RadioGroupItem>
            <Label
              htmlFor={`onb-color-${c.value}`}
              className="cursor-pointer text-[11.5px] font-medium text-muted-foreground"
            >
              {c.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
