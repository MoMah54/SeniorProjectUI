// src/pages/Register.tsx
import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import type { User, UserRole } from "../data/authStore";
import { colors, radius, spacing, typography } from "../ui/tokens";

interface Props {
  onRegistered: (user: User) => void;
  onGoLogin: () => void;
  onBack: () => void;
}

const ROLES: { role: UserRole; abbr: string; title: string; desc: string }[] = [
  { role: "Pilot", abbr: "PL", title: "Drone Pilot", desc: "Operate inspection drones and conduct aircraft surface surveys" },
  { role: "Analyst", abbr: "AN", title: "Inspection Analyst", desc: "Review AI findings, analyse reports and export inspection data" },
  { role: "Fleet Manager", abbr: "FM", title: "Fleet Manager", desc: "Oversee the full fleet, all missions and staff activities" },
];

export default function Register({ onRegistered, onGoLogin, onBack }: Props) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [role, setRole]         = useState<UserRole>("Pilot");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const canSubmit = useMemo(
    () => name.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && !loading,
    [name, email, password, loading],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);

    // 1. Create auth user in Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setLoading(false);
      return setError(signUpError.message);
    }

    if (data.user) {
      // 2. Update the profile row with full_name and role
      await supabase
        .from("profiles")
        .update({ full_name: name.trim(), role })
        .eq("id", data.user.id);

      setLoading(false);
      onRegistered({ id: data.user.id, email: data.user.email ?? "", name: name.trim(), role, joinedAt: data.user.created_at ?? new Date().toISOString() });
    }
  }

  return (
    <div style={shell}>
      <div style={bgGrid} aria-hidden="true" />
      <div style={bgGlow} aria-hidden="true" />
      <button type="button" onClick={onBack} style={backBtn}>← Back to website</button>
      <div style={card}>
        <header style={headerRow}>
          <div style={logoBox} aria-hidden="true"><span style={{ fontSize: 20 }}>✈</span></div>
          <div>
            <div style={titleStyle}>Create your account</div>
            <div style={subtitleStyle}>AeroScan Pro · Access restricted to @aero.com staff</div>
          </div>
        </header>

        <div style={{ marginTop: spacing.lg }}>
          <div style={sectionLabel}>Select your role</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {ROLES.map(({ role: r, abbr, title, desc }) => {
              const active = role === r;
              return (
                <button key={r} type="button" onClick={() => setRole(r)} style={{ ...roleBtnBase, borderColor: active ? "rgba(59,130,246,0.50)" : colors.border, background: active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)", fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: active ? colors.primary : colors.textSecondary, fontFamily: "monospace" }}>{abbr}</span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? colors.textPrimary : colors.textSecondary }}>{title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: active ? "2px solid rgba(59,130,246,0.80)" : `2px solid ${colors.border}`, background: active ? "rgba(59,130,246,0.80)" : "transparent", flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} style={{ marginTop: spacing.lg }}>
          <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Ahmed Al-Rashidi" type="text" autoComplete="name" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="yourname@aero.com" type="email" autoComplete="email" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 6 chars" type="password" autoComplete="new-password" />
            <Field label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Repeat password" type="password" autoComplete="new-password" />
          </div>
          {error ? <div style={errorBox}>{error}</div> : null}
          <button type="submit" disabled={!canSubmit} style={primaryBtn}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
          <div style={footer}>
            Already have an account?&nbsp;
            <button type="button" onClick={onGoLogin} style={linkBtn}>Sign in</button>
          </div>
        </form>
      </div>
      <style>{css}</style>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type: string; autoComplete?: string; }) {
  const { label, value, onChange, placeholder, type, autoComplete } = props;
  return (
    <div style={{ marginBottom: spacing.md }}>
      <div style={sectionLabel}>{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} style={inputStyle} />
    </div>
  );
}

const shell: React.CSSProperties = { minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 40px", background: colors.background, position: "relative", overflow: "hidden", boxSizing: "border-box" };
const bgGrid: React.CSSProperties = { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px", opacity: 0.18 };
const bgGlow: React.CSSProperties = { position: "absolute", width: 900, height: 900, borderRadius: 999, background: "radial-gradient(circle at center, rgba(59,130,246,0.16), rgba(59,130,246,0.04), transparent 60%)", filter: "blur(10px)", top: "50%", left: "50%", transform: "translate(-50%, -55%)", pointerEvents: "none" };
const backBtn: React.CSSProperties = { position: "absolute", top: 20, left: 24, padding: "7px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.04)", color: colors.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: typography.fontFamily, zIndex: 10 };
const card: React.CSSProperties = { width: "min(500px, 94vw)", borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.surface, boxShadow: "0 24px 60px rgba(0,0,0,0.55)", padding: spacing.xl, position: "relative" };
const headerRow: React.CSSProperties = { display: "flex", gap: spacing.md, alignItems: "center" };
const logoBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", flexShrink: 0 };
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: colors.textPrimary, fontFamily: typography.fontFamily };
const subtitleStyle: React.CSSProperties = { marginTop: 4, fontSize: 12, color: colors.textSecondary, fontFamily: typography.fontFamily };
const sectionLabel: React.CSSProperties = { fontSize: 12, color: colors.textSecondary, marginBottom: 6 };
const roleBtnBase: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${colors.border}`, cursor: "pointer", fontFamily: typography.fontFamily, transition: "border-color 0.15s, background 0.15s" };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary, padding: "0 12px", fontSize: 14, outline: "none", fontFamily: typography.fontFamily, boxSizing: "border-box" };
const errorBox: React.CSSProperties = { marginTop: spacing.md, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,92,115,0.32)", background: "rgba(255,92,115,0.10)", color: "rgba(255,255,255,0.92)", fontSize: 13 };
const primaryBtn: React.CSSProperties = { width: "100%", height: 42, marginTop: spacing.md, borderRadius: 12, border: "1px solid rgba(59,130,246,0.40)", background: "rgba(59,130,246,0.22)", color: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: typography.fontFamily };
const footer: React.CSSProperties = { marginTop: spacing.md, textAlign: "center", fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily };
const linkBtn: React.CSSProperties = { border: "none", background: "transparent", color: "rgba(59,130,246,0.95)", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: typography.fontFamily };
const css = `input:focus { border-color: rgba(59,130,246,0.45) !important; box-shadow: 0 0 0 4px rgba(59,130,246,0.14); } button:disabled { opacity: 0.55; cursor: not-allowed; }`;
