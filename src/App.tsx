// src/App.tsx
import React, { useState } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MissionBriefing from "./pages/MissionBriefing";
import MissionReport from "./pages/MissionReport";
import Sidebar from "./components/Sidebar";
import type { AppPage } from "./components/Sidebar";
import LiveMission from "./pages/LiveMission";
import DetectionView from "./pages/DetectionView";
import ResultsReview from "./pages/ResultsReview";
import FleetView from "./pages/FleetView";
import FlightHistory from "./pages/FlightHistory";
import { colors, radius, spacing, typography } from "./ui/tokens";
import { FLEET, saveFlightRecord, generateAccessCode } from "./data/fleetStore";
import type { LiveDetection, HistoricalFinding, FlightRecord } from "./data/fleetStore";
import { getCurrentUser, logoutUser } from "./data/authStore";
import type { User } from "./data/authStore";
import { getDetectionsForAircraft } from "./data/demoDetections";

type AppState = "landing" | "login" | "register" | "app";

// Phase of a single aircraft's inspection mission
export type MissionPhase = "idle" | "briefing" | "live" | "complete";

// One entry per aircraft that has an in-progress or completed mission
interface MissionSession {
  phase: "briefing" | "live" | "complete";
  detections: LiveDetection[];
  reportData?: { detections: LiveDetection[]; seconds: number };
  // Set when drone launches so the same record is updated (not duplicated) on completion
  liveFlightId?: string;
  liveAccessCode?: string;
}

