// src/pages/ResultsReview.tsx
import React, { useMemo, useState } from "react";
import Card from "../ui/Card";
import { colors, radius, spacing, typography } from "../ui/tokens";
import type { Aircraft } from "../data/fleetStore";

type FindingType = "Crack" | "Dent" | "Corrosion";
type Severity = "Low" | "Medium" | "High";

type Finding = {
    id: string;
    type: FindingType;
    severity: Severity;
    confidence: number;
    zone: string;
    timestamp: string;
    notes: string;
    resolved: boolean;
};

type ExportFormat = "JSON" | "CSV";

export default function ResultsReview({
    aircraft,
    onGoHistory,
}: {
    aircraft: Aircraft;
    onGoHistory: () => void;
}) {
    const [findings, setFindings] = useState<Finding[]>([
        {
            id: "D-104",
            type: "Crack",
            severity: "High",
            confidence: 0.91,
            zone: "Forward fuselage",
            timestamp: "10:14:22",
            notes: "Clear crack candidate near panel seam.",
            resolved: false,
        },
        {
            id: "D-103",
            type: "Dent",
            severity: "Medium",
            confidence: 0.82,
            zone: "Wing root",
            timestamp: "10:11:48",
            notes: "Needs manual confirmation.",
            resolved: false,
        },
        {
            id: "D-102",
            type: "Corrosion",
            severity: "Low",
            confidence: 0.74,
            zone: "Aft fuselage",
            timestamp: "10:08:09",
            notes: "Minor surface degradation.",
            resolved: true,
        },
    ]);

    const [selectedId, setSelectedId] = useState<string>("D-104");
    const [query, setQuery] = useState<string>("");
    const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
    const [showResolved, setShowResolved] = useState<boolean>(true);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("JSON");

    const selected = useMemo(
        () => findings.find((f) => f.id === selectedId) ?? findings[0] ?? null,
        [findings, selectedId]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return findings
            .filter((f) => (showResolved ? true : !f.resolved))
            .filter((f) => (severityFilter === "All" ? true : f.severity === severityFilter))
            .filter((f) => {
                if (!q) return true;
                return `${f.id} ${f.type} ${f.zone} ${f.notes}`.toLowerCase().includes(q);
            })
            .sort((a, b) => rankSeverity(b.severity) - rankSeverity(a.severity));
    }, [findings, query, severityFilter, showResolved]);

    const summary = useMemo(() => {
        const total = findings.length;
        const unresolved = findings.filter((f) => !f.resolved).length;
        const high = findings.filter((f) => f.severity === "High").length;
        const avg =
            findings.length === 0
                ? 0
                : Math.round((findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length) * 100);

        return { total, unresolved, high, avg };
    }, [findings]);

    function updateSelected(patch: Partial<Finding>) {
        if (!selected) return;
        setFindings((prev) => prev.map((f) => (f.id === selected.id ? { ...f, ...patch } : f)));
    }

    function exportResults() {
        const payload = {
            aircraft: {
                registration: aircraft.registration,
                model: aircraft.model,
                airline: aircraft.airline,
            },
            missionId: "ALPHA-01",
            generatedAt: new Date().toISOString(),
            summary: {
                totalFindings: summary.total,
                unresolvedFindings: summary.unresolved,
                highSeverity: summary.high,
                averageConfidence: summary.avg,
            },
            findings,
        };

        if (exportFormat === "JSON") {
            alert(JSON.stringify(payload, null, 2));
            return;
        }

        const rows = [
            "id,type,severity,confidence,zone,timestamp,resolved,notes",
            ...findings.map((f) =>
                [
                    f.id,
                    f.type,
                    f.severity,
                    String(f.confidence),
                    csvEscape(f.zone),
                    csvEscape(f.timestamp),
                    String(f.resolved),
                    csvEscape(f.notes),
                ].join(",")
            ),
        ];

        alert(rows.join("\n"));
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
            <div style={header}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h1 style={title}>Results Review</h1>
                        <span style={aircraftBadge}>{aircraft.registration}</span>
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: 14 }}>
                        Validate findings, add engineer notes, and export inspection report for {aircraft.model}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <StatusPill label={`Total: ${summary.total}`} tone="info" />
                    <StatusPill label={`Unresolved: ${summary.unresolved}`} tone="warn" />
                    <StatusPill label={`High Severity: ${summary.high}`} tone="danger" />
                    <StatusPill label={`Avg Confidence: ${summary.avg}%`} tone="success" />
                </div>
            </div>

            <div style={layoutGrid} className="rr-grid">
                <Card>
                    <div style={sectionTitle}>Findings</div>
                    <div style={sectionSub}>All anomalies detected during the latest inspection session</div>

                    <div style={{ height: spacing.md }} />

                    <div style={filterGrid} className="rr-filters">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search findings..."
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
                        <input
                            type="checkbox"
                            checked={showResolved}
                            onChange={(e) => setShowResolved(e.target.checked)}
                        />
                        Show resolved findings
                    </label>

                    <div style={{ height: spacing.md }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflow: "auto", paddingRight: 6 }}>
                        {filtered.map((f) => (
                            <FindingRow
                                key={f.id}
                                finding={f}
                                active={selected?.id === f.id}
                                onClick={() => setSelectedId(f.id)}
                            />
                        ))}
                    </div>
                </Card>

                <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                    <Card>
                        <div style={sectionTitle}>Preview</div>
                        <div style={sectionSub}>Visual reference for the selected detection zone</div>

                        <div style={{ height: spacing.md }} />

                        <div style={previewBox}>
                            <div style={previewHud}>
                                <span style={{ ...pillBase, background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.12)" }}>
                                    Zone: <b style={{ color: colors.textPrimary }}>{selected?.zone ?? "—"}</b>
                                </span>
                                <span style={{ ...pillBase, background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.12)" }}>
                                    ID: <b style={{ color: colors.textPrimary }}>{selected?.id ?? "—"}</b>
                                </span>
                            </div>

                            <div style={boundingBox} />
                        </div>
                    </Card>

                    <Card>
                        <div style={sectionTitle}>Details & Export</div>
                        <div style={sectionSub}>Validate findings and generate an inspection report</div>

                        <div style={{ height: spacing.md }} />

                        {selected ? (
                            <>
                                <div style={detailGrid}>
                                    <InfoBox label="Type" value={selected.type} />
                                    <InfoBox label="Severity" value={selected.severity} tone={selected.severity} />
                                    <InfoBox label="Confidence" value={`${Math.round(selected.confidence * 100)}%`} mono />
                                    <InfoBox label="Zone" value={selected.zone} />
                                    <InfoBox label="Timestamp" value={selected.timestamp} mono />
                                    <InfoBox label="Status" value={selected.resolved ? "Resolved" : "Open"} />
                                </div>

                                <div style={{ height: spacing.md }} />

                                <div>
                                    <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>Engineer Notes</div>
                                    <textarea
                                        value={selected.notes}
                                        onChange={(e) => updateSelected({ notes: e.target.value })}
                                        style={textareaStyle}
                                        rows={4}
                                    />
                                </div>

                                <div style={{ height: spacing.md }} />

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
                                        onClick={() => alert("Flagged for manual inspection.")}
                                    >
                                        Flag for Manual Check
                                    </button>

                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <button
                                            type="button"
                                            style={{
                                                ...btnSecondary,
                                                fontSize: 13,
                                                color: colors.textSecondary,
                                                borderColor: "rgba(59,130,246,0.20)",
                                            }}
                                            onClick={onGoHistory}
                                        >
                                            View Zone History for {aircraft.registration}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ height: spacing.lg }} />

                                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: spacing.md }}>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                        style={inputStyle}
                                    >
                                        <option value="JSON">JSON</option>
                                        <option value="CSV">CSV</option>
                                    </select>

                                    <button type="button" style={btnPrimary} onClick={exportResults}>
                                        Export Results
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: colors.textSecondary }}>No finding selected.</div>
                        )}
                    </Card>
                </div>
            </div>

            <style>{responsiveCss}</style>
        </div>
    );
}

