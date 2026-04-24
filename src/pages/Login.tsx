// src/pages/Login.tsx
import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import type { User } from "../data/authStore";
import { colors, radius, spacing, typography } from "../ui/tokens";

interface Props {
  onLogin: (user: User) => void;
  onGoRegister: () => void;
  onBack: () => void;
}

export default function Login({ onLogin, onGoRegister, onBack }: Props) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length >= 4 && !loading,
    [email, password, loading],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const e1 = email.trim();
    if (!e1) return setError("Please enter your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e1)) return setError("Please enter a valid email address.");
    if (password.trim().length < 4) return setError("Password must be at least 4 characters.");

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: e1,
      password: password.trim(),
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      await supabase
        .from("profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.user.id);

      onLogin({ id: data.user.id, email: data.user.email ?? "", role: "engineer" });
    }
  }

  async function handleForgotPassword() {
    const e1 = email.trim();
    if (!e1) return setError("Enter your email above first, then click Forgot password.");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(e1);
    if (resetError) {
      setError(resetError.message);
    } else {
      setError("");
      alert(`Password reset email sent to ${e1}`);
    }
  }

  return (
    <div style={shell}>
      <div style={bgGrid} aria-hidden="true" />
      <div style={bgGlow} aria-hidden="true" />
      <button type="button" onClick={onBack} style={backBtn}>← Back to website</button>
      <div style={card}>
        <header style={headerRow}>
          <div style={logoBox} aria-hidden="true">
            <span style={{ fontSize: 20 }}>✈</span>
          </div>
          <div>
            <div style={titleStyle}>AeroScan Pro</div>
            <div style={subtitleStyle}>Ground Station Console · Sign in to continue</div>
          </div>
        </header>
        <form onSubmit={submit} style={{ marginTop: spacing.xl }}>
          <Field label="Email" value={email} onChange={setEmail} placeholder="yourname@aero.com" type="email" autoComplete="email" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" autoComplete="current-password" />
          <div style={rowBetween}>
            <span />
            <button type="button" onClick={handleForgotPassword} style={linkBtn}>Forgot password?</button>
          </div>
          {error ? <div style={errorBox}>{error}</div> : null}
          <button type="submit" disabled={!canSubmit} style={primaryBtn}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div style={footerRow}>
            Don&apos;t have an account?&nbsp;
            <button type="button" onClick={onGoRegister} style={linkBtn}>Create one</button>
          </div>
          <div style={metaRow}>
            <span style={metaChip}>Secure Session</span>
            <span style={metaChip}>Telemetry Ready</span>
            <span style={metaChip}>Offline-safe</span>
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
      <div style={labelStyle}>{label}</div>
      <input type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const shell: React.CSSProperties = { minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 40px", background: colors.background, position: "relative", overflow: "hidden", boxSizing: "border-box" };
const bgGrid: React.CSSProperties = { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px", opacity: 0.18 };
const bgGlow: React.CSSProperties = { position: "absolute", width: 900, height: 900, borderRadius: 999, background: "radial-gradient(circle at center, rgba(59,130,246,0.16), rgba(59,130,246,0.04), transparent 60%)", filter: "blur(10px)", top: "50%", left: "50%", transform: "translate(-50%, -55%)", pointerEvents: "none" };
const backBtn: React.CSSProperties = { position: "absolute", top: 20, left: 24, padding: "7px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.04)", color: colors.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: typography.fontFamily, zIndex: 10 };
const card: React.CSSProperties = { width: "min(420px, 92vw)", borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.surface, boxShadow: "0 24px 60px rgba(0,0,0,0.55)", padding: spacing.xl, position: "relative" };
const headerRow: React.CSSProperties = { display: "flex", gap: spacing.md, alignItems: "center" };
const logoBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center" };
const titleStyle: React.CSSProperties    = { fontSize: 18, fontWeight: 700, color: colors.textPrimary, fontFamily: typography.fontFamily };
const subtitleStyle: React.CSSProperties = { marginTop: 4, fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily };
const labelStyle: React.CSSProperties    = { fontSize: 12, color: colors.textSecondary, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary, padding: "0 12px", fontSize: 14, outline: "none", fontFamily: typography.fontFamily, boxSizing: "border-box" };
const rowBetween: React.CSSProperties = { display: "flex", justifyContent: "flex-end", marginTop: 2 };
const linkBtn: React.CSSProperties = { border: "none", background: "transparent", color: "rgba(59,130,246,0.95)", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: typography.fontFamily };
const errorBox: React.CSSProperties = { marginTop: spacing.md, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,92,115,0.32)", background: "rgba(255,92,115,0.10)", color: "rgba(255,255,255,0.92)", fontSize: 13 };
const primaryBtn: React.CSSProperties = { width: "100%", height: 42, marginTop: spacing.md, borderRadius: 12, border: "1px solid rgba(59,130,246,0.40)", background: "rgba(59,130,246,0.22)", color: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: typography.fontFamily };
const footerRow: React.CSSProperties = { marginTop: spacing.md, textAlign: "center", fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily };
const metaRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: spacing.lg };
const metaChip: React.CSSProperties = { padding: "6px 10px", borderRadius: 999, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.05)", color: colors.textSecondary, fontSize: 12, fontFamily: typography.monoFamily };
const css = `input:focus { border-color: rgba(59,130,246,0.45) !important; box-shadow: 0 0 0 4px rgba(59,130,246,0.14); } button:disabled { opacity: 0.55; cursor: not-allowed; }`;
