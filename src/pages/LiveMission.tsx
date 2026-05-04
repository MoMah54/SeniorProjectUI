// src/pages/LiveMission.tsx
import React, { useEffect, useRef, useState } from "react";
import DroneSimulationView from "../components/DroneSimulationView";
import Card from "../ui/Card";
import { colors, radius, spacing, typography } from "../ui/tokens";
import type { Aircraft, LiveDetection } from "../data/fleetStore";
// LiveDetection only used in the onMissionComplete callback signature

type Telemetry = {
    battery: number;
    altitude: number;
    speed: number;
    lat: number;
    lng: number;
    signal: number;
    status: "Scanning" | "Holding" | "Returning" | "Landed";
};


type MissionEvent = {
    id: string;
    time: string;
    message: string;
    severity: "Info" | "Warning" | "Critical";
};

interface LiveMissionProps {
    aircraft: Aircraft;
    pilotName?: string;
    onMissionComplete?: (detections: LiveDetection[], seconds: number) => void;
    /** Called when the pilot aborts the mission mid-flight */
    onAbort?: () => void;
}

export default function LiveMission({ aircraft, pilotName: _pilotName = "Unknown Pilot", onMissionComplete, onAbort }: LiveMissionProps) {
    const missionCompleteRef = useRef(false); // fire callback only once

    // Abort confirmation state — two clicks within 4 s required
    const [abortPending, setAbortPending] = useState(false);
    const abortTimerRef = useRef<number | null>(null);

    // Cleanup abort timer on unmount
    useEffect(() => () => {
        if (abortTimerRef.current) window.clearTimeout(abortTimerRef.current);
    }, []);

    const [telemetry, setTelemetry] = useState<Telemetry>({
        battery: 100,
        altitude: 4.8,   // realistic: close-range inspection altitude 3–6 m
        speed: 0.7,      // realistic: slow inspection crawl 0.4–1.2 m/s
        lat: 25.2048,
        lng: 55.2708,
        signal: 97,
        status: "Scanning",
    });

    const [missionTime, setMissionTime] = useState<number>(0);
    const [paused, setPaused] = useState<boolean>(false);

    // Image capture counter — increments each time the drone stops at a waypoint
    const [imagesCaptured, setImagesCaptured] = useState<number>(0);

    const [events, setEvents] = useState<MissionEvent[]>([
        { id: "E-1", time: nowTime(), message: "Mission started. Drone capturing images.", severity: "Info" },
        { id: "E-2", time: nowTime(), message: "Telemetry link stable.", severity: "Info" },
    ]);

    const homeRef = useRef<{ lat: number; lng: number } | null>(null);

    function pushEvent(message: string, severity: MissionEvent["severity"]) {
        const event: MissionEvent = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            time: nowTime(),
            message,
            severity,
        };
        setEvents((prev) => [event, ...prev].slice(0, 8));
    }

    function togglePause() {
        if (telemetry.status === "Returning" || telemetry.status === "Landed") return;

        setPaused((prev) => {
            const next = !prev;
            setTelemetry((curr) => ({
                ...curr,
                speed: next ? 0 : 0.6,
                status: next ? "Holding" : "Scanning",
            }));
            pushEvent(next ? "Drone hold position engaged." : "Drone resumed scan path.", "Info");
            return next;
        });
    }

    function handleAbortClick() {
        if (abortPending) {
            // Second click — confirmed
            if (abortTimerRef.current) window.clearTimeout(abortTimerRef.current);
            pushEvent("Mission aborted by pilot.", "Critical");
            // Small delay so the event renders before the component unmounts
            window.setTimeout(() => onAbort?.(), 400);
        } else {
            // First click — arm confirmation
            setAbortPending(true);
            pushEvent("Abort requested — click 'Confirm Abort' within 4 s to terminate.", "Critical");
            abortTimerRef.current = window.setTimeout(() => setAbortPending(false), 4000);
        }
    }

    useEffect(() => {
        const id = window.setInterval(() => {
            setMissionTime((prev) => prev + 1);

            setTelemetry((prev) => {
                if (prev.status === "Landed") return prev;

                const home = homeRef.current;
                const returning = prev.status === "Returning" && home;

                let nextLat = prev.lat;
                let nextLng = prev.lng;
                let nextAlt = prev.altitude;
                let nextSpeed = prev.speed;

                if (returning) {
                    // Realistic RTH: climb first to 12 m, then transit, then descend to land
                    const climbTarget = 12;
                    if (prev.altitude < climbTarget - 0.5) {
                        nextAlt = clamp(prev.altitude + rand(1.2, 2.0), 0, climbTarget);
                        nextSpeed = clamp(prev.speed + (1.8 - prev.speed) * 0.3, 0, 5);
                    } else {
                        nextLat = moveToward(prev.lat, home.lat, 0.12);
                        nextLng = moveToward(prev.lng, home.lng, 0.12);
                        nextAlt = clamp(prev.altitude - rand(0.3, 0.7), 0, climbTarget);
                        nextSpeed = clamp(prev.speed + (3.5 - prev.speed) * 0.2, 0, 8);
                    }

                    const arrived = distDeg(nextLat, nextLng, home.lat, home.lng) < 0.00005;
                    if (arrived && nextAlt <= 0.5) {
                        pushEvent("Drone landed at home position.", "Info");
                        homeRef.current = null;
                        // Fire mission-complete callback (once only)
                        // Detections come from the pre-loaded mission state in App,
                        // not from live flight — drone only captures images.
                        if (!missionCompleteRef.current && onMissionComplete) {
                            missionCompleteRef.current = true;
                            window.setTimeout(() => {
                                onMissionComplete([], missionTime);
                            }, 1800);
                        }
                        return {
                            ...prev,
                            lat: +nextLat.toFixed(6),
                            lng: +nextLng.toFixed(6),
                            altitude: 0,
                            speed: 0,
                            battery: clamp(prev.battery - 0.05, 0, 100),
                            signal: clamp(prev.signal + rand(-1, 1), 0, 100),
                            status: "Landed",
                        };
                    }
                } else if (!paused) {
                    // Realistic inspection drift: tiny GPS micro-movement at slow crawl speed
                    nextLat = prev.lat + rand(-0.000004, 0.000004);
                    nextLng = prev.lng + rand(-0.000004, 0.000004);
                    // Altitude: very close to fuselage — 3.5–6.5 m
                    nextAlt = clamp(prev.altitude + rand(-0.15, 0.15), 3.5, 6.5);
                    // Speed: slow inspection crawl 0.4–1.2 m/s
                    nextSpeed = clamp(prev.speed + rand(-0.08, 0.08), 0.4, 1.2);
                }

                // Battery: realistic 30-min flight = ~0.055%/s drain; holding = 0.018%/s
                const nextBattery = clamp(prev.battery - (paused ? 0.018 : 0.055), 0, 100);
                // Signal: strong and stable near ground station, minor fluctuation
                const nextSignal = clamp(prev.signal + rand(-1, 1), 88, 99);

                return {
                    ...prev,
                    lat: +nextLat.toFixed(6),
                    lng: +nextLng.toFixed(6),
                    altitude: +nextAlt.toFixed(1),
                    speed: +nextSpeed.toFixed(1),
                    battery: +nextBattery.toFixed(1),
                    signal: Math.round(nextSignal),
                };
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, [paused]);

    // Increment images-captured counter when drone is actively scanning
    useEffect(() => {
        const captureTimer = window.setInterval(() => {
            if (!paused && telemetry.status === "Scanning") {
                setImagesCaptured((prev) => prev + 1);
                pushEvent("Image captured at waypoint.", "Info");
            }
        }, 8000);

        return () => window.clearInterval(captureTimer);
    }, [paused, telemetry.status]);


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
            <div style={header}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h1 style={title}>Live Tracker</h1>
                        <span style={aircraftBadge}>{aircraft.registration}</span>
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: 14 }}>
                        Real-time drone flight tracking and telemetry for {aircraft.model}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <StatusPill label={`Status: ${telemetry.status}`} tone={statusTone(telemetry.status)} />
                    <StatusPill label={`Mission Time: ${formatDuration(missionTime)}`} tone="neutral" />
                    <StatusPill label={`Images: ${imagesCaptured}`} tone="info" />
                </div>
            </div>

            <div style={mainGrid} className="lm-grid">
                <Card>
                    <div style={sectionTitle}>Aircraft Inspection View</div>
                    <div style={sectionSub}>Drone position relative to {aircraft.registration} during live scan</div>

                    <div style={{ height: spacing.md }} />

                    <DroneSimulationView
                        telemetry={telemetry}
                        paused={paused}
                    />

                    <div style={{ height: spacing.md }} />

                    <div style={buttonRow}>
                        {/* Hold / Resume — disabled once drone is no longer scanning */}
                        <button
                            type="button"
                            style={paused ? btnPrimary : btnSecondary}
                            onClick={togglePause}
                            disabled={telemetry.status === "Returning" || telemetry.status === "Landed"}
                        >
                            {paused ? "Resume Scan" : "Hold Position"}
                        </button>

                        {/* Abort — two-step confirmation, always available */}
                        <button
                            type="button"
                            style={abortPending ? btnAbortArmed : btnAbort}
                            onClick={handleAbortClick}
                        >
                            {abortPending ? "Confirm Abort?" : "Abort Mission"}
                        </button>
                    </div>
                </Card>

                <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
                    <Card>
                        <div style={sectionTitle}>Telemetry</div>
                        <div style={sectionSub}>Live sensor data from the drone</div>

                        <div style={{ height: spacing.md }} />

                        <Metric label="Battery" value={`${telemetry.battery}%`} />
                        <Bar value={telemetry.battery} tone={telemetry.battery < 20 ? "danger" : telemetry.battery < 40 ? "warn" : "ok"} />

                        <div style={{ height: spacing.md }} />

                        <Metric label="Signal" value={`${telemetry.signal}%`} />
                        <Bar value={telemetry.signal} tone={telemetry.signal < 30 ? "danger" : telemetry.signal < 55 ? "warn" : "ok"} />

                        <div style={{ height: spacing.md }} />

                        <div style={miniGrid}>
                            <MiniStat label="Altitude" value={`${telemetry.altitude} m`} />
                            <MiniStat label="Speed" value={`${telemetry.speed} m/s`} />
                            <MiniStat label="Latitude" value={`${telemetry.lat}`} mono />
                            <MiniStat label="Longitude" value={`${telemetry.lng}`} mono />
                        </div>
                    </Card>

                    <Card>
                        <div style={sectionTitle}>Images Captured</div>
                        <div style={sectionSub}>High-resolution photos collected at inspection waypoints</div>

                        <div style={{ height: spacing.md }} />

                        <div style={{
                            display: "flex", alignItems: "center", gap: 16,
                            padding: "14px 16px", borderRadius: 10,
                            background: "rgba(56,189,248,0.07)",
                            border: "1px solid rgba(56,189,248,0.18)",
                        }}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "rgba(56,189,248,0.9)", fontFamily: "monospace" }}>
                                {String(imagesCaptured).padStart(3, "0")}
                            </div>
                            <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>
                                images captured so far<br />
                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                                    Stored on-board — transferred after landing
                                </span>
                            </div>
                        </div>

                        <div style={{ height: spacing.md }} />

                        <div style={{
                            padding: "12px 14px", borderRadius: 10,
                            background: "rgba(247,201,72,0.07)",
                            border: "1px solid rgba(247,201,72,0.20)",
                            fontSize: 12, color: "rgba(247,201,72,0.80)", lineHeight: 1.6,
                        }}>
                            <span style={{ fontWeight: 700 }}>Note:</span> Defect detection is performed
                            offline after landing. Images are transferred from the drone and processed
                            through YOLOv11. Results will appear in Detection View once analysis is complete.
                        </div>
                    </Card>

                    <Card>
                        <div style={sectionTitle}>Mission Events</div>
                        <div style={sectionSub}>System and mission event log</div>

                        <div style={{ height: spacing.md }} />

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {events.map((e) => (
                                <EventRow key={e.id} e={e} />
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <style>{responsiveCss}</style>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ color: colors.textSecondary }}>{label}</div>
            <div style={{ color: colors.textPrimary, fontWeight: 800 }}>{value}</div>
        </div>
    );
}

function MiniStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div style={miniBox}>
            <div style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</div>
            <div
                style={{
                    marginTop: 8,
                    color: colors.textPrimary,
                    fontWeight: 800,
                    fontFamily: mono ? typography.monoFamily : typography.fontFamily,
                }}
            >
                {value}
            </div>
        </div>
    );
}

function EventRow({ e }: { e: MissionEvent }) {
    const tone = eventTone(e.severity);

    return (
        <div style={rowCard}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <span style={{ ...pillBase, background: tone.bg, borderColor: tone.border }}>
                    <span style={{ ...dotBase, background: tone.dot }} />
                    {e.severity}
                </span>
                <span style={{ color: colors.textSecondary, fontSize: 12, fontFamily: typography.monoFamily }}>
                    {e.time}
                </span>
            </div>

            <div style={{ marginTop: 8, color: colors.textPrimary, fontSize: 13 }}>{e.message}</div>
        </div>
    );
}

function StatusPill({
    label,
    tone,
}: {
    label: string;
    tone: "success" | "warn" | "danger" | "info" | "neutral";
}) {
    const map = {
        success: { bg: "rgba(61,220,151,0.12)", border: "rgba(61,220,151,0.28)", dot: colors.success },
        warn: { bg: "rgba(247,201,72,0.12)", border: "rgba(247,201,72,0.28)", dot: colors.warning },
        danger: { bg: "rgba(255,92,115,0.12)", border: "rgba(255,92,115,0.28)", dot: colors.danger },
        info: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.28)", dot: colors.primary },
        neutral: { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", dot: "rgba(255,255,255,0.55)" },
    } as const;

    const s = map[tone];

    return (
        <span style={{ ...pillBase, background: s.bg, borderColor: s.border }}>
            <span style={{ ...dotBase, background: s.dot }} />
            {label}
        </span>
    );
}