function FindingRow({
    finding,
    active,
    onClick,
}: {
    finding: Finding;
    active: boolean;
    onClick: () => void;
}) {
    const sev = severityStyle(finding.severity);

    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                ...rowButton,
                borderColor: active ? "rgba(59,130,246,0.45)" : colors.border,
                background: active ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.04)",
            }}
        >
            <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: colors.textPrimary, fontWeight: 900 }}>{finding.type}</span>
                    <span style={{ ...pillBase, background: sev.bg, borderColor: sev.border }}>
                        <span style={{ ...dotBase, background: sev.dot }} />
                        {finding.severity}
                    </span>
                    {finding.resolved ? <span style={{ ...pillBase, background: "rgba(61,220,151,0.10)" }}>Resolved</span> : null}
                </div>

                <div style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>
                    {finding.zone} • {Math.round(finding.confidence * 100)}% confidence • {finding.timestamp}
                </div>
            </div>

            <div style={{ color: colors.textSecondary, fontFamily: typography.monoFamily, fontSize: 12 }}>
                {finding.id}
            </div>
        </button>
    );
}

function InfoBox({
    label,
    value,
    mono,
    tone,
}: {
    label: string;
    value: string;
    mono?: boolean;
    tone?: Severity;
}) {
    const sev = tone ? severityStyle(tone) : null;

    return (
        <div style={infoBox}>
            <div style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</div>

            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div
                    style={{
                        color: colors.textPrimary,
                        fontWeight: 900,
                        fontFamily: mono ? typography.monoFamily : typography.fontFamily,
                    }}
                >
                    {value}
                </div>

                {sev ? (
                    <span style={{ ...pillBase, background: sev.bg, borderColor: sev.border }}>
                        <span style={{ ...dotBase, background: sev.dot }} />
                        {tone}
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function StatusPill({
    label,
    tone,
}: {
    label: string;
    tone: "success" | "warn" | "danger" | "info";
}) {
    const map = {
        success: { bg: "rgba(61,220,151,0.12)", border: "rgba(61,220,151,0.28)", dot: colors.success },
        warn: { bg: "rgba(247,201,72,0.12)", border: "rgba(247,201,72,0.28)", dot: colors.warning },
        danger: { bg: "rgba(255,92,115,0.12)", border: "rgba(255,92,115,0.28)", dot: colors.danger },
        info: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.28)", dot: colors.primary },
    } as const;

    const s = map[tone];

    return (
        <span style={{ ...pillBase, background: s.bg, borderColor: s.border }}>
            <span style={{ ...dotBase, background: s.dot }} />
            {label}
        </span>
    );
}

function severityStyle(sev: Severity) {
    if (sev === "High") return { bg: "rgba(255,92,115,0.12)", border: "rgba(255,92,115,0.28)", dot: colors.danger };
    if (sev === "Medium") return { bg: "rgba(247,201,72,0.12)", border: "rgba(247,201,72,0.28)", dot: colors.warning };
    return { bg: "rgba(61,220,151,0.12)", border: "rgba(61,220,151,0.28)", dot: colors.success };
}

function rankSeverity(sev: Severity) {
    if (sev === "High") return 3;
    if (sev === "Medium") return 2;
    return 1;
}

function csvEscape(value: string) {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

const header: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: spacing.lg,
};

const title: React.CSSProperties = {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: colors.textPrimary,
};

const aircraftBadge: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(59,130,246,0.28)",
    color: colors.primary,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.5px",
};

const layoutGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: spacing.lg,
    alignItems: "start",
};

const sectionTitle: React.CSSProperties = {
    fontWeight: 900,
    color: colors.textPrimary,
    fontSize: 16,
};

const sectionSub: React.CSSProperties = {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
};

const filterGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: spacing.md,
};

const detailGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.md,
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.background,
    color: colors.textPrimary,
    outline: "none",
    fontFamily: typography.fontFamily,
};

const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.background,
    color: colors.textPrimary,
    outline: "none",
    resize: "vertical",
    fontFamily: typography.fontFamily,
};

const rowButton: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
};

const infoBox: React.CSSProperties = {
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.04)",
};

const previewBox: React.CSSProperties = {
    height: 300,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background:
        "radial-gradient(900px 500px at 20% 10%, rgba(59,130,246,0.16), transparent 60%), rgba(15,23,42,0.85)",
    position: "relative",
    overflow: "hidden",
};

const previewHud: React.CSSProperties = {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    pointerEvents: "none",
};

const boundingBox: React.CSSProperties = {
    position: "absolute",
    left: "20%",
    top: "24%",
    width: "42%",
    height: "34%",
    borderRadius: 10,
    border: "2px solid rgba(59,130,246,0.9)",
    boxShadow: "0 0 0 6px rgba(59,130,246,0.14)",
};

const pillBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 10px",
    borderRadius: radius.pill,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.06)",
    color: colors.textSecondary,
    fontSize: 12,
    whiteSpace: "nowrap",
};

const dotBase: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    display: "inline-block",
};

const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.40)",
    background: "rgba(59,130,246,0.22)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: typography.weight.bold,
    fontFamily: typography.fontFamily,
};

const btnSecondary: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.06)",
    color: colors.textPrimary,
    cursor: "pointer",
    fontWeight: typography.weight.semibold,
    fontFamily: typography.fontFamily,
};

const btnWarn: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(247,201,72,0.32)",
    background: "rgba(247,201,72,0.12)",
    color: colors.textPrimary,
    cursor: "pointer",
    fontWeight: typography.weight.bold,
    fontFamily: typography.fontFamily,
};

const responsiveCss = `
  @media (max-width: 1100px) {
    .rr-grid { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 720px) {
    .rr-filters { grid-template-columns: 1fr !important; }
  }
`;