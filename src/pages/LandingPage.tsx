// src/pages/LandingPage.tsx
import React, { useState } from "react";
import { colors, radius, spacing, typography } from "../ui/tokens";

interface Props {
  onSignIn: () => void;
}

export default function LandingPage({ onSignIn }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={shell}>
      {/* ── Background decorations ── */}
      <div style={bgGrid} aria-hidden />
      <div style={bgGlow1} aria-hidden />
      <div style={bgGlow2} aria-hidden />

      {/* ══════════════════════════════════════════════
          NAVBAR — full width sticky
      ══════════════════════════════════════════════ */}
      <nav style={navbar}>
        <div style={navInner}>
          <div style={navBrand}>
            <div style={brandIcon}>✈</div>
            <span style={brandName}>AeroScan Pro</span>
          </div>

          <div style={navLinks} className="nav-links">
            <a href="#features" style={navLink}>Features</a>
            <a href="#how-it-works" style={navLink}>How It Works</a>
            <a href="#technology" style={navLink}>Technology</a>
            <a href="#team" style={navLink}>Team</a>
          </div>

          <button onClick={onSignIn} style={navCta}>
            Sign In →
          </button>

          <button
            style={hamburger}
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div style={mobileMenu}>
            <a href="#features" style={mobileLink} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" style={mobileLink} onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#technology" style={mobileLink} onClick={() => setMenuOpen(false)}>Technology</a>
            <a href="#team" style={mobileLink} onClick={() => setMenuOpen(false)}>Team</a>
            <div style={{ padding: "0 4px 4px" }}>
              <button onClick={onSignIn} style={{ ...navCta, width: "100%", justifyContent: "center" }}>
                Sign In →
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════
          HERO — full-width row, centered content
      ══════════════════════════════════════════════ */}
      <div style={heroOuter}>
        <div style={heroInner}>
          <div style={heroPill}>
            <span style={dot} />
            Now supporting full fleet management across multiple aircraft
          </div>

          <h1 style={heroTitle}>
            AI-Powered Drone Inspection<br />
            <span style={{ color: colors.primary }}>for Modern Aviation</span>
          </h1>

          <p style={heroSub}>
            AeroScan Pro automates aircraft surface inspection using computer vision and autonomous drones.
            Detect cracks, dents, and corrosion in under an hour — with full history tracking across your entire fleet.
          </p>

          <div style={heroCtas}>
            <button onClick={onSignIn} style={ctaPrimary}>
              Launch Ground Station
            </button>
            <a href="#how-it-works" style={ctaSecondary}>
              See How It Works
            </a>
          </div>

          <div style={heroStats} className="hero-stats">
            <HeroStat value="&lt; 1hr" label="Inspection Time" />
            <div style={statDivider} className="stat-divider" />
            <HeroStat value="85–87%" label="Detection Accuracy" />
            <div style={statDivider} className="stat-divider" />
            <HeroStat value="∞" label="Aircraft Supported" />
          </div>

          {/* HUD mockup */}
          <div style={hudCard}>
            <div style={hudBar}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...dot, background: colors.danger }} />
                <span style={{ ...dot, background: colors.warning }} />
                <span style={{ ...dot, background: colors.success }} />
              </div>
              <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 11 }}>AeroScan — Live Ground Station</span>
              <div style={{ width: 50 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "14px 16px" }}>
              <HudCell label="Status" value="Scanning" ok />
              <HudCell label="Battery" value="87%" />
              <HudCell label="Signal" value="94%" ok />
              <HudCell label="Altitude" value="14.2 m" />
              <HudCell label="Speed" value="3.8 m/s" />
              <HudCell label="Detections" value="3 found" warn />
            </div>
            <div style={{
              margin: "0 16px 14px",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(255,92,115,0.10)",
              border: "1px solid rgba(255,92,115,0.28)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
            }}>
              <span style={{ ...dot, background: colors.danger, flexShrink: 0 }} />
              <span style={{ color: colors.danger, fontWeight: 700 }}>HIGH</span>
              <span style={{ color: "rgba(255,255,255,0.70)" }}>Crack · Forward fuselage · 91% confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <div id="features" style={bandLight}>
        <div style={inner}>
          <SectionTag label="Features" />
          <h2 style={sectionTitle}>Everything a maintenance team needs</h2>
          <p style={sectionSub}>
            From live drone telemetry to exportable inspection reports, AeroScan Pro covers the entire workflow.
          </p>
          <div className="feature-grid" style={featureGrid}>
            <FeatureCard icon="◉" title="Live Mission Tracker" accent={colors.primary}
              desc="Monitor your drone in real time. View battery, altitude, speed, GPS coordinates, and live defect detections as the drone scans the aircraft surface." />
            <FeatureCard icon="⊡" title="Frame-by-Frame Detection" accent={colors.success}
              desc="Step through every camera frame captured during a mission. Each frame is annotated with bounding boxes, 3D coordinates, confidence scores, and defect classification." />
            <FeatureCard icon="≡" title="Results Review & Export" accent={colors.warning}
              desc="Validate findings, add engineer notes, mark items resolved, flag for manual inspection, and export a complete report as JSON or CSV." />
            <FeatureCard icon="✈" title="Multi-Aircraft Fleet" accent="#a78bfa"
              desc="Manage every aircraft in your fleet from one dashboard. Each aircraft maintains its own inspection history, status, and schedule independently." />
            <FeatureCard icon="⏱" title="Full Inspection History" accent={colors.danger}
              desc="Every past inspection is stored with its findings, engineer, date, and duration. Review the complete maintenance record for any aircraft at any time." />
            <FeatureCard icon="⚠" title="Zone Recurrence Analysis" accent="#f97316"
              desc="Automatically flags when the same structural zone is damaged across multiple inspections — giving engineers critical context about chronic problem areas." />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <div id="how-it-works" style={bandDark}>
        <div style={inner}>
          <SectionTag label="Process" />
          <h2 style={sectionTitle}>From hangar to report in three steps</h2>
          <p style={sectionSub}>
            Our streamlined workflow replaces hours of manual inspection with a fully automated, data-driven process.
          </p>
          <div className="steps-row" style={stepsRow}>
            <Step num="01" title="Deploy the Drone"
              desc="The autonomous drone launches and follows a pre-programmed flight path around the aircraft, capturing high-resolution imagery at 12 inspection waypoints." />
            <div style={stepArrow} className="step-arrow">→</div>
            <Step num="02" title="AI Detects Anomalies"
              desc="Captured images are processed by the YOLOv11 model. Cracks, dents, and corrosion are classified with bounding boxes, confidence scores, and zone labels." />
            <div style={stepArrow} className="step-arrow">→</div>
            <Step num="03" title="Review & Export Report"
              desc="The maintenance engineer reviews flagged findings in the Ground Station Console, adds notes, validates each finding, and exports a complete inspection report." />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TECHNOLOGY
      ══════════════════════════════════════════════ */}
      <div id="technology" style={bandLight}>
        <div style={inner}>
          <SectionTag label="Technology" />
          <h2 style={sectionTitle}>Built on proven, cutting-edge technology</h2>
          <p style={sectionSub}>
            AeroScan Pro integrates hardware and software components chosen for reliability, accuracy, and real-world airport environments.
          </p>
          <div className="tech-grid" style={techGrid}>
            <TechCard category="AI & Vision" accent={colors.primary}
              items={["YOLOv11 Object Detection", "Custom-trained defect model", "Real-time frame analysis", "Bounding box annotation"]} />
            <TechCard category="Drone Hardware" accent={colors.success}
              items={["Custom-built drone platform", "High-resolution cameras", "Geofencing & standoff control", "Autonomous flight path"]} />
            <TechCard category="Ground Station" accent={colors.warning}
              items={["React 19 + TypeScript", "Real-time telemetry stream", "WebSocket data pipeline", "JSON / CSV report export"]} />
            <TechCard category="Safety & Compliance" accent={colors.danger}
              items={["Autonomous return-to-home", "Battery & signal failsafes", "Airport environment rated", "Full audit trail logging"]} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PROBLEM vs SOLUTION
      ══════════════════════════════════════════════ */}
      <div style={bandDark}>
        <div style={inner}>
          <SectionTag label="Why AeroScan Pro" />
          <h2 style={sectionTitle}>The industry needed a better way</h2>
          <div className="vs-grid" style={vsGrid}>
            <VSCard title="Traditional Inspection" bad items={[
              "4–8 hours per aircraft",
              "Requires scaffolding & mirrors",
              "Human error-prone",
              "No historical comparison",
              "Expensive labor costs",
              "Single aircraft at a time",
            ]} />
            <VSCard title="AeroScan Pro" items={[
              "Under 1 hour per aircraft",
              "Fully autonomous drone flight",
              "AI-verified with confidence scores",
              "Full recurrence history per zone",
              "Significant cost reduction",
              "Entire fleet managed centrally",
            ]} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TEAM
      ══════════════════════════════════════════════ */}
      <div id="team" style={bandLight}>
        <div style={inner}>
          <SectionTag label="Team" />
          <h2 style={sectionTitle}>Built by engineers, for engineers</h2>
          <p style={sectionSub}>
            AeroScan Pro is a senior design project by four Computer Science & Engineering students at the American University of Sharjah.
          </p>
          <div className="team-grid" style={teamGrid}>
            <TeamCard name="Abdullah Alshetiwi" id="b00096197" role="Systems & Hardware" />
            <TeamCard name="Abdalkareem Alsaid" id="b00096588" role="ML & Computer Vision" />
            <TeamCard name="Hashem Elsaid" id="b00094816" role="Software & UI" />
            <TeamCard name="Mohammad Mahmoud" id="b00094842" role="Integration & Testing" />
          </div>
          <div style={advisorCard}>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>Project Advisor</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Dr. Mohamed Hassan</div>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              Department of Computer Science and Engineering · American University of Sharjah
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════ */}
      <div style={ctaBand}>
        <div style={{ ...inner, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={bgGlow3} aria-hidden />
          <h2 style={{ ...sectionTitle, marginBottom: 12 }}>Ready to transform your maintenance workflow?</h2>
          <p style={{ ...sectionSub, marginBottom: 36 }}>
            Sign in to the AeroScan Pro Ground Station Console and start your first drone inspection today.
          </p>
          <button onClick={onSignIn} style={{ ...ctaPrimary, fontSize: 15, padding: "14px 36px" }}>
            Launch Ground Station Console →
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer style={footerBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={brandIcon}>✈</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>AeroScan Pro</span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textAlign: "center" as const }}>
          CSE 491 · Group 7 · American University of Sharjah · Spring 2026
        </span>
        <button onClick={onSignIn} style={{ ...navCta, fontSize: 12, padding: "6px 14px" }}>
          Sign In
        </button>
      </footer>

      <style>{landingCss}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "4px 0" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: colors.textPrimary, lineHeight: 1 }}
        dangerouslySetInnerHTML={{ __html: value }} />
      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 5 }}>{label}</div>
    </div>
  );
}

