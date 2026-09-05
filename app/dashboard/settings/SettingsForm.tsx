"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { updateSettings, previewCard } from "./actions";
import { renderPunchCircles, renderNextRewardMessage } from "@/lib/wallet";

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
  return (
    <div className="image-field">
      <label>
        {label}
        <input
          type="file"
          name={fieldName}
          ref={field.inputRef}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={field.onChange}
        />
      </label>
      <span className="auth-sub image-field-hint">{hint}</span>
      {field.preview && !field.removed && (
        <button type="button" className="btn ghost sm" onClick={field.onRemove}>
          Remove
        </button>
      )}
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

  function onColorSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "custom") {
      setColorMode("custom");
    } else {
      setColorMode("preset");
      setColorPreset(e.target.value);
    }
  }

  const showWideOnGoogle = walletView === "google" && wideLogo.preview && !wideLogo.removed;
  const headerLogoSrc = walletView === "apple" ? logo.preview || wideLogo.preview : logo.preview;

  return (
    <div className="settings-layout">
      <form action={updateSettings} className="auth-form" encType="multipart/form-data">
        {error && <p className="auth-error">{error}</p>}
        {saved && <p className="auth-note">Saved — updated cards are pushing out to customers now.</p>}

        <label>
          Business name
          <input type="text" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Program name (shown on the card)
          <input
            type="text"
            name="programName"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder={name}
          />
        </label>

        <label>
          Card color
          <select
            name={colorMode === "preset" ? "colorPreset" : undefined}
            value={colorMode === "custom" ? "custom" : colorPreset}
            onChange={onColorSelectChange}
          >
            {COLOR_PRESETS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
            <option value="custom">Custom color…</option>
          </select>
        </label>

        {colorMode === "custom" && (
          <label>
            Custom color
            <input
              type="color"
              name="colorPreset"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
          </label>
        )}

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

        <label className="checkbox-label">
          <input type="checkbox" name="allowSharing" value="1" defaultChecked={initial.allowSharing} />
          Let customers share this card with others
        </label>

        <div className="form-row">
          <label>
            Points per visit
            <input type="number" name="pointsPerAction" defaultValue={initial.pointsPerAction} min={1} required />
          </label>
          <label>
            Points for a reward
            <input
              type="number"
              name="rewardThreshold"
              value={rewardThreshold}
              onChange={(e) => setRewardThreshold(parseInt(e.target.value, 10) || 1)}
              min={1}
              required
            />
          </label>
        </div>

        <label>
          What the reward is
          <input
            type="text"
            name="rewardDescription"
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            required
          />
        </label>

        <div className="settings-actions">
          <button type="submit" className="btn">
            Save changes
          </button>
          <button type="submit" formAction={previewCard} className="btn ghost">
            Preview on your phone
          </button>
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
                  <span className="card-preview-circles">{renderPunchCircles(3, rewardThreshold || 5)}</span>
                </div>
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
