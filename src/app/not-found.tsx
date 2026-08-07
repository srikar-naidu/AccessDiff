import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(220, 45%, 97%)",
        color: "hsl(222, 47%, 11%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: "2rem 2.25rem",
          background: "#fff",
          border: "3px solid hsl(220, 22%, 40%)",
          borderRadius: 22,
          boxShadow: "8px 8px 0 0 hsl(12, 76%, 58%)",
          textAlign: "center",
        }}
        role="alert"
      >
        <div
          style={{
            fontSize: "5rem",
            fontWeight: 800,
            letterSpacing: "-0.06em",
            background: "linear-gradient(100deg, hsl(12, 76%, 58%), hsl(176, 52%, 42%))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1,
            margin: "0 0 1rem",
          }}
        >
          404
        </div>
        <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
          This page sailed off the map
        </h1>
        <p style={{ margin: "0.6rem 0 1.5rem", color: "hsl(220, 15%, 38%)", lineHeight: 1.6 }}>
          The link might be broken or the page may have moved. Let&apos;s get you back to
          familiar waters.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              padding: "0.65rem 1.1rem",
              borderRadius: 12,
              border: "3px solid hsl(222, 26%, 20%)",
              background: "hsl(12, 76%, 58%)",
              color: "#fff",
              fontWeight: 700,
              boxShadow: "3px 3px 0 0 hsl(222, 26%, 20%)",
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            style={{
              padding: "0.65rem 1.1rem",
              borderRadius: 12,
              border: "3px solid hsl(220, 22%, 40%)",
              background: "#fff",
              color: "hsl(222, 47%, 11%)",
              fontWeight: 700,
              boxShadow: "3px 3px 0 0 hsl(220, 22%, 40%)",
              textDecoration: "none",
            }}
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
