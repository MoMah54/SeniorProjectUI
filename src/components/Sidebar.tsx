import type { Aircraft } from "../data/fleetStore";
import { colors, radius, typography } from "../ui/tokens";

type Page = "fleet" | "live" | "detection" | "review" | "history";

interface NavItem {
  page: Page;
  label: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: "fleet",     label: "Fleet Overview",   icon: "✈",  description: "All aircraft" },
  { page: "live",      label: "Live Tracker",      icon: "◉",  description: "Real-time drone" },
  { page: "detection", label: "Detection View",    icon: "⊡",  description: "Frame inspection" },
  { page: "review",    label: "Results Review",    icon: "≡",  description: "Findings & export" },
  { page: "history",   label: "Flight History",    icon: "⏱",  description: "Inspection database" },
];

interface Props {
  current: Page;
  onNavigate: (p: Page) => void;
  selectedAircraft: Aircraft;
  onGoFleet: () => void;
  onGoLanding: () => void;
}

export default function Sidebar({ current, onNavigate, selectedAircraft, onGoFleet, onGoLanding }: Props) {
  const statusColor = {
    Active: colors.success,
    "In Maintenance": colors.warning,
    Grounded: colors.danger,
  }[selectedAircraft.status];

  return (
    <nav
      style={{
        width: 252,
        minWidth: 252,
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Brand ── */}
      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(59,130,246,0.18)",
              border: "1px solid rgba(59,130,246,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ✈
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: colors.textPrimary,
                letterSpacing: "0.3px",
              }}
            >
              AeroScan Pro
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>
              Drone Inspection System
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ padding: "14px 12px 8px", flex: 1, overflowY: "auto" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.30)",
            letterSpacing: "1.2px",
            padding: "0 8px",
            marginBottom: 8,
          }}
        >
          NAVIGATION
        </div>

        {NAV_ITEMS.map((item) => {
          const active = current === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                marginBottom: 3,
                borderRadius: radius.sm,
                border: active ? "1px solid rgba(59,130,246,0.30)" : "1px solid transparent",
                background: active ? "rgba(59,130,246,0.14)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: active ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  flexShrink: 0,
                  color: active ? colors.primary : colors.textSecondary,
                }}
              >
                {item.icon}
              </div>

              {/* Labels */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? colors.textPrimary : colors.textSecondary,
                    lineHeight: 1,
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1 }}>
                  {item.description}
                </div>
              </div>

              {/* Active indicator */}
              {active && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: colors.primary,
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Aircraft ── */}
      <div
        style={{
          margin: "0 12px 12px",
          borderRadius: radius.md,
          border: "1px solid rgba(255,255,255,0.09)",
          background: "rgba(255,255,255,0.03)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1.2px",
            color: "rgba(255,255,255,0.30)",
            padding: "10px 12px 6px",
          }}
        >
          ACTIVE AIRCRAFT
        </div>

        <div style={{ padding: "0 12px 12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 6,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  letterSpacing: "0.5px",
                  marginBottom: 2,
                }}
              >
                {selectedAircraft.registration}
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>
                {selectedAircraft.model}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px",
                borderRadius: radius.pill,
                background: `${statusColor}18`,
                border: `1px solid ${statusColor}40`,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: statusColor,
                }}
              />
              <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
                {selectedAircraft.status}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>
            {selectedAircraft.airline} · Mfg. {selectedAircraft.manufactureYear}
          </div>

          <button
            type="button"
            onClick={onGoFleet}
            style={{
              width: "100%",
              padding: "7px 12px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: colors.textSecondary,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: typography.fontFamily,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)")
            }
          >
            Change Aircraft
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          type="button"
          onClick={onGoLanding}
          style={{
            width: "100%",
            padding: "7px 12px",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "transparent",
            color: "rgba(255,255,255,0.28)",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: typography.fontFamily,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.60)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.28)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <span>AeroScan Pro · About</span>
          <span>↗</span>
        </button>
      </div>
    </nav>
  );
}
