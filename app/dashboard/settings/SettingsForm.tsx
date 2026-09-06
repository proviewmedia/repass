"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check } from "lucide-react";
import { updateSettings, previewCard } from "./actions";
import SubmitButton from "./SubmitButton";
import { renderPunchCircles, renderNextRewardMessage } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const COLOR_PRESETS: { value: string; label: string; hex: string }[] = [
  { value: "dark", label: "Dark", hex: "#18181b" },
  { value: "blue", label: "Blue", hex: "#1d4ed8" },
  { value: "green", label: "Green", hex: "#15803d" },
  { value: "red", label: "Red", hex: "#b91c1c" },
  { value: "purple", label: "Purple", hex: "#6d28d9" },
  { value: "orange", label: "Orange", hex: "#c2410c" },
];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

interface Props {
  initial: {
    name: string;
    programName: string;
    colorPreset: string;
    logoUrl: string | null;
    wideLogoUrl: string | null;
    iconUrl: string | null;
    thumbnailUrl: string | null;
    stripUrl: string | null;
    allowSharing: boolean;
    pointsPerAction: number;
    rewardThreshold: number;
    rewardDescription: string;
  };
  error?: string;
  saved?: boolean;
  previewUrl?: string;
}

function useImageField(initialUrl: string | null) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setRemoved(false);
      setPreview(URL.createObjectURL(file));
    }
  }

  function onRemove() {
    setRemoved(true);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return { preview, removed, inputRef, onChange, onRemove };
}

function ImageField({
  label,
  hint,
  fieldName,
  removeFieldName,
  field,
}: {
  label: string;
  hint: string;
  fieldName: string;
  removeFieldName: string;
  field: ReturnType<typeof useImageField>;
}) {
  const hasImage = field.preview && !field.removed;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldName}>{label}</Label>
      <div className="flex items-center gap-3">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={field.preview!} alt="" className="h-10 w-10 rounded-lg border border-input object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-lg border border-dashed border-input bg-secondary" />
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => field.inputRef.current?.click()}>
          {hasImage ? "Change" : "Upload"}
        </Button>
        {hasImage && (
          <Button type="button" variant="ghost" size="sm" onClick={field.onRemove}>
            Remove
          </Button>
        )}
        <input
          id={fieldName}
          type="file"
          name={fieldName}
          ref={field.inputRef}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={field.onChange}
          className="hidden"
        />
      </div>
      <p className="text-[12.5px] text-muted-foreground">{hint}</p>
      {field.removed && <input type="hidden" name={removeFieldName} value="1" />}
    </div>
  );
}

