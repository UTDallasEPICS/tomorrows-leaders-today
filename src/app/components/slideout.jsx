"use client";

import { useEffect } from "react";
import { Zilla_Slab, Montserrat } from "next/font/google";

const zilla = Zilla_Slab({ subsets: ["latin"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"] });

const INPUT_WIDTH = 240;
const BUTTON_COLOR = "#936FB1";
const BUTTON_HOVER = "#7e5fa2";
const SIDEBAR_BG = "#F7F4F4";

export default function Slideout({ isOpen, toggle }) {
  const isCollapsed = !isOpen;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isCollapsed) {
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed, toggle]);

  return (
    <div
      className={`transition-all duration-300 ease-in-out h-screen shrink-0 border-r border-gray-300`}
      style={{
        width: isCollapsed ? 60 : 300,
        backgroundColor: SIDEBAR_BG,
      }}
    >
      <div className="relative h-full flex flex-col items-center justify-center p-3">
        {/* Collapse Button */}
        {isCollapsed && (
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-pointer"
            aria-label="Expand sidebar"
            onClick={toggle}
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

        {/* Expanded Content */}
        {!isCollapsed && (
          <>
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center cursor-pointer"
              aria-label="Collapse sidebar"
              onClick={toggle}
              title="Close sidebar"
            >
              <span className="text-xl font-bold text-gray-600 hover:text-black">×</span>
            </button>

            {/* Sidebar Content */}
            <div className="mt-4 flex flex-col items-center p-4 w-full max-w-full">
              <h1 className={`text-2xl font-bold mb-5 self-start ${montserrat.className}`}>
                Search
              </h1>

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
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = BUTTON_HOVER)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = BUTTON_COLOR)
                }
              >
                Search
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
