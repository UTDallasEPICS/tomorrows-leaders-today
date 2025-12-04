"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOut, useSession } from "@/library/auth-client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut();
    router.push("/Login-page");
  };

  const session = useSession();

  // dropdown state and outside-click handling
  const [showDropdown, setShowDropdown] = useState(false);
  const avatarRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!avatarRef.current) return;
      if (!avatarRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const getLinkClassName = (path) => {
    const baseClasses = "mont-font text-[28px] font-medium transition-colors";
    return `${baseClasses} ${
      pathname === path ? "text-[#B89A49]" : "text-white hover:text-[#B89A49]"
    }`;
  };

  const getMobileLinkClassName = (path) => {
    const baseClasses = "mont-font text-[24px] font-medium";
    return `${baseClasses} ${
      pathname === path ? "text-[#B89A49]" : "text-white hover:text-[#B89A49]"
    }`;
  };

  return (
    <>
      <nav className="bg-black shadow-md px-6 py-4 mb-10 h-[90px]">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-2">
            <img
              src="/logo(2).png"
              alt="Logo"
              className="h-20 w-auto"
            />
            <span className="tlt-font text-[50px] font-bold text-white">
              TLT
            </span>
          </div>

          <div className="hidden md:flex gap-4 items-center">
            <Link
              href="/home"
              className={getLinkClassName("/home")}
            >
              Grant Tracker
            </Link>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">
              |
            </span>
            <Link
              href="/history"
              className={getLinkClassName("/history")}
            >
              History
            </Link>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">
              |
            </span>
            {/* Profile avatar */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setShowDropdown((s) => !s)}
                className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden"
                aria-haspopup="true"
                aria-expanded={showDropdown}
              >
                {session?.data?.user?.image ? (
                  <img src={session.data.user.image} alt="avatar" className="w-8 h-8 object-cover" />
                ) : (
                  <span className="text-sm text-white">{(session?.data?.user?.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                )}
              </button>

              {showDropdown && (
                <div
                  className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md ring-1 ring-black/5 z-50 transform transition ease-out duration-150 origin-top-right"
                  style={{ animation: 'dropdown-appear 140ms ease-out' }}
                >
                  <ul className="py-1">
                    <li>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    </li>
                    <li>
                      <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                    </li>
                    <li>
                      <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 flex flex-col gap-2">
            <Link
              href="/home"
              className={getMobileLinkClassName("/home")}
            >
              Grant Tracker
            </Link>
            <Link
              href="/history"
              className={getMobileLinkClassName("/history")}
            >
              History
            </Link>
            <button
              onClick={handleSignOut}
              className="mont-font text-[24px] font-medium text-white hover:text-[#B89A49] text-left"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>

      <style jsx>{`
        @font-face {
          font-family: 'Trajan Pro';
          src: url('/fonts/TrajanPro-Regular.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        .tlt-font {
          font-family: 'Trajan Pro', serif;
        }

        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');

        .mont-font {
          font-family: 'Montserrat', sans-serif;
        }
        @keyframes dropdown-appear {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default Navbar;
