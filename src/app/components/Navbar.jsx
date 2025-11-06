"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOut } from "@/library/auth-client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut();
    router.push("/Login-page");
  };

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
            <button
              onClick={handleSignOut}
              className="mont-font text-[28px] font-medium text-white hover:text-[#B89A49]"
            >
              Sign Out
            </button>
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
      `}</style>
    </>
  );
};

export default Navbar;
