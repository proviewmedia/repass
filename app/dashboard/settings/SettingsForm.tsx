"use client";

import { useRef, useState } from "react";
import { updateSettings } from "./actions";
import { renderPunchCircles } from "@/lib/wallet";

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
    pointsPerAction: number;
    rewardThreshold: number;
    rewardDescription: string;
  };
  error?: string;
  saved?: boolean;
}

export default function SettingsForm({ initial, error, saved }: Props) {
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
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setRemoveLogo(false);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function onRemoveLogo() {
    setRemoveLogo(true);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

        <p className="auth-note">
          Custom colors and logos are a premium wallet-provider feature. If this stops applying to new or updated
          cards, contact support.
        </p>

        <label>
          Logo
          <input
            type="file"
            name="logo"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onLogoChange}
          />
        </label>
        {logoPreview && !removeLogo && (
          <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={onRemoveLogo}>
            Remove current logo
          </button>
        )}
        {removeLogo && <input type="hidden" name="removeLogo" value="1" />}

        <div className="form-row">
          <label>
            Points per visit
            <input type="number" name="pointsPerAction" defaultValue={initial.pointsPerAction} min={1} required />
          </label>
          <label>
            Points for a reward
            <input type="number" name="rewardThreshold" defaultValue={initial.rewardThreshold} min={1} required />
          </label>
        </div>

        <label>
          What the reward is
          <input type="text" name="rewardDescription" defaultValue={initial.rewardDescription} required />
        </label>

        <button type="submit" className="btn">
          Save changes
        </button>
      </form>

      <div className="card-preview-wrap">
        <span className="auth-sub" style={{ marginBottom: 10, display: "block" }}>
          Live preview (approximate — exact rendering may vary slightly by wallet app)
        </span>
        <div className="card-preview" style={{ background: swatchHex }}>
          <div className="card-preview-head">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="card-preview-logo" />
            ) : (
              <div className="card-preview-logo card-preview-logo--placeholder">
                {(name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <span>{name || "Your Business"}</span>
          </div>
          <div className="card-preview-title">{programName || name || "Your Program"}</div>
          <div className="card-preview-points">
            <span className="card-preview-label">POINTS</span>
            <span>3</span>
          </div>
          <div className="card-preview-points">
            <span className="card-preview-label">PROGRESS</span>
            <span className="card-preview-circles">{renderPunchCircles(3, initial.rewardThreshold || 5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
