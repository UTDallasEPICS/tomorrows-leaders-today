"use client";

import Home from "../components/Slideout";

export default function testPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <Home />
    </div>
  );
}