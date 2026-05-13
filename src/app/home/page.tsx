import React from "react";
import Navbar from "../components/Navbar";
import GrantsView from "./components/GrantsView";
import { protect } from "@/library/auth";

export default async function Homepage() {
  await protect();

  return (
    <>
      <Navbar />
      <div className="bg-gray-100 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-5 flex items-end gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-none">
                Grant Tracker
              </h1>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[#B89A49]/40 to-transparent mb-1" />
          </div>
        </div>

        <div className="px-6 py-6">
          <GrantsView />
        </div>
      </div>
    </>
  );
}