function HudCell({ label, value, ok, warn }: { label: string; value: string; ok?: boolean; warn?: boolean }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: ok ? colors.success : warn ? colors.warning : colors.textPrimary }}>
        {value}
      </div>
    </div>
  );
}

function SectionTag({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
      <span style={{
        padding: "5px 14px", borderRadius: 999,
        background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.28)",
        color: colors.primary, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px",
        textTransform: "uppercase" as const,
      }}>
        {label}
      </span>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div className="feature-card" style={{
      padding: spacing.lg, borderRadius: radius.lg,
      border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.025)",
      transition: "border-color 0.2s, transform 0.2s",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${accent}18`, border: `1px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, marginBottom: 16, color: accent,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ flex: 1, minWidth: 200, textAlign: "center", padding: "0 12px" }}>
      <div style={{
        display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: "1.5px",
        color: colors.primary, background: "rgba(59,130,246,0.12)",
        border: "1px solid rgba(59,130,246,0.25)", borderRadius: 999,
        padding: "3px 10px", marginBottom: 12,
      }}>
        STEP {num}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.65, maxWidth: 240, margin: "0 auto" }}>{desc}</div>
    </div>
  );
}

function TechCard({ category, items, accent }: { category: string; items: string[]; accent: string }) {
  return (
    <div style={{
      padding: spacing.lg, borderRadius: radius.lg,
      border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.025)",
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", color: accent,
        textTransform: "uppercase" as const, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ width: 4, height: 16, background: accent, borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
        {category}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.textSecondary }}>
            <span style={{ color: accent, fontSize: 10, flexShrink: 0 }}>◆</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VSCard({ title, items, bad }: { title: string; items: string[]; bad?: boolean }) {
  return (
    <div style={{
      padding: spacing.lg, borderRadius: radius.lg,
      border: bad ? "1px solid rgba(255,92,115,0.20)" : "1px solid rgba(61,220,151,0.25)",
      background: bad ? "rgba(255,92,115,0.04)" : "rgba(61,220,151,0.04)",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: bad ? colors.danger : colors.success, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        {bad ? "✕" : "✓"} {title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: colors.textSecondary }}>
            <span style={{ color: bad ? colors.danger : colors.success, fontSize: 12, flexShrink: 0 }}>{bad ? "✕" : "✓"}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCard({ name, id, role }: { name: string; id: string; role: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      padding: spacing.lg, borderRadius: radius.lg,
      border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.025)",
      textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.30)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, fontWeight: 700, color: colors.primary, margin: "0 auto 14px",
      }}>
        {initials}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 12, color: colors.primary, marginBottom: 4 }}>{role}</div>
      <div style={{ fontSize: 11, color: colors.textSecondary, fontFamily: typography.monoFamily }}>{id}</div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shell: React.CSSProperties = {
  width: "100%",
  minHeight: "100vh",
  background: colors.background,
  color: colors.textPrimary,
  fontFamily: typography.fontFamily,
  position: "relative",
  overflowX: "hidden",
};

