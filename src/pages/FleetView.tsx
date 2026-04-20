// src/pages/FleetView.tsx
import React from "react";
import {
  FLEET,
  getAircraftFlights,
  getUnresolvedCount,
  getZoneRecurrences,
} from "../data/fleetStore";
import type { Aircraft, AircraftStatus } from "../data/fleetStore";
import { colors, radius, spacing } from "../ui/tokens";

type Page = "fleet" | "live" | "detection" | "review" | "history";

interface Props {
  selectedAircraftId: string;
  onSelectAircraft: (id: string) => void;
  onNavigate: (p: Page) => void;
}

export default function FleetView({ selectedAircraftId, onSelectAircraft, onNavigate }: Props) {
  const activeCount = FLEET.filter((a) => a.status === "Active").length;
  const maintenanceCount = FLEET.filter((a) => a.status === "In Maintenance").length;
  const groundedCount = FLEET.filter((a) => a.status === "Grounded").length;
  const totalUnresolved = FLEET.reduce((sum, a) => sum + getUnresolvedCount(a.id), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* ── Header ── */}
      <div style={headerRow}>
        <div>
          <h1 style={pageTitle}>Fleet Overview</h1>
          <p style={pageSubtitle}>
            Select an aircraft to begin or review its inspection data
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <StatPill label="Total Aircraft" value={String(FLEET.length)} tone="neutral" />
          <StatPill label="Active" value={String(activeCount)} tone="success" />
          <StatPill label="In Maintenance" value={String(maintenanceCount)} tone="warn" />
          <StatPill label="Grounded" value={String(groundedCount)} tone="danger" />
          <StatPill label="Unresolved Findings" value={String(totalUnresolved)} tone="info" />
        </div>
      </div>

      {/* ── Aircraft Grid ── */}
      <div style={grid} className="fleet-grid">
        {FLEET.map((aircraft) => (
          <AircraftCard
            key={aircraft.id}
            aircraft={aircraft}
            isSelected={aircraft.id === selectedAircraftId}
            onSelect={() => {
              onSelectAircraft(aircraft.id);
              onNavigate("history");
            }}
          />
        ))}
      </div>

      <style>{`
        .fleet-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1200px) {
          .fleet-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 720px) {
          .fleet-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function AircraftCard({
  aircraft,
  isSelected,
  onSelect,
}: {
  aircraft: Aircraft;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const flights = getAircraftFlights(aircraft.id);
  const unresolved = getUnresolvedCount(aircraft.id);
  const recurrences = getZoneRecurrences(aircraft.id);
  const latestFlight = flights[0];

  const statusColors = statusStyle(aircraft.status);
  const daysUntilNext = Math.ceil(
    (new Date(aircraft.nextInspection).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const nextDue = daysUntilNext > 0 ? `${daysUntilNext}d` : "Overdue";
  const nextTone = daysUntilNext < 14 ? colors.danger : daysUntilNext < 30 ? colors.warning : colors.success;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected
          ? "rgba(59,130,246,0.10)"
          : "rgba(255,255,255,0.03)",
        border: isSelected
          ? "1px solid rgba(59,130,246,0.45)"
          : `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s, transform 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.22)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = colors.border;
        }
      }}
    >
      {/* Selected indicator line */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: colors.primary,
            borderRadius: "16px 16px 0 0",
          }}
        />
      )}

      {/* Top Row: Registration + Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, letterSpacing: "0.5px" }}>
            {aircraft.registration}
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {aircraft.manufacturer} · {aircraft.model}
          </div>
        </div>
        <span
          style={{
            ...pillBase,
            background: statusColors.bg,
            borderColor: statusColors.border,
            color: statusColors.text,
          }}
        >
          <span style={{ ...dot, background: statusColors.dot }} />
          {aircraft.status}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: colors.border, marginBottom: 16 }} />

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <MiniStat label="Manufacture Year" value={String(aircraft.manufactureYear)} />
        <MiniStat label="Total Flights" value={aircraft.totalFlights.toLocaleString()} />
        <MiniStat label="Inspections" value={String(flights.length)} />
        <MiniStat label="Unresolved" value={String(unresolved)} danger={unresolved > 0} />
      </div>

      {/* Recurrence Alert */}
      {recurrences.length > 0 && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: radius.sm,
            background: "rgba(255,92,115,0.08)",
            border: "1px solid rgba(255,92,115,0.22)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: colors.danger, fontSize: 12, fontWeight: 600 }}>
            {recurrences.length} recurring zone{recurrences.length > 1 ? "s" : ""} — click to review
          </span>
        </div>
      )}

      {/* Footer: Last inspection + Next due */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>Last inspection</div>
          <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>
            {formatDate(aircraft.lastInspection)}
          </div>
          {latestFlight && (
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              by {latestFlight.engineer}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>Next due</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: nextTone }}>{nextDue}</div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            {formatDate(aircraft.nextInspection)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: radius.sm,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: danger ? colors.danger : colors.textPrimary,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warn" | "danger" | "info" | "neutral";
}) {
  const map = {
    success: { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.25)", dot: colors.success },
    warn: { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.25)", dot: colors.warning },
    danger: { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.25)", dot: colors.danger },
    info: { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.25)", dot: colors.primary },
    neutral: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", dot: "rgba(255,255,255,0.45)" },
  } as const;
  const s = map[tone];
  return (
    <div
      style={{
        padding: "6px 14px",
        borderRadius: radius.pill,
        background: s.bg,
        border: `1px solid ${s.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: 72,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{value}</div>
      <div style={{ fontSize: 11, color: colors.textSecondary, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

function statusStyle(status: AircraftStatus) {
  if (status === "Active")
    return { bg: "rgba(61,220,151,0.10)", border: "rgba(61,220,151,0.28)", dot: colors.success, text: colors.success };
  if (status === "In Maintenance")
    return { bg: "rgba(247,201,72,0.10)", border: "rgba(247,201,72,0.28)", dot: colors.warning, text: colors.warning };
  return { bg: "rgba(255,92,115,0.10)", border: "rgba(255,92,115,0.28)", dot: colors.danger, text: colors.danger };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: spacing.lg,
  flexWrap: "wrap",
};

const pageTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 700,
  color: colors.textPrimary,
};

const pageSubtitle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 14,
  color: colors.textSecondary,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 20,
};

const pillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: radius.pill,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const dot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: radius.pill,
  display: "inline-block",
  flexShrink: 0,
};