function Bar({ value, tone }: { value: number; tone: "ok" | "warn" | "danger" }) {
    const pct = clamp(value, 0, 100);
    const fill = tone === "danger" ? colors.danger : tone === "warn" ? colors.warning : colors.success;

    return (
        <div style={barTrack}>
            <div style={{ ...barFill, width: `${pct}%`, background: fill }} />
        </div>
    );
}

function statusTone(status: Telemetry["status"]) {
    if (status === "Scanning") return "success";
    if (status === "Holding") return "info";
    if (status === "Returning") return "warn";
    return "neutral";
}

function eventTone(severity: MissionEvent["severity"]) {
    if (severity === "Critical") return { bg: "rgba(255,92,115,0.12)", border: "rgba(255,92,115,0.28)", dot: colors.danger };
    if (severity === "Warning") return { bg: "rgba(247,201,72,0.12)", border: "rgba(247,201,72,0.28)", dot: colors.warning };
    return { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.28)", dot: colors.primary };
}

function moveToward(current: number, target: number, factor: number) {
    return current + (target - current) * factor;
}

function distDeg(lat1: number, lng1: number, lat2: number, lng2: number) {
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function formatDuration(totalSeconds: number) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
    background: "rgba(61,220,151,0.10)",
    border: "1px solid rgba(61,220,151,0.28)",
    color: colors.success,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.5px",
};

const mainGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.45fr 1fr",
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

const buttonRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.md,
};

const miniGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: spacing.md,
};

const rowCard: React.CSSProperties = {
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
};

const miniBox: React.CSSProperties = {
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.04)",
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

const barTrack: React.CSSProperties = {
    height: 10,
    borderRadius: radius.pill,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
};

const barFill: React.CSSProperties = {
    height: "100%",
    borderRadius: radius.pill,
    transition: "width 260ms ease",
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

// Abort — idle state (subtle red outline)
const btnAbort: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,92,115,0.35)",
    background: "rgba(255,92,115,0.08)",
    color: colors.danger,
    cursor: "pointer",
    fontWeight: typography.weight.bold,
    fontFamily: typography.fontFamily,
};

// Abort — armed / awaiting confirmation (bright red, pulsing)
const btnAbortArmed: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,92,115,0.75)",
    background: "rgba(255,92,115,0.25)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: typography.weight.bold,
    fontFamily: typography.fontFamily,
    animation: "abortPulse 0.7s ease-in-out infinite",
};

const responsiveCss = `
  @media (max-width: 1100px) {
    .lm-grid { grid-template-columns: 1fr !important; }
  }
  button:disabled { opacity: 0.38 !important; cursor: not-allowed !important; }
  @keyframes abortPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,92,115,0); }
    50%       { box-shadow: 0 0 0 6px rgba(255,92,115,0.28); }
  }
`;