const bgGrid: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  pointerEvents: "none",
  zIndex: 0,
};

const bgGlow1: React.CSSProperties = {
  position: "fixed",
  width: "70vw",
  height: "50vh",
  borderRadius: 999,
  background: "radial-gradient(ellipse at center, rgba(59,130,246,0.12), transparent 70%)",
  top: 0,
  left: "50%",
  transform: "translateX(-50%)",
  pointerEvents: "none",
  zIndex: 0,
};

const bgGlow2: React.CSSProperties = {
  position: "fixed",
  width: "40vw",
  height: "40vw",
  borderRadius: 999,
  background: "radial-gradient(ellipse at center, rgba(61,220,151,0.06), transparent 70%)",
  bottom: "10%",
  right: "-5%",
  pointerEvents: "none",
  zIndex: 0,
};

const bgGlow3: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "radial-gradient(ellipse at center, rgba(59,130,246,0.10), transparent 70%)",
  pointerEvents: "none",
  zIndex: 0,
};

/* Full-width band wrappers */
const bandLight: React.CSSProperties = {
  width: "100%",
  position: "relative",
  zIndex: 1,
};

const bandDark: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.018)",
  borderTop: `1px solid ${colors.border}`,
  borderBottom: `1px solid ${colors.border}`,
  position: "relative",
  zIndex: 1,
};

