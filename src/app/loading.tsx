export default function RootLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "hsl(220, 45%, 97%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <div
          role="status"
          aria-label="Loading AccessDiff"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "3px solid hsl(220, 22%, 40%)",
            background: "linear-gradient(135deg, hsl(12, 76%, 58%), hsl(176, 52%, 42%))",
            boxShadow: "3px 3px 0 0 hsl(222, 26%, 20%)",
            animation: "loadingPulse 1.2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: 220,
            height: 10,
            borderRadius: 999,
            background: "hsl(220, 35%, 94%)",
            border: "2px solid hsl(220, 20%, 66%)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              background: "hsl(12, 76%, 58%)",
              animation: "loadingSweep 1.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes loadingPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes loadingSweep {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  );
}
