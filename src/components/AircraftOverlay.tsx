

type Props = {
    drone: {
        lat: number;
        lng: number;
    };
};

export default function AircraftOverlay({ drone }: Props) {
    const centerLat = 25.2048;
    const centerLng = 55.2708;

    const scale = 80000;

    const x = (drone.lng - centerLng) * scale;
    const y = (drone.lat - centerLat) * -scale;

    return (
        <div
            style={{
                height: 520,
                borderRadius: 12,
                border: "1px solid #334155",
                background: "#0f172a",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: 120,
                }}
            >
                ✈️
            </div>

            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    fontSize: 30,
                    transition: "transform 0.8s ease",
                }}
            >
                🚁
            </div>
        </div>
    );
}