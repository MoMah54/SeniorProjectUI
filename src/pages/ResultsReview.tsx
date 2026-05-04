// src/pages/ResultsReview.tsx
// Shows findings for any aircraft in the fleet.
// Aircraft switcher tabs let the user pick which plane to review.
// Live mission detections are merged in when viewing the mission aircraft.
import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import { colors, radius, spacing, typography } from "../ui/tokens";
import { FLEET, getAircraftFlights } from "../data/fleetStore";
import type { Aircraft, LiveDetection } from "../data/fleetStore";

// ── Local types ───────────────────────────────────────────────────────────────

type FindingType = "Crack" | "Dent" | "Corrosion" | "Scratch" | "Missing Rivet" | "Paint Damage";
type Severity    = "Low" | "Medium" | "High";

interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  confidence: number;
  zone: string;
  timestamp: string;
  notes: string;
  resolved: boolean;
  isLive?: boolean;   // came from the current mission (not yet in history)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  missionDetections: LiveDetection[];   // detections from the most recent mission
  missionAircraftId: string;            // which aircraft the mission was for
  onGoHistory: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResultsReview({ missionDetections, missionAircraftId, onGoHistory }: Props) {
  // Aircraft switcher
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(
    missionAircraftId || FLEET[0].id,
  );
  const selectedAircraft: Aircraft = FLEET.find((a) => a.id === selectedAircraftId) ?? FLEET[0];

  // Local editable findings (re-loaded when aircraft changes)
  const [findings, setFindings]     = useState<Finding[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  // Filters
  const [query, setQuery]                 = useState("");
  const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
  const [showResolved, setShowResolved]   = useState(true);

  // Reload findings whenever the selected aircraft changes
  useEffect(() => {
    const historical: Finding[] = getAircraftFlights(selectedAircraftId)
      .flatMap((f) => f.findings)
      .map((hf) => ({
        id:         hf.id,
        type:       hf.type,
        severity:   hf.severity,
        confidence: hf.confidence,
        zone:       hf.zone,
        timestamp:  hf.timestamp,
        notes:      hf.notes,
        resolved:   hf.resolved,
      }));

    // Merge live detections for this aircraft (exclude any already saved to history)
    const historicalIds = new Set(historical.map((f) => f.id));
    const live: Finding[] = selectedAircraftId === missionAircraftId
      ? missionDetections
          .filter((d) => !historicalIds.has(d.id))
          .map((d, i) => ({
            id:         d.id || `live-${i}`,
            type:       d.label as FindingType,
            severity:   d.severity,
            confidence: d.confidence,
            zone:       d.zone,
            timestamp:  d.timestamp,
            notes:      `Detected during live inspection. Confidence: ${Math.round(d.confidence * 100)}%.`,
            resolved:   false,
            isLive:     true,
          }))
      : [];

    const all = [...live, ...historical];
    setFindings(all);
    setSelectedId(all[0]?.id ?? "");
  }, [selectedAircraftId, missionAircraftId, missionDetections]);

  // Derived values
  const selected = useMemo(
    () => findings.find((f) => f.id === selectedId) ?? findings[0] ?? null,
    [findings, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return findings
      .filter((f) => showResolved || !f.resolved)
      .filter((f) => severityFilter === "All" || f.severity === severityFilter)
      .filter((f) => !q || `${f.id} ${f.type} ${f.zone} ${f.notes}`.toLowerCase().includes(q))
      .sort((a, b) => rankSev(b.severity) - rankSev(a.severity));
  }, [findings, query, severityFilter, showResolved]);

  const summary = useMemo(() => ({
    total:      findings.length,
    unresolved: findings.filter((f) => !f.resolved).length,
    high:       findings.filter((f) => f.severity === "High").length,
    avg:        findings.length === 0
      ? 0
      : Math.round(findings.reduce((s, f) => s + f.confidence, 0) / findings.length * 100),
  }), [findings]);

  function updateSelected(patch: Partial<Finding>) {
    if (!selected) return;
    setFindings((prev) => prev.map((f) => f.id === selected.id ? { ...f, ...patch } : f));
  }

  function exportJSON() {
    const payload = {
      aircraft:    { registration: selectedAircraft.registration, model: selectedAircraft.model, airline: selectedAircraft.airline },
      generatedAt: new Date().toISOString(),
      summary,
      findings:    findings.map(({ isLive: _isLive, ...rest }) => rest),
    };
    download(
      JSON.stringify(payload, null, 2),
      `${selectedAircraft.registration}_results_${today()}.json`,
      "application/json",
    );
  }

  function exportCSV() {
    const rows = [
      "id,type,severity,confidence,zone,timestamp,resolved,notes",
      ...findings.map((f) =>
        [f.id, f.type, f.severity, String(f.confidence), csvEsc(f.zone), csvEsc(f.timestamp), String(f.resolved), csvEsc(f.notes)].join(","),
      ),
    ];
    download(rows.join("\n"), `${selectedAircraft.registration}_results_${today()}.csv`, "text/csv");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>

      {/* Header */}
      <div style={headerRow}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={pageTitle}>Results Review</h1>
            <span style={acBadge}>{selectedAircraft.registration}</span>
          </div>
          <p style={pageSub}>
            Validate findings, edit notes, and export inspection reports
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <StatusPill label={`Total: ${summary.total}`}            tone="info"    />
          <StatusPill label={`Unresolved: ${summary.unresolved}`}  tone="warn"    />
          <StatusPill label={`High: ${summary.high}`}              tone="danger"  />
          <StatusPill label={`Avg Conf: ${summary.avg}%`}          tone="success" />
        </div>
      </div>

      {/* Aircraft switcher */}
      <div style={switcherRow} className="rr-switcher">
        {FLEET.map((a) => {
          const active  = a.id === selectedAircraftId;
          const statClr = a.status === "Active" ? colors.success : a.status === "In Maintenance" ? colors.warning : colors.danger;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAircraftId(a.id)}
              style={{
                ...switcherBtn,
                borderColor: active ? "rgba(59,130,246,0.50)" : colors.border,
                background:  active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                color:       active ? colors.textPrimary : colors.textSecondary,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statClr, flexShrink: 0, display: "inline-block" }} />
              {a.registration}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div style={layoutGrid} className="rr-grid">

        {/* ── Left: findings list ── */}
        <Card>
          <div style={sectionTitle}>Findings</div>
          <div style={sectionSub}>Anomalies detected for {selectedAircraft.registration}</div>

          <div style={{ height: spacing.md }} />

          {/* Filters */}
          <div style={filterGrid} className="rr-filters">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search findings…"
              style={inputStyle}
            />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as "All" | Severity)}
              style={inputStyle}
            >
              <option value="All">All severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ height: spacing.md }} />

          <label style={{ display: "flex", alignItems: "center", gap: 10, color: colors.textSecondary, fontSize: 13 }}>
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            Show resolved findings
          </label>

          <div style={{ height: spacing.md }} />

          {findings.length === 0 ? (
            <div style={{ padding: "28px 0", textAlign: "center", color: colors.textSecondary, fontSize: 13 }}>
              No findings for {selectedAircraft.registration}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
              {filtered.map((f) => (
                <FindingRow
                  key={f.id}
                  finding={f}
                  active={selected?.id === f.id}
                  onClick={() => setSelectedId(f.id)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* ── Right: details + export ── */}
        <Card>
          <div style={sectionTitle}>Details & Export</div>
          <div style={sectionSub}>Validate findings and generate an inspection report</div>

          <div style={{ height: spacing.md }} />

          {selected ? (
            <>
              {/* Detail grid */}
              <div style={detailGrid}>
                <InfoBox label="ID"         value={selected.id}                                     mono />
                <InfoBox label="Type"       value={selected.type}                                        />
                <InfoBox label="Severity"   value={selected.severity}  tone={selected.severity}          />
                <InfoBox label="Confidence" value={`${Math.round(selected.confidence * 100)}%`}     mono />
                <InfoBox label="Zone"       value={selected.zone}                                        />
                <InfoBox label="Status"     value={selected.resolved ? "Resolved" : "Open"}              />
              </div>

              <div style={{ height: spacing.md }} />

              {/* Editable notes */}
              <div>
                <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>Engineer Notes</div>
                <textarea
                  value={selected.notes}
                  onChange={(e) => updateSelected({ notes: e.target.value })}
                  style={textareaStyle}
                  rows={4}
                  placeholder="Add engineer notes here…"
                />
              </div>

              <div style={{ height: spacing.md }} />

              {/* Action buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
                <button
                  type="button"
                  style={selected.resolved ? btnSecondary : btnPrimary}
                  onClick={() => updateSelected({ resolved: !selected.resolved })}
                >
                  {selected.resolved ? "Mark as Open" : "Mark as Resolved"}
                </button>
                <button
                  type="button"
                  style={btnWarn}
                  onClick={() => updateSelected({ notes: (selected.notes ? selected.notes + "\n" : "") + "[ Flagged for manual inspection ]" })}
                >
                  Flag for Manual Check
                </button>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="button" style={{ ...btnSecondary, color: colors.textSecondary }} onClick={onGoHistory}>
                    View Full History for {selectedAircraft.registration}
                  </button>
                </div>
              </div>

              <div style={{ height: spacing.lg }} />

              {/* Export — consistent JSON / CSV buttons */}
              <div style={sectionTitle}>Export Report</div>
              <div style={{ marginTop: spacing.md, display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
                <button type="button" style={exportBtn} onClick={exportJSON}>Export JSON</button>
                <button type="button" style={exportBtn} onClick={exportCSV}>Export CSV</button>
              </div>
            </>
          ) : (
            <div style={{ color: colors.textSecondary, padding: "24px 0", textAlign: "center", fontSize: 13 }}>
              Select a finding from the list to review its details.
            </div>
          )}
        </Card>
      </div>

      <style>{responsiveCss}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FindingRow({ finding, active, onClick }: { finding: Finding; active: boolean; onClick: () => void }) {
  const sev = sevStyle(finding.severity);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...rowButton,
        borderColor: active ? "rgba(59,130,246,0.45)" : colors.border,
        background:  active ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ textAlign: "left", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ color: colors.textPrimary, fontWeight: 700 }}>{finding.type}</span>
          <span style={{ ...pillBase, background: sev.bg, borderColor: sev.border }}>
            <span style={{ ...dotBase, background: sev.dot }} />
            {finding.severity}
          </span>
          {finding.resolved && (
            <span style={{ ...pillBase, background: "rgba(61,220,151,0.10)", borderColor: "rgba(61,220,151,0.28)", color: colors.success }}>
              Resolved
            </span>
          )}
          {finding.isLive && (
            <span style={{ ...pillBase, background: "rgba(59,130,246,0.10)", borderColor: "rgba(59,130,246,0.25)", color: colors.primary }}>
              Latest
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>
          {finding.zone} · {Math.round(finding.confidence * 100)}% confidence · {finding.timestamp}
        </div>
      </div>
      <div style={{ color: colors.textSecondary, fontFamily: typography.monoFamily, fontSize: 12, flexShrink: 0 }}>
        {finding.id}
      </div>
    </button>
  );
}

function InfoBox({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: string }) {
  const sev = tone ? sevStyle(tone as Severity) : null;
  return (
    <div style={infoBox}>
      <div style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 8, color: sev ? sev.dot : colors.textPrimary, fontWeight: 700, fontFamily: mono ? typography.monoFamily : typography.fontFamily }}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "warn" | "danger" | "info" }) {
  const map = {
    success: { bg: "rgba(61,220,151,0.12)", border: "rgba(61,220,151,0.28)", dot: colors.success },
    warn:    { bg: "rgba(247,201,72,0.12)", border: "rgba(247,201,72,0.28)",  dot: colors.warning },
    danger:  { bg: "rgba(255,92,115,0.12)", border: "rgba(255,92,115,0.28)",  dot: colors.danger },
    info:    { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.28)",  dot: colors.primary },
  } as const;
  const s = map[tone];
  return (
    <span style={{ ...pillBase, background: s.bg, borderColor: s.border }}>
      <span style={{ ...dotBase, background: s.dot }} />
      {label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sevStyle(sev: Severity | string) {
  if (sev === "High")   return { bg: "rgba(255,92,115,0.12)", border: "rgba(255,92,115,0.28)", dot: colors.danger };
  if (sev === "Medium") return { bg: "rgba(247,201,72,0.12)", border: "rgba(247,201,72,0.28)",  dot: colors.warning };
  return                       { bg: "rgba(61,220,151,0.12)", border: "rgba(61,220,151,0.28)",  dot: colors.success };
}

function rankSev(sev: Severity) {
  return sev === "High" ? 3 : sev === "Medium" ? 2 : 1;
}

function csvEsc(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Styles ────────────────────────────────────────────────────────────────────

const headerRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.lg, flexWrap: "wrap" };
const pageTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 700, color: colors.textPrimary };
const pageSub:   React.CSSProperties = { margin: "4px 0 0", fontSize: 14, color: colors.textSecondary };

const acBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 999,
  background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.28)",
  color: colors.primary, fontSize: 13, fontWeight: 700, letterSpacing: "0.5px",
};

const switcherRow: React.CSSProperties = {
  display: "flex", gap: 8, flexWrap: "wrap",
};

const switcherBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  padding: "6px 14px", borderRadius: 999, border: "1px solid",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
  fontFamily: typography.fontFamily, transition: "border-color 0.15s, background 0.15s",
};

const layoutGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: spacing.lg, alignItems: "start" };

const sectionTitle: React.CSSProperties = { fontWeight: 900, color: colors.textPrimary, fontSize: 16 };
const sectionSub:   React.CSSProperties = { marginTop: 6, color: colors.textSecondary, fontSize: 13 };

const filterGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: spacing.md };

const detailGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: `1px solid ${colors.border}`, background: colors.background,
  color: colors.textPrimary, outline: "none", fontFamily: typography.fontFamily,
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: `1px solid ${colors.border}`, background: colors.background,
  color: colors.textPrimary, outline: "none", resize: "vertical",
  fontFamily: typography.fontFamily, boxSizing: "border-box",
};

const rowButton: React.CSSProperties = {
  width: "100%", border: `1px solid ${colors.border}`, borderRadius: 12,
  padding: 12, display: "flex", justifyContent: "space-between",
  alignItems: "center", gap: 12, cursor: "pointer",
};

const infoBox: React.CSSProperties = {
  padding: 12, borderRadius: 12,
  border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.04)",
};

const pillBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "4px 10px", borderRadius: radius.pill,
  border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.06)",
  color: colors.textSecondary, fontSize: 12, whiteSpace: "nowrap",
};

const dotBase: React.CSSProperties = { width: 6, height: 6, borderRadius: radius.pill, display: "inline-block" };

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: "1px solid rgba(59,130,246,0.40)", background: "rgba(59,130,246,0.22)",
  color: "rgba(255,255,255,0.92)", cursor: "pointer",
  fontWeight: typography.weight.bold, fontFamily: typography.fontFamily,
};

const btnSecondary: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.06)",
  color: colors.textPrimary, cursor: "pointer",
  fontWeight: typography.weight.semibold, fontFamily: typography.fontFamily,
};

const btnWarn: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: "1px solid rgba(247,201,72,0.32)", background: "rgba(247,201,72,0.12)",
  color: colors.textPrimary, cursor: "pointer",
  fontWeight: typography.weight.bold, fontFamily: typography.fontFamily,
};

const exportBtn: React.CSSProperties = {
  height: 40, borderRadius: 10, border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.05)", color: colors.textPrimary,
  cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: typography.fontFamily,
};

const responsiveCss = `
  @media (max-width: 1100px) { .rr-grid { grid-template-columns: 1fr !important; } }
  @media (max-width: 720px)  { .rr-filters { grid-template-columns: 1fr !important; } }
  @media (max-width: 600px)  { .rr-switcher { gap: 6px !important; } }
`;
