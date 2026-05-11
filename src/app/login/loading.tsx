"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSent(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#111008",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div
        style={{
          border: "1px solid #c9960c",
          background: "#1c1601",
          padding: "40px 36px",
          width: "100%",
          maxWidth: 400,
          boxSizing: "border-box" as const,
          textAlign: "center",
        }}
      >
        {!sent ? (
          <>
            <div
              style={{
                width: 32,
                height: 32,
                border: "2px solid #c9960c",
                borderTopColor: "transparent",
                borderRadius: "50%",
                margin: "0 auto 24px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#f5e6b8",
                fontWeight: 500,
              }}
            >
              Sending your sign-in link...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, color: "#c9960c", marginBottom: 16 }}>
              ✓
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 14,
                fontWeight: 700,
                color: "#f5e6b8",
              }}
            >
              Check your inbox
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#8a7a4a" }}>
              A sign-in link has been sent to your email address.
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
