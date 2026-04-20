// src/pages/Login.tsx
import React, { useMemo, useState } from "react";
import { colors, radius, spacing, typography } from "../ui/tokens";

type Role = "Pilot" | "Analyst" | "Admin";

type Props = {
    onLogin: () => void;
    onBack: () => void;
};

export default function Login({ onLogin, onBack }: Props) {
    const [role, setRole] = useState<Role>("Pilot");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [remember, setRemember] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const canSubmit = useMemo(() => {
        return email.trim().length > 0 && password.trim().length >= 4 && !loading;
    }, [email, password, loading]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const e1 = email.trim();
        const p1 = password.trim();

        if (!e1) return setError("Please enter your email.");
        if (!isValidEmail(e1)) return setError("Please enter a valid email address.");
        if (p1.length < 4) return setError("Password must be at least 4 characters.");

        setLoading(true);

        // Demo auth: keep local + simple
        window.setTimeout(() => {
            setLoading(false);
            onLogin();
        }, 700);
    }

    return (
        <div style={shell}>
            <div style={bgGrid} aria-hidden="true" />
            <div style={bgGlow} aria-hidden="true" />

            {/* Back to landing */}
            <button type="button" onClick={onBack} style={backBtn}>
                ← Back to website
            </button>

            <div style={card}>
                <header style={header}>
                    <div style={logo} aria-hidden="true">
                        <span style={{ fontSize: 20 }}>✈</span>
                    </div>

                    <div>
                        <div style={title}>AeroScan Pro</div>
                        <div style={subtitle}>Ground Station Console · Sign in to continue</div>
                    </div>
                </header>

                <div style={roleRow}>
                    <RolePill active={role === "Pilot"} label="Pilot" onClick={() => setRole("Pilot")} />
                    <RolePill active={role === "Analyst"} label="Analyst" onClick={() => setRole("Analyst")} />
                    <RolePill active={role === "Admin"} label="Admin" onClick={() => setRole("Admin")} />
                </div>

                <form onSubmit={submit} style={{ marginTop: spacing.lg }}>
                    <Field
                        label="Email"
                        value={email}
                        onChange={setEmail}
                        placeholder="ops@company.com"
                        type="email"
                        autoComplete="email"
                    />
                    <Field
                        label="Password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                    />

                    <div style={rowBetween}>
                        <label style={checkboxRow}>
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                style={checkbox}
                            />
                            <span style={{ color: colors.textSecondary, fontSize: 13 }}>Remember me</span>
                        </label>

                        <button
                            type="button"
                            onClick={() => alert("Demo: password reset flow")}
                            style={linkBtn}
                        >
                            Forgot password?
                        </button>
                    </div>

                    {error ? <div style={errorBox}>{error}</div> : null}

                    <button type="submit" disabled={!canSubmit} style={primaryBtn}>
                        {loading ? "Signing in..." : `Sign in as ${role}`}
                    </button>

                    <div style={meta}>
                        <span style={metaChip}>Secure Session</span>
                        <span style={metaChip}>Telemetry Ready</span>
                        <span style={metaChip}>Offline-safe</span>
                    </div>

                    {/* keep this variable used (no functional effect yet) */}
                    <input type="hidden" value={remember ? "1" : "0"} readOnly />
                </form>
            </div>

            <style>{css}</style>
        </div>
    );
}

function Field(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    type: string;
    autoComplete?: string;
}) {
    const { label, value, onChange, placeholder, type, autoComplete } = props;

    return (
        <div style={{ marginBottom: spacing.md }}>
            <div style={labelStyle}>{label}</div>
            <input
                type={type}
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={inputStyle}
            />
        </div>
    );
}

function RolePill(props: { active: boolean; label: string; onClick: () => void }) {
    const { active, label, onClick } = props;
    return (
        <button
            type="button"
            onClick={onClick}
            className={active ? "rolePill rolePillActive" : "rolePill"}
            style={{
                ...rolePillBase,
                borderColor: active ? "rgba(59,130,246,0.45)" : colors.border,
                background: active ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.05)",
                color: active ? colors.textPrimary : colors.textSecondary,
            }}
        >
            {label}
        </button>
    );
}

function isValidEmail(v: string) {
    // simple + reliable enough for UI validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const backBtn: React.CSSProperties = {
    position: "absolute",
    top: 20,
    left: 24,
    padding: "7px 14px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.04)",
    color: colors.textSecondary,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: typography.fontFamily,
    zIndex: 10,
};

const shell: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px 40px",
    background: colors.background,
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
};

const bgGrid: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage:
        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    opacity: 0.18,
    transform: "translateZ(0)",
};

const bgGlow: React.CSSProperties = {
    position: "absolute",
    width: 900,
    height: 900,
    borderRadius: 999,
    background:
        "radial-gradient(circle at center, rgba(59,130,246,0.16), rgba(59,130,246,0.04), transparent 60%)",
    filter: "blur(10px)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -55%)",
    pointerEvents: "none",
};

const card: React.CSSProperties = {
    width: "min(440px, 92vw)",
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
    padding: spacing.xl,
    position: "relative",
};

const header: React.CSSProperties = {
    display: "flex",
    gap: spacing.md,
    alignItems: "center",
};

const logo: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    display: "grid",
    placeItems: "center",
};

const title: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
};

const subtitle: React.CSSProperties = {
    marginTop: 4,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
};

const roleRow: React.CSSProperties = {
    marginTop: spacing.lg,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: spacing.sm,
};

const rolePillBase: React.CSSProperties = {
    height: 38,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    fontFamily: typography.fontFamily,
};

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.background,
    color: colors.textPrimary,
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
    fontFamily: typography.fontFamily,
};

const rowBetween: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 2,
};

const checkboxRow: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
};

const checkbox: React.CSSProperties = {
    width: 16,
    height: 16,
    accentColor: colors.primary,
};

const linkBtn: React.CSSProperties = {
    border: "none",
    background: "transparent",
    color: "rgba(59,130,246,0.95)",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    fontFamily: typography.fontFamily,
};

const errorBox: React.CSSProperties = {
    marginTop: spacing.md,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,92,115,0.32)",
    background: "rgba(255,92,115,0.10)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
    width: "100%",
    height: 42,
    marginTop: spacing.md,
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.40)",
    background: "rgba(59,130,246,0.22)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: typography.weight.bold,
    fontFamily: typography.fontFamily,
};

const meta: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: spacing.lg,
};

const metaChip: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.05)",
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.monoFamily,
};

const css = `
  .rolePill { transition: transform 140ms ease, background 160ms ease, border-color 160ms ease; }
  .rolePill:hover { transform: translateY(-1px); }
  .rolePill:active { transform: translateY(0px) scale(0.99); }

  input:focus {
    border-color: rgba(59,130,246,0.45) !important;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.14);
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;