import { createBusiness } from "./actions";

const COLOR_PRESETS = [
  { value: "dark", label: "Dark" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
];

export default function OnboardingPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="auth-page">
      <div className="wrap auth-wrap">
        <div className="auth-card auth-card--wide">
          <h1>Set up your program</h1>
          <p className="auth-sub">This takes about a minute. You can change any of this later.</p>

          <form action={createBusiness} className="auth-form">
            {searchParams.error && <p className="auth-error">{searchParams.error}</p>}

            <label>
              Business name
              <input type="text" name="name" required placeholder="Café Lumen" />
            </label>

            <label>
              Sign-up page URL
              <div className="slug-input">
                <span>repass.app/join/</span>
                <input type="text" name="slug" placeholder="cafe-lumen" pattern="[a-z0-9-]*" />
              </div>
            </label>

            <label>
              Card color
              <select name="colorPreset" defaultValue="dark">
                {COLOR_PRESETS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label>
                Points per visit
                <input type="number" name="pointsPerAction" defaultValue={1} min={1} required />
              </label>
              <label>
                Points for a reward
                <input type="number" name="rewardThreshold" defaultValue={10} min={1} required />
              </label>
            </div>

            <label>
              What the reward is
              <input type="text" name="rewardDescription" defaultValue="A free item" required />
            </label>

            <button type="submit" className="btn">
              Continue to billing
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
