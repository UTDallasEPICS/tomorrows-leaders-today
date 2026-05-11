import React from "react";
import Navbar from "../components/Navbar";
import GrantsView from "./components/GrantsView";
import { protect } from "@/library/auth";

export default async function Homepage() {
  await protect();

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <section className="mt-8">
          <h1 className="text-3xl font-bold mb-4">Grant Tracker</h1>
          <GrantsView />
        </section>
      </div>
    </>
  );
}
