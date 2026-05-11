"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { signOut, useSession } from "@/library/auth-client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const avatarRef = useRef(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/Login-page");
  };

  useEffect(() => {
    function onDocClick(e) {
      if (!avatarRef.current) return;
      if (!avatarRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const initials = (session?.data?.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (path) => pathname === path;

  const navLink = (href, label) => (
    <Link
      href={href}
      style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 14,
        fontWeight: isActive(href) ? 600 : 400,
        color: isActive(href) ? "#c9960c" : "#d4c5a0",
        textDecoration: "none",
        letterSpacing: "0.04em",
        borderBottom: isActive(href) ? "1px solid #c9960c" : "1px solid transparent",
        paddingBottom: 2,
        transition: "color 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!isActive(href)) e.currentTarget.style.color = "#e8b820"; }}
      onMouseLeave={(e) => { if (!isActive(href)) e.currentTarget.style.color = "#d4c5a0"; }}
    >
      {label}
    </Link>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        @font-face {
          font-family: 'Trajan Pro';
          src: url('/fonts/TrajanPro-Regular.otf') format('opentype');
          font-weight: normal;
        }
        @keyframes dropdown-appear {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mobile-menu-appear {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-desktop { display: none; }
        .nav-hamburger { display: flex; }
        .nav-mobile-menu { display: flex; }
        @media (min-width: 768px) {
          .nav-desktop { display: flex !important; }
          .nav-hamburger { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
        .nav-signout:hover { background: #2a0d0d !important; }
        .nav-mobile-link:hover { color: #e8b820 !important; }
      `}</style>

      <nav style={{
        background: "#0d0b00",
        borderBottom: "1px solid #c9960c",
        padding: "0 24px",
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        marginBottom: 40,
        boxSizing: "border-box",
      }}>

        {/* Brand */}
        {isActive("/home") ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "default" }}>
            <img src="/logo(2).png" alt="TLT Logo" style={{ height: 56, width: "auto" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "'Trajan Pro', serif", fontSize: 24, fontWeight: 700, color: "#e8b820", letterSpacing: "0.12em" }}>TLT</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 500, color: "#8a7a4a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Grant Tracker</span>
            </div>
          </div>
        ) : (
          <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo(2).png" alt="TLT Logo" style={{ height: 56, width: "auto" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "'Trajan Pro', serif", fontSize: 24, fontWeight: 700, color: "#e8b820", letterSpacing: "0.12em" }}>TLT</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, fontWeight: 500, color: "#8a7a4a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Grant Tracker</span>
            </div>
          </Link>
        )}

        {/* Desktop nav — right side: links + avatar */}
        <div className="nav-desktop" style={{ alignItems: "center", gap: 24 }}>
          {navLink("/home", "Tracker")}
          <span style={{ color: "#2a2000", fontSize: 16 }}>|</span>
          {navLink("/history", "History")}
          <span style={{ color: "#2a2000", fontSize: 16 }}>|</span>

          <div style={{ position: "relative" }} ref={avatarRef}>
            <button
              onClick={() => setShowDropdown((s) => !s)}
              aria-haspopup="true"
              aria-expanded={showDropdown}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "1px solid #2a2000",
                padding: "5px 10px 5px 6px", cursor: "pointer",
                color: "#d4c5a0", fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#c9960c", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 700,
                color: "#0d0b00", overflow: "hidden", flexShrink: 0,
              }}>
                {session?.data?.user?.image
                  ? <img src={session.data.user.image} alt="avatar" style={{ width: 30, height: 30, objectFit: "cover" }} />
                  : initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.data?.user?.name || "Account"}
              </span>
              <ChevronDown size={13} style={{ opacity: 0.5, transform: showDropdown ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>

            {showDropdown && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "#1c1601", border: "1px solid #c9960c",
                minWidth: 180, zIndex: 200,
                animation: "dropdown-appear 140ms ease-out",
              }}>
                <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #2a2000" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#8a7a4a", fontFamily: "'Montserrat', sans-serif" }}>Signed in as</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#f5e6b8", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session?.data?.user?.email || "—"}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="nav-signout"
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: "none", border: "none",
                    cursor: "pointer", color: "#c46a6a", fontSize: 13,
                    fontFamily: "'Montserrat', sans-serif", fontWeight: 500,
                    textAlign: "left", boxSizing: "border-box",
                  }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          style={{ background: "none", border: "1px solid #2a2000", cursor: "pointer", color: "#d4c5a0", padding: "6px 8px", alignItems: "center" }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            background: "#0d0b00",
            borderBottom: "1px solid #c9960c",
            flexDirection: "column",
            marginTop: -40,
            marginBottom: 40,
            animation: "mobile-menu-appear 150ms ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 24px", borderBottom: "1px solid #1a1400" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#c9960c", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 700,
              color: "#0d0b00", overflow: "hidden", flexShrink: 0,
            }}>
              {session?.data?.user?.image
                ? <img src={session.data.user.image} alt="avatar" style={{ width: 36, height: 36, objectFit: "cover" }} />
                : initials}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f5e6b8", fontFamily: "'Montserrat', sans-serif" }}>
                {session?.data?.user?.name || "Account"}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#8a7a4a", fontFamily: "'Montserrat', sans-serif" }}>
                {session?.data?.user?.email || ""}
              </p>
            </div>
          </div>

          <Link href="/home" className="nav-mobile-link" style={{ padding: "14px 24px", fontFamily: "'Montserrat', sans-serif", fontSize: 15, color: isActive("/home") ? "#c9960c" : "#d4c5a0", fontWeight: isActive("/home") ? 600 : 400, textDecoration: "none", borderBottom: "1px solid #1a1400" }}>
            Tracker
          </Link>
          <Link href="/history" className="nav-mobile-link" style={{ padding: "14px 24px", fontFamily: "'Montserrat', sans-serif", fontSize: 15, color: isActive("/history") ? "#c9960c" : "#d4c5a0", fontWeight: isActive("/history") ? 600 : 400, textDecoration: "none", borderBottom: "1px solid #1a1400" }}>
            History
          </Link>
          <button
            onClick={handleSignOut}
            className="nav-signout"
            style={{
              padding: "14px 24px", background: "none", border: "none",
              cursor: "pointer", color: "#c46a6a", fontSize: 15,
              fontFamily: "'Montserrat', sans-serif", fontWeight: 500,
              textAlign: "left", display: "flex", alignItems: "center", gap: 8,
              boxSizing: "border-box", width: "100%",
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;