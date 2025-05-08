"use client"; // Ensure this runs on the client side

import Home from "../components/Slideout"; // Adjust the path if your slideout component is in a different folder

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <Home />
    </div>
  );
}