const ctaBand: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.018)",
  borderTop: `1px solid ${colors.border}`,
  position: "relative",
  zIndex: 1,
  overflow: "hidden",
};

/* Centered content container */
const inner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "80px 24px",
};

const navbar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  width: "100%",
  background: "rgba(15,23,42,0.90)",
  backdropFilter: "blur(16px)",
  borderBottom: `1px solid ${colors.border}`,
  boxSizing: "border-box" as const,
};

const navInner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "0 24px",
  height: 60,
  display: "flex",
  alignItems: "center",
  gap: 24,
};

const navBrand: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexShrink: 0,
  textDecoration: "none",
};

const brandIcon: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "rgba(59,130,246,0.18)",
  border: "1px solid rgba(59,130,246,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
  flexShrink: 0,
};

const brandName: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: colors.textPrimary,
  letterSpacing: "0.2px",
};

const navLinks: React.CSSProperties = {
  display: "flex",
  gap: 4,
  flex: 1,
};

const navLink: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 13,
  color: colors.textSecondary,
  textDecoration: "none",
};

const navCta: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 10,
  border: "1px solid rgba(59,130,246,0.40)",
  background: "rgba(59,130,246,0.18)",
  color: colors.textPrimary,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: typography.fontFamily,
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
};

const hamburger: React.CSSProperties = {
  display: "none",
  background: "transparent",
  border: "none",
  color: colors.textPrimary,
  fontSize: 20,
  cursor: "pointer",
  padding: "4px 8px",
  marginLeft: "auto",
};

const mobileMenu: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "8px 12px 12px",
  borderTop: `1px solid ${colors.border}`,
  background: "rgba(15,23,42,0.98)",
};

const mobileLink: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 8,
  fontSize: 14,
  color: colors.textSecondary,
  textDecoration: "none",
  display: "block",
};

/* Hero */
const heroOuter: React.CSSProperties = {
  width: "100%",
  position: "relative",
  zIndex: 1,
};