export default function SettingsForm({ initial, error, saved, previewUrl }: Props) {
  const [name, setName] = useState(initial.name);
  const [programName, setProgramName] = useState(initial.programName);
  const isInitialPreset = COLOR_PRESETS.some((c) => c.value === initial.colorPreset);
  const [colorMode, setColorMode] = useState<"preset" | "custom">(
    !isInitialPreset && HEX_COLOR_RE.test(initial.colorPreset) ? "custom" : "preset",
  );
  const [colorPreset, setColorPreset] = useState(isInitialPreset ? initial.colorPreset : "dark");
  const [customColor, setCustomColor] = useState(
    HEX_COLOR_RE.test(initial.colorPreset) ? initial.colorPreset : "#4f46e5",
  );
  const [rewardThreshold, setRewardThreshold] = useState(initial.rewardThreshold);
  const [rewardDescription, setRewardDescription] = useState(initial.rewardDescription);

  const logo = useImageField(initial.logoUrl);
  const wideLogo = useImageField(initial.wideLogoUrl);
  const icon = useImageField(initial.iconUrl);
  const thumbnail = useImageField(initial.thumbnailUrl);
  const strip = useImageField(initial.stripUrl);

  const [walletView, setWalletView] = useState<"apple" | "google">("apple");
  const [showBack, setShowBack] = useState(false);
  const [mockQr, setMockQr] = useState<string | null>(null);
  const [realQr, setRealQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL("PREVIEW", { margin: 1, width: 200 }).then(setMockQr);
  }, []);

  useEffect(() => {
    if (previewUrl) {
      QRCode.toDataURL(previewUrl, { margin: 1, width: 220 }).then(setRealQr);
    }
  }, [previewUrl]);

  const swatchHex =
    colorMode === "custom" ? customColor : (COLOR_PRESETS.find((c) => c.value === colorPreset) || COLOR_PRESETS[0]).hex;

  function onColorValueChange(value: string) {
    if (value === "custom") {
      setColorMode("custom");
    } else {
      setColorMode("preset");
      setColorPreset(value);
    }
  }

  const showWideOnGoogle = walletView === "google" && wideLogo.preview && !wideLogo.removed;
  const headerLogoSrc = walletView === "apple" ? logo.preview || wideLogo.preview : logo.preview;

  return (
    <div className="settings-layout">
      <form action={updateSettings} className="flex flex-col gap-5 sm:gap-6" encType="multipart/form-data">
        {error && <Alert variant="destructive">{error}</Alert>}
        {saved && <Alert>Saved — updated cards are pushing out to customers now.</Alert>}

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Your business name, card title, and color.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Business name</Label>
                <Input id="name" type="text" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="programName">Program name (shown on the card)</Label>
                <Input
                  id="programName"
                  type="text"
                  name="programName"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder={name}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Card color</Label>
              <RadioGroup value={colorMode === "custom" ? "custom" : colorPreset} onValueChange={onColorValueChange}>
                {COLOR_PRESETS.map((c) => (
                  <div key={c.value} className="flex flex-col items-center gap-1.5">
                    <RadioGroupItem
                      value={c.value}
                      id={`color-${c.value}`}
                      className="h-10 w-10 border-2 border-transparent data-[state=checked]:border-foreground"
                      style={{ backgroundColor: c.hex }}
                    >
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </RadioGroupItem>
                    <Label htmlFor={`color-${c.value}`} className="cursor-pointer text-[11.5px] font-medium text-muted-foreground">
                      {c.label}
                    </Label>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1.5">
                  <RadioGroupItem
                    value="custom"
                    id="color-custom"
                    className="h-10 w-10 border-2 border-transparent data-[state=checked]:border-foreground"
                    style={{
                      background:
                        colorMode === "custom"
                          ? customColor
                          : "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6, #ef4444)",
                    }}
                  >
                    <Check className="h-4 w-4 text-white" strokeWidth={3} style={{ filter: "drop-shadow(0 0 1px #0006)" }} />
                  </RadioGroupItem>
                  <Label htmlFor="color-custom" className="cursor-pointer text-[11.5px] font-medium text-muted-foreground">
                    Custom
                  </Label>
                </div>
              </RadioGroup>
              {colorMode === "custom" ? (
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    name="colorPreset"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                  />
                  <span className="font-mono text-[13px] text-muted-foreground">{customColor}</span>
                </div>
              ) : (
                <input type="hidden" name="colorPreset" value={colorPreset} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card images</CardTitle>
            <CardDescription>All optional except the logo — shown across Apple &amp; Google Wallet.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageField
              label="Logo (160×160)"
              hint="Round logo, top-left of the card."
              fieldName="logo"
              removeFieldName="removeLogo"
              field={logo}
            />
            <ImageField
              label="Wide logo (1280×400, optional)"
              hint="Replaces the round logo and name on Google Wallet with a wide wordmark."
              fieldName="wideLogo"
              removeFieldName="removeWideLogo"
              field={wideLogo}
            />
            <ImageField
              label="Thumbnail (180×180, optional)"
              hint="Shown top-right of the card."
              fieldName="thumbnail"
              removeFieldName="removeThumbnail"
              field={thumbnail}
            />
            <ImageField
              label="Banner image (1080×360, optional)"
              hint="Switches the card to a wide banner layout behind the title."
              fieldName="strip"
              removeFieldName="removeStrip"
              field={strip}
            />
            <ImageField
              label="Notification icon (120×120, optional)"
              hint="Used for iOS lock-screen notifications only — not visible on the card face."
              fieldName="icon"
              removeFieldName="removeIcon"
              field={icon}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Points rule</CardTitle>
            <CardDescription>What earns a point, and what it unlocks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2.5">
              <Checkbox id="allowSharing" name="allowSharing" value="1" defaultChecked={initial.allowSharing} />
              <Label htmlFor="allowSharing" className="cursor-pointer font-medium">
                Let customers share this card with others
              </Label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pointsPerAction">Points per visit</Label>
                <Input
                  id="pointsPerAction"
                  type="number"
                  name="pointsPerAction"
                  defaultValue={initial.pointsPerAction}
                  min={1}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rewardThreshold">Points for a reward</Label>
                <Input
                  id="rewardThreshold"
                  type="number"
                  name="rewardThreshold"
                  value={rewardThreshold}
                  onChange={(e) =>
                    setRewardThreshold(Math.min(14, Math.max(1, parseInt(e.target.value, 10) || 1)))
                  }
                  min={1}
                  max={14}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rewardDescription">What the reward is</Label>
              <Input
                id="rewardDescription"
                type="text"
                name="rewardDescription"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
          <SubmitButton formAction={previewCard} variant="ghost" pendingText="Generating…">
            Preview on your phone
          </SubmitButton>
          {saved && (
            <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-emerald-600">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>

        {realQr && (
          <div className="phone-preview">
            <span className="auth-sub">Scan with your phone — this is the real card, not a mockup:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={realQr} alt="Scan to preview on your phone" width={160} height={160} />
          </div>
        )}
      </form>

      <div className="card-preview-wrap">
        <span className="auth-sub" style={{ marginBottom: 10, display: "block" }}>
          Live preview (close approximation — use &ldquo;Preview on your phone&rdquo; for the exact card)
        </span>

        <div className="card-preview-toggle">
          <button
            type="button"
            className={walletView === "apple" ? "active" : ""}
            onClick={() => setWalletView("apple")}
          >
            Apple
          </button>
          <button
            type="button"
            className={walletView === "google" ? "active" : ""}
            onClick={() => setWalletView("google")}
          >
            Google
          </button>
        </div>

        <div className="card-preview" style={{ background: swatchHex }}>
          {strip.preview && !strip.removed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={strip.preview} alt="Banner" className="card-preview-strip" />
          )}

          {!showBack ? (
            <>
              <div className="card-preview-head">
                {showWideOnGoogle ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wideLogo.preview!} alt="Wide logo" className="card-preview-wide-logo" />
                ) : (
                  <>
                    {headerLogoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={headerLogoSrc} alt="Logo" className="card-preview-logo" />
                    ) : (
                      <div className="card-preview-logo card-preview-logo--placeholder">
                        {(name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{name || "Your Business"}</span>
                  </>
                )}
              </div>

              <div className="card-preview-title">{programName || name || "Your Program"}</div>

              <div className="card-preview-fields-row">
                <div className="card-preview-field">
                  <span className="card-preview-label">POINTS</span>
                  <span>3</span>
                </div>
                <div className="card-preview-field card-preview-field--right">
                  <span className="card-preview-label">PROGRESS</span>
                </div>
              </div>
              <div className="card-preview-circles-row">
                <span className="card-preview-circles">{renderPunchCircles(3, rewardThreshold || 5)}</span>
              </div>

              <div className="card-preview-qr-wrap">
                {mockQr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mockQr} alt="QR code" className="card-preview-qr" />
                )}
                {walletView === "google" && <div className="card-preview-caption">PREVIEW-0000</div>}
              </div>

              {walletView === "apple" && (
                <div className="card-preview-footer">
                  <span className="card-preview-footer-icon" />
                  <span>{name || "Your Business"}</span>
                </div>
              )}

              {thumbnail.preview && !thumbnail.removed && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnail.preview} alt="Thumbnail" className="card-preview-thumbnail" />
              )}
            </>
          ) : (
            <div className="card-preview-back">
              <div className="card-preview-back-field">
                <span className="card-preview-label">Notifications</span>
                <span>(blank until a reward fires)</span>
              </div>
              <div className="card-preview-back-field">
                <span className="card-preview-label">Next reward</span>
                <span>{renderNextRewardMessage(3, rewardThreshold, rewardDescription)}</span>
              </div>
            </div>
          )}
        </div>

        <button type="button" className="btn ghost sm card-preview-flip" onClick={() => setShowBack(!showBack)}>
          {showBack ? "Show front" : "Show back of card"}
        </button>
      </div>
    </div>
  );
}
