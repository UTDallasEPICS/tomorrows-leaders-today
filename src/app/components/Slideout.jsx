"use client";
import { useEffect, useState } from "react";
import { Zilla_Slab, Montserrat } from "next/font/google";

const zilla = Zilla_Slab({ subsets: ["latin"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"] });

const SIDEBAR_WIDTH = 300;
const COLLAPSED_WIDTH = 60;
const SIDEBAR_HEIGHT = 500;
const INPUT_WIDTH = 240;
const BUTTON_COLOR = "#936FB1";
const BUTTON_HOVER = "#7e5fa2";
const SIDEBAR_BG = "#F7F4F4";

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed]);

  return (
    <div className={`flex h-screen p-5 bg-white text-[#171717] ${zilla.className}`}>
      {/* Sidebar */}
      <div
        className="rounded-[20px] p-3 transition-all duration-300 ease-in-out relative flex flex-col items-center justify-center"
        style={{
          backgroundColor: SIDEBAR_BG,
          width: isCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          height: SIDEBAR_HEIGHT,
        }}
      >
        {/* Collapse Button (only when collapsed, centered) */}
        {isCollapsed && (
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-pointer"
            aria-label="Expand sidebar"
            onClick={toggleCollapse}
          >
            <div
              className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[12px]"
              style={{
                borderLeftColor: "black",
                backgroundColor: "transparent",
              }}
            />
          </button>
        )}

        {/* Close Button (when expanded, top-right corner) */}
        {!isCollapsed && (
          <button
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center cursor-pointer"
            aria-label="Collapse sidebar"
            onClick={toggleCollapse}
            title="Close sidebar"
          >
            <span className="text-xl font-bold text-gray-600 hover:text-black">×</span>
          </button>
        )}

        {/* Sidebar Content */}
        {!isCollapsed && (
          <div className="mt-4 flex flex-col items-center p-4 w-full max-w-full">
            <h1 className={`text-2xl font-bold mb-5 self-start ${montserrat.className}`}>Search</h1>

            <div className="flex flex-col gap-4 mb-5 w-full items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col text-sm w-full items-start">
                  <label className="mb-1" htmlFor={`topic-${i}`}>
                    Topic {i}
                  </label>
                  <input
                    id={`topic-${i}`}
                    type="text"
                    placeholder={`Enter topic ${i}`}
                    className={`border border-gray-300 text-black px-4 w-full ${zilla.className}`}
                    style={{
                      height: 55,
                      borderRadius: 20,
                      maxWidth: INPUT_WIDTH,
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              className={`text-white transition w-full shadow-lg ${montserrat.className}`}
              style={{
                backgroundColor: BUTTON_COLOR,
                height: 55,
                borderRadius: 20,
                maxWidth: INPUT_WIDTH,
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = BUTTON_HOVER)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = BUTTON_COLOR)}
            >
              Search
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-5 bg-gray-100 p-6 rounded-lg overflow-auto">
        <h1 className="text-2xl font-semibold mb-2">Main Content Area</h1>
        <p className="text-gray-700">
          Click the triangle to collapse/expand the sidebar. Press Esc to close.
        </p>
      </div>
    </div>
  );
}