function defaultPage(role: User["role"]): AppPage {
  if (role === "Analyst") return "history";
  if (role === "Fleet Manager") return "fleet";
  return "fleet";
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() =>
    getCurrentUser() ? "app" : "landing",
  );
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [page, setPage] = useState<AppPage>(() => {
    const u = getCurrentUser();
    return u ? defaultPage(u.role) : "fleet";
  });
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(FLEET[0].id);

  // Independent mission state per aircraft — key = aircraftId
  const [missions, setMissions] = useState<Record<string, MissionSession>>({});

  const selectedAircraft = FLEET.find((a) => a.id === selectedAircraftId) ?? FLEET[0];

  // Derived phase for the currently selected aircraft
  const currentMission = missions[selectedAircraftId];
  const missionPhase: MissionPhase = currentMission?.phase ?? "idle";

  // ── Pre-auth screens ──────────────────────────────────────────────────────
  if (appState === "landing") {
    return <LandingPage onSignIn={() => setAppState("login")} />;
  }
  if (appState === "login") {
    return (
      <Login
        onLogin={(u) => { setUser(u); setPage(defaultPage(u.role)); setAppState("app"); }}
        onGoRegister={() => setAppState("register")}
        onBack={() => setAppState("landing")}
      />
    );
  }
  if (appState === "register") {
    return (
      <Register
        onRegistered={(u) => { setUser(u); setPage(defaultPage(u.role)); setAppState("app"); }}
        onGoLogin={() => setAppState("login")}
        onBack={() => setAppState("landing")}
      />
    );
  }
  if (!user) { setAppState("login"); return null; }

  // ── Mission handlers ──────────────────────────────────────────────────────

  function handleLogout() {
    logoutUser();
    setUser(null);
    setAppState("landing");
  }

  /** Fleet View → "Start Inspection" button */
  function handleStartInspection(aircraftId: string) {
    setSelectedAircraftId(aircraftId);
    setMissions((prev) => ({
      ...prev,
      [aircraftId]: { phase: "briefing", detections: getDetectionsForAircraft(aircraftId) },
    }));
    setPage("briefing");
  }

  /** Briefing → "Launch Mission" button */
  function handleLaunchDrone() {
    const flightId = `fl-live-${Date.now().toString(36).toUpperCase()}`;
    const accessCode = generateAccessCode();
    const today = new Date().toISOString().slice(0, 10);

    // Build findings from the aircraft-specific detections already loaded
    const findings: HistoricalFinding[] = getDetectionsForAircraft(selectedAircraftId).map((d, i) => ({
      id: d.id ?? `fnd-${flightId}-${i}`,
      flightId,
      aircraftId: selectedAircraftId,
      type: d.label,
      severity: d.severity,
      confidence: d.confidence,
      zone: d.zone,
      timestamp: d.timestamp,
      notes: `Detected during live inspection. Confidence: ${Math.round(d.confidence * 100)}%.`,
      resolved: false,
      reoccurrence: false,
    }));

    const record: FlightRecord = {
      id: flightId,
      aircraftId: selectedAircraftId,
      date: today,
      duration: "In Progress",
      pilotName: user!.name,
      engineer: user!.name,
      status: "Pending Review",
      findings,
      accessCode,
    };

    // Save immediately so analysts see it in Flight History right away
    saveFlightRecord(record);

    setMissions((prev) => ({
      ...prev,
      [selectedAircraftId]: {
        ...prev[selectedAircraftId]!,
        phase: "live",
        liveFlightId: flightId,
        liveAccessCode: accessCode,
      },
    }));
    setPage("live");
  }

  /** Briefing → "Cancel" button */
  function handleCancelBriefing() {
    setMissions((prev) => { const n = { ...prev }; delete n[selectedAircraftId]; return n; });
    setPage("fleet");
  }

  /** LiveMission fires this when the drone lands normally (Return Home).
   *  The drone only captures images — YOLOv11 runs offline after landing.
   *  We use the pre-loaded detections from the mission state (set at briefing)
   *  rather than anything generated during the live flight. */
  function handleMissionComplete(aircraftId: string, _liveDets: LiveDetection[], seconds: number) {
    const realDetections = missions[aircraftId]?.detections ?? getDetectionsForAircraft(aircraftId);
    const reportData = { detections: realDetections, seconds };
    setMissions((prev) => ({
      ...prev,
      [aircraftId]: { ...prev[aircraftId]!, phase: "complete", detections: realDetections, reportData },
    }));
    setSelectedAircraftId(aircraftId);
    setPage("report");
  }

  /** LiveMission → "Abort Mission" confirmed — wipes session, returns to fleet */
  function handleAbortMission(aircraftId: string) {
    setMissions((prev) => { const n = { ...prev }; delete n[aircraftId]; return n; });
    setPage("fleet");
  }

  /** Mission Report → "New Mission" button */
  function handleNewMission() {
    setMissions((prev) => { const n = { ...prev }; delete n[selectedAircraftId]; return n; });
    setPage("fleet");
  }

  // ── Derived data for Live Tracker ─────────────────────────────────────────
  // All aircraft IDs whose mission is currently "live"
  const liveMissionIds = Object.entries(missions)
    .filter(([, m]) => m.phase === "live")
    .map(([id]) => id);

  // Which aircraft tab is currently visible in the live view
  const liveViewId = liveMissionIds.includes(selectedAircraftId)
    ? selectedAircraftId
    : (liveMissionIds[0] ?? selectedAircraftId);

  // ── Main shell ────────────────────────────────────────────────────────────
  return (
    <div style={appShell}>
      <Sidebar
        current={page}
        onNavigate={(p) => setPage(p)}
        selectedAircraft={selectedAircraft}
        onGoFleet={() => setPage("fleet")}
        onGoLanding={() => setAppState("landing")}
        user={user}
        onLogout={handleLogout}
        missionPhase={missionPhase}
      />

      <main style={mainContent}>

        {page === "fleet" && (
          <FleetView
            selectedAircraftId={selectedAircraftId}
            onSelectAircraft={setSelectedAircraftId}
            onNavigate={setPage}
            onStartInspection={handleStartInspection}
            user={user}
          />
        )}

        {page === "briefing" && missionPhase === "briefing" && (
          <MissionBriefing
            aircraft={selectedAircraft}
            onLaunch={handleLaunchDrone}
            onCancel={handleCancelBriefing}
          />
        )}

        {/* ── Live Tracker ─────────────────────────────────────────────────────────
             IMPORTANT: this block is always mounted while missions are live,
             and only hidden via CSS when the user navigates away.
             Unmounting would destroy all React state (battery, timers, drone
             phase) — keeping it mounted preserves progress across page changes. */}
        {liveMissionIds.length > 0 && (
          <div style={{ display: page === "live" ? "flex" : "none", flexDirection: "column", gap: spacing.lg }}>

            {/* Multi-mission tab bar — only shown when >1 aircraft in the air */}
            {liveMissionIds.length > 1 && (
              <div style={tabBarWrap}>
                <span style={tabBarLabel}>ACTIVE MISSIONS</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {liveMissionIds.map((id) => {
                    const ac = FLEET.find((a) => a.id === id);
                    if (!ac) return null;
                    const active = id === liveViewId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedAircraftId(id)}
                        style={{
                          ...missionTabBtn,
                          borderColor: active ? "rgba(59,130,246,0.50)" : colors.border,
                          background: active ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.04)",
                          color: active ? colors.textPrimary : colors.textSecondary,
                        }}
                      >
                        <span style={livedot} />
                        {ac.registration}
                        <span style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 400 }}>
                          {ac.model}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Each live mission stays mounted; only the active one is visible */}
            {liveMissionIds.map((id) => {
              const ac = FLEET.find((a) => a.id === id) ?? selectedAircraft;
              return (
                <div key={id} style={{ display: id === liveViewId ? "block" : "none" }}>
                  <LiveMission
                    aircraft={ac}
                    pilotName={user.name}
                    onMissionComplete={(d, s) => handleMissionComplete(id, d, s)}
                    onAbort={() => handleAbortMission(id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {page === "report" && currentMission?.reportData && (
          <MissionReport
            aircraft={selectedAircraft}
            detections={currentMission.reportData.detections}
            missionSeconds={currentMission.reportData.seconds}
            pilotName={user.name}
            existingFlightId={currentMission.liveFlightId}
            existingAccessCode={currentMission.liveAccessCode}
            onViewHistory={() => setPage("history")}
            onNewMission={handleNewMission}
          />
        )}

        {page === "detection" && (
          <DetectionView
            aircraft={selectedAircraft}
            detections={currentMission?.detections ?? getDetectionsForAircraft(selectedAircraftId)}
          />
        )}

        {page === "review" && (
          <ResultsReview
            missionDetections={currentMission?.detections ?? getDetectionsForAircraft(selectedAircraftId)}
            missionAircraftId={selectedAircraftId}
            onGoHistory={() => setPage("history")}
          />
        )}

        {page === "history" && <FlightHistory aircraft={selectedAircraft} />}

      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const appShell: React.CSSProperties = {
  display: "flex",
  height: "100vh",
  width: "100vw",
  background: colors.background,
  overflow: "hidden",
};

const mainContent: React.CSSProperties = {
  flex: 1,
  padding: "28px 32px",
  overflowY: "auto",
};

const tabBarWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "10px 16px",
  borderRadius: radius.md,
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.border}`,
  flexWrap: "wrap",
};

const tabBarLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "rgba(255,255,255,0.30)",
  letterSpacing: "1.2px",
  whiteSpace: "nowrap",
};

const missionTabBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: typography.fontFamily,
  transition: "all 0.15s",
};

const livedot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: colors.success,
  display: "inline-block",
  flexShrink: 0,
};
