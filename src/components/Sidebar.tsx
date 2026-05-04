// src/components/Sidebar.tsx
import type { Aircraft } from "../data/fleetStore";
import type { User } from "../data/authStore";
import { colors, radius, typography } from "../ui/tokens";

// ── Pages ─────────────────────────────────────────────────────────────────────
export type AppPage = "fleet" | "briefing" | "live" | "detection" | "review" | "history" | "report";

interface NavItem {
  page: AppPage;
  label: string;
  icon: string;
  description: string;
}

const ALL_NAV: NavItem[] = [
  { page: "fleet", label: "Fleet Overview", icon: "✈", description: "All aircraft" },
  { page: "live", label: "Live Tracker", icon: "◉", description: "Flight & telemetry" },
  { page: "detection", label: "Detection View", icon: "⊡", description: "Frame inspection" },
  { page: "review", label: "Results Review", icon: "≡", description: "Findings & export" },
  { page: "history", label: "Flight History", icon: "⏱", description: "Inspection database" },
];

// Pages each role can navigate to directly via the sidebar
const ROLE_PAGES: Record<User["role"], AppPage[]> = {
  "Pilot": ["fleet", "live"],
  "Analyst": ["fleet", "detection", "review", "history"],
  "Fleet Manager": ["fleet", "live", "detection", "review", "history"],
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  current: AppPage;
  onNavigate: (p: AppPage) => void;
  selectedAircraft: Aircraft;
  onGoFleet: () => void;
  onGoLanding: () => void;
  user: User;
  onLogout: () => void;
  missionPhase: "idle" | "briefing" | "live" | "complete";
}

const ROLE_COLOR: Record<User["role"], string> = {
  "Pilot": colors.success,
  "Analyst": "rgba(147,197,253,1)",
  "Fleet Manager": colors.warning,
};

/** Returns true when this nav item should be inaccessible given current mission phase */
function isLocked(page: AppPage, phase: "idle" | "briefing" | "live" | "complete", _role: User["role"]): boolean {
  // Live Tracker: only unlocked once the drone has actually been launched
  if (page === "live") return phase !== "live";
  // Detection View: always accessible — shows per-aircraft pre-loaded findings
  if (page === "detection") return false;
  return false;
}

