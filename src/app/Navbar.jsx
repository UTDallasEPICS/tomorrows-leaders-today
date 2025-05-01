"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="bg-black shadow-md px-6 py-4 mb-10 h-[90px]">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-2">
            <img src="/logo(2).png" alt="Logo" className="h-20 w-auto" />
            <span className="tlt-font text-[50px] font-bold text-white">TLT</span>
          </div>

          <div className="hidden md:flex gap-4 text-white items-center">
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Grant Tracker</a>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">|</span>
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Ai Response Editor</a>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">|</span>
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Profile</a>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">|</span>
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Sign Out</a>
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation menu">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 flex flex-col gap-2 text-white">
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Grant Tracker</a>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">|</span>
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Ai Response Editor</a>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">|</span>
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Profile</a>
            <span className="mont-font text-white opacity-50 text-[28px] font-medium">|</span>
            <a href="#" className="mont-font text-[28px] font-medium hover:text-[#B89A49]">Sign Out</a>
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