"use client";

import { useRef, useState } from "react";
import { updateSettings } from "./actions";

const COLOR_PRESETS: { value: string; label: string; hex: string }[] = [
  { value: "dark", label: "Dark", hex: "#18181b" },
  { value: "blue", label: "Blue", hex: "#1d4ed8" },
  { value: "green", label: "Green", hex: "#15803d" },
  { value: "red", label: "Red", hex: "#b91c1c" },
  { value: "purple", label: "Purple", hex: "#6d28d9" },
  { value: "orange", label: "Orange", hex: "#c2410c" },
];

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
  const [colorPreset, setColorPreset] = useState(initial.colorPreset);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const swatch = COLOR_PRESETS.find((c) => c.value === colorPreset) || COLOR_PRESETS[0];

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
          <select name="colorPreset" value={colorPreset} onChange={(e) => setColorPreset(e.target.value)}>
            {COLOR_PRESETS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

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
        <div className="card-preview" style={{ background: swatch.hex }}>
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
        </div>
      </div>
    </div>
  );
}