export default function Sidebar({
  current, onNavigate, selectedAircraft, onGoFleet, onGoLanding, user, onLogout, missionPhase,
}: Props) {
  const statusColor = {
    Active: colors.success,
    "In Maintenance": colors.warning,
    Grounded: colors.danger,
  }[selectedAircraft.status];

  const allowedPages = ROLE_PAGES[user.role];
  const navItems = ALL_NAV.filter((n) => allowedPages.includes(n.page));
  const roleColor = ROLE_COLOR[user.role];

  return (
    <nav style={navStyle}>
      {/* ── Brand ── */}
      <div style={brandSection}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={logoIcon}>✈</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, letterSpacing: "0.3px" }}>
              AeroScan Pro
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>Drone Inspection System</div>
          </div>
        </div>
      </div>

      {/* ── User info ── */}
      <div style={userSection}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
              {user.email}
            </div>
          </div>
          <div style={{ ...roleBadge, borderColor: `${roleColor}40`, background: `${roleColor}14`, color: roleColor }}>
            {user.role}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ padding: "14px 12px 8px", flex: 1, overflowY: "auto" }}>
        <div style={navLabel}>NAVIGATION</div>
        {navItems.map((item) => {
          const active = current === item.page;
          const locked = isLocked(item.page, missionPhase, user.role);
          return (
            <NavBtn
              key={item.page}
              item={item}
              active={active}
              locked={locked}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>

      {/* ── Active Aircraft ── */}
      <div style={aircraftPanel}>
        <div style={navLabel}>ACTIVE AIRCRAFT</div>
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: "0.5px", marginBottom: 2, fontFamily: typography.monoFamily }}>
                {selectedAircraft.registration}
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>{selectedAircraft.model}</div>
            </div>
            <div style={{ ...statusPill, background: `${statusColor}18`, borderColor: `${statusColor}40`, color: statusColor }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
              {selectedAircraft.status}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>
            {selectedAircraft.airline} · {selectedAircraft.shortModel} · Mfg. {selectedAircraft.manufactureYear}
          </div>
          <button type="button" onClick={onGoFleet} style={changeBtn}>Change Aircraft</button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={footerSection}>
        <button type="button" onClick={onLogout} style={logoutBtn}>
          <span>Sign Out</span>
          <span></span>
        </button>
        <button type="button" onClick={onGoLanding} style={aboutBtn}>
          <span>AeroScan Pro · About</span>
          <span>↗</span>
        </button>
      </div>
    </nav>
  );
}

function NavBtn({ item, active, locked, onNavigate }: {
  item: NavItem; active: boolean; locked: boolean; onNavigate: (p: AppPage) => void;
}) {
  const lockHint =
    item.page === "live" ? "Launch the drone from Mission Briefing first" :
      item.page === "detection" ? "Start an inspection first" :
        "";

  return (
    <button
      type="button"
      onClick={() => { if (!locked) onNavigate(item.page); }}
      title={locked ? lockHint : undefined}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px", marginBottom: 3, borderRadius: radius.sm,
        border: active ? "1px solid rgba(59,130,246,0.30)" : "1px solid transparent",
        background: active ? "rgba(59,130,246,0.14)" : "transparent",
        cursor: locked ? "not-allowed" : "pointer", textAlign: "left",
        opacity: locked ? 0.38 : 1,
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active && !locked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: active ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, flexShrink: 0,
        color: active ? colors.primary : colors.textSecondary,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? colors.textPrimary : colors.textSecondary, lineHeight: 1, marginBottom: 2 }}>
          {item.label}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1 }}>
          {locked ? lockHint : item.description}
        </div>
      </div>
      {active && !locked && <div style={{ width: 4, height: 4, borderRadius: "50%", background: colors.primary, flexShrink: 0 }} />}
      {locked && (
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.30)", letterSpacing: "0.5px", flexShrink: 0 }}>
          LOCKED
        </div>
      )}
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const navStyle: React.CSSProperties = {
  width: 252, minWidth: 252,
  background: "#111827",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  height: "100vh",
  display: "flex", flexDirection: "column",
  overflow: "hidden",
};

const brandSection: React.CSSProperties = {
  padding: "20px 20px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const logoIcon: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: "rgba(59,130,246,0.18)",
  border: "1px solid rgba(59,130,246,0.35)",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
};

const userSection: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.02)",
};

const roleBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "3px 8px", borderRadius: 999, border: "1px solid",
  fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8,
  whiteSpace: "nowrap",
};

const navLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.30)",
  letterSpacing: "1.2px", padding: "0 8px", marginBottom: 8,
};

const aircraftPanel: React.CSSProperties = {
  margin: "0 12px 12px",
  borderRadius: radius.md,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.03)",
  overflow: "hidden",
  paddingTop: 10,
};

const statusPill: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "3px 8px", borderRadius: radius.pill,
  border: "1px solid", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
};

const changeBtn: React.CSSProperties = {
  width: "100%", padding: "7px 12px", borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)",
  color: colors.textSecondary, fontSize: 12, cursor: "pointer",
  fontFamily: typography.fontFamily,
};

const footerSection: React.CSSProperties = {
  padding: "8px 12px",
  borderTop: "1px solid rgba(255,255,255,0.07)",
  display: "flex", flexDirection: "column", gap: 4,
};

const logoutBtn: React.CSSProperties = {
  width: "100%", padding: "7px 12px", borderRadius: 7,
  border: "1px solid rgba(255,92,115,0.18)", background: "transparent",
  color: "rgba(255,92,115,0.70)", fontSize: 11, cursor: "pointer",
  fontFamily: typography.fontFamily,
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

const aboutBtn: React.CSSProperties = {
  width: "100%", padding: "7px 12px", borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.07)", background: "transparent",
  color: "rgba(255,255,255,0.28)", fontSize: 11, cursor: "pointer",
  fontFamily: typography.fontFamily,
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

// React import needed for React.CSSProperties type reference used above
import React from "react";
