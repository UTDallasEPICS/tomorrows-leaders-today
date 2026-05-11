"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        @font-face {
          font-family: 'Trajan Pro';
          src: url('/fonts/TrajanPro-Regular.otf') format('opentype');
          font-weight: normal;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-animate {
          opacity: 0;
          animation: fade-in 2.5s ease-out forwards;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0d0b00",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Montserrat', sans-serif",
          padding: "24px",
        }}
      >
        <div
          className="nf-animate"
          style={{
            animationDelay: "0ms",
            width: "100%",
            maxWidth: 480,
            height: 1,
            background: "#c9960c",
            marginBottom: 40,
          }}
        />

        <div
          className="nf-animate"
          style={{
            animationDelay: "80ms",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: "'Trajan Pro', serif",
              fontSize: "clamp(72px, 20vw, 120px)",
              fontWeight: 700,
              color: "#c9960c",
              lineHeight: 1,
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            404
          </span>
        </div>

        <div
          className="nf-animate"
          style={{
            animationDelay: "140ms",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#2a2000" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#4a3f20",
            }}
          >
            Page not found
          </span>
          <div style={{ flex: 1, height: 1, background: "#2a2000" }} />
        </div>

        <div
          className="nf-animate"
          style={{
            animationDelay: "200ms",
            textAlign: "center",
            marginBottom: 40,
            maxWidth: 340,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "#8a7a4a",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            The page you're looking for doesn't exist or has been moved. Head
            back to the tracker to continue.
          </p>
        </div>

        <div
          className="nf-animate"
          style={{
            animationDelay: "280ms",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            href="/home"
            style={{
              display: "inline-block",
              background: "#c9960c",
              color: "#0d0b00",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "13px 36px",
              textDecoration: "none",
              fontFamily: "'Montserrat', sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#a87c08")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#c9960c")}
          >
            Back to Grant Tracker
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: 12,
              color: "#4a3f20",
              textDecoration: "none",
              letterSpacing: "0.06em",
              fontFamily: "'Montserrat', sans-serif",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8a7a4a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4a3f20")}
          >
            Sign in instead
          </Link>
        </div>

        <div
          className="nf-animate"
          style={{
            animationDelay: "340ms",
            width: "100%",
            maxWidth: 480,
            height: 1,
            background: "#c9960c",
            marginTop: 40,
          }}
        />

        <div
          className="nf-animate"
          style={{
            animationDelay: "400ms",
            position: "absolute",
            bottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: 0.3,
          }}
        >
          <img
            src="/logo(2).png"
            alt=""
            aria-hidden="true"
            style={{ height: 64, width: "auto" }}
          />
          <span
            style={{
              fontFamily: "'Trajan Pro', serif",
              fontSize: 36,
              color: "#c9960c",
              letterSpacing: "0.12em",
            }}
          >
            TLT
          </span>
        </div>
      </div>
    </>
  );
}
