import React, { useState } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import LiveMission from "./pages/LiveMission";
import DetectionView from "./pages/DetectionView";
import ResultsReview from "./pages/ResultsReview";
import FleetView from "./pages/FleetView";
import FlightHistory from "./pages/FlightHistory";
import { colors } from "./ui/tokens";
import { FLEET } from "./data/fleetStore";

export type Page = "fleet" | "live" | "detection" | "review" | "history";
type AppState = "landing" | "login" | "app";

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [page, setPage] = useState<Page>("fleet");
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(FLEET[0].id);

  const selectedAircraft = FLEET.find((a) => a.id === selectedAircraftId) ?? FLEET[0];

  // ── Pre-auth screens ──────────────────────────────────────────────────────
  if (appState === "landing") {
    return <LandingPage onSignIn={() => setAppState("login")} />;
  }

  if (appState === "login") {
    return <Login onLogin={() => setAppState("app")} onBack={() => setAppState("landing")} />;
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div style={appShell}>
      <Sidebar
        current={page}
        onNavigate={setPage}
        selectedAircraft={selectedAircraft}
        onGoFleet={() => setPage("fleet")}
        onGoLanding={() => setAppState("landing")}
      />
      <main style={mainContent}>
        {page === "fleet" && (
          <FleetView
            selectedAircraftId={selectedAircraftId}
            onSelectAircraft={(id) => setSelectedAircraftId(id)}
            onNavigate={setPage}
          />
        )}
        {page === "live" && <LiveMission aircraft={selectedAircraft} />}
        {page === "detection" && <DetectionView aircraft={selectedAircraft} />}
        {page === "review" && (
          <ResultsReview aircraft={selectedAircraft} onGoHistory={() => setPage("history")} />
        )}
        {page === "history" && <FlightHistory aircraft={selectedAircraft} />}
      </main>
    </div>
  );
}

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