const heroInner: React.CSSProperties = {
  maxWidth: 780,
  margin: "0 auto",
  padding: "96px 24px 80px",
  textAlign: "center",
};

const heroPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 16px",
  borderRadius: 999,
  background: "rgba(61,220,151,0.08)",
  border: "1px solid rgba(61,220,151,0.25)",
  color: colors.success,
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 28,
};

const heroTitle: React.CSSProperties = {
  margin: "0 0 24px",
  fontSize: "clamp(28px, 5vw, 52px)",
  fontWeight: 800,
  lineHeight: 1.18,
  color: colors.textPrimary,
  letterSpacing: "-0.5px",
};

const heroSub: React.CSSProperties = {
  margin: "0 auto 36px",
  fontSize: 16,
  color: colors.textSecondary,
  lineHeight: 1.7,
  maxWidth: 580,
};

const heroCtas: React.CSSProperties = {
  display: "flex",
  gap: 12,
  justifyContent: "center",
  flexWrap: "wrap",
  marginBottom: 52,
};

const ctaPrimary: React.CSSProperties = {
  padding: "13px 28px",
  borderRadius: 12,
  border: "1px solid rgba(59,130,246,0.45)",
  background: "rgba(59,130,246,0.22)",
  color: colors.textPrimary,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: typography.fontFamily,
};

const ctaSecondary: React.CSSProperties = {
  padding: "13px 28px",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textSecondary,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: typography.fontFamily,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const heroStats: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 28,
  padding: "22px 28px",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  marginBottom: 52,
  flexWrap: "wrap",
};

const statDivider: React.CSSProperties = {
  width: 1,
  height: 32,
  background: colors.border,
};

const hudCard: React.CSSProperties = {
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(15,23,42,0.85)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.50)",
  overflow: "hidden",
  maxWidth: 460,
  margin: "0 auto",
  textAlign: "left",
};

const hudBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  borderBottom: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "clamp(20px, 3.5vw, 32px)",
  fontWeight: 800,
  color: colors.textPrimary,
  textAlign: "center",
  letterSpacing: "-0.3px",
};

const sectionSub: React.CSSProperties = {
  margin: "0 auto 44px",
  maxWidth: 580,
  fontSize: 15,
  color: colors.textSecondary,
  lineHeight: 1.7,
  textAlign: "center",
};

const featureGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 18,
};

const stepsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: 0,
};

const stepArrow: React.CSSProperties = {
  fontSize: 22,
  color: "rgba(255,255,255,0.18)",
  flexShrink: 0,
  paddingTop: 44,
  width: 40,
  textAlign: "center" as const,
};

const techGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
};

const vsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  maxWidth: 860,
  margin: "44px auto 0",
};

const teamGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
  marginBottom: 20,
};

const advisorCard: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.025)",
  textAlign: "center",
};

const footerBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 32px",
  borderTop: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.02)",
  position: "relative",
  zIndex: 1,
  flexWrap: "wrap",
  gap: 12,
  width: "100%",
  boxSizing: "border-box" as const,
};

const dot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  display: "inline-block",
  background: colors.success,
  flexShrink: 0,
};

const landingCss = `
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  a[href^="#"]:hover { color: rgba(255,255,255,0.88) !important; background: rgba(255,255,255,0.06) !important; }

  .feature-card:hover {
    border-color: rgba(255,255,255,0.18) !important;
    transform: translateY(-3px);
  }

  @media (max-width: 1024px) {
    .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .tech-grid    { grid-template-columns: repeat(2, 1fr) !important; }
    .team-grid    { grid-template-columns: repeat(2, 1fr) !important; }
  }

  @media (max-width: 700px) {
    .feature-grid { grid-template-columns: 1fr !important; }
    .tech-grid    { grid-template-columns: 1fr !important; }
    .team-grid    { grid-template-columns: repeat(2, 1fr) !important; }
    .vs-grid      { grid-template-columns: 1fr !important; }

    .steps-row    { flex-direction: column !important; align-items: center !important; }
    .step-arrow   { transform: rotate(90deg); padding-top: 0 !important; width: auto !important; }

    .hero-stats   { gap: 16px !important; padding: 16px !important; }
    .stat-divider { width: 32px !important; height: 1px !important; }

    .nav-links  { display: none !important; }
    .hamburger  { display: block !important; }
  }

  @media (max-width: 480px) {
    .team-grid { grid-template-columns: 1fr !important; }
  }
`;
