"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";

export default function Loading() {
  const [message, setMessage] = useState("Sending authentication email...");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage("✅ Authentication email sent! Please check your inbox.");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Checking your credentials...
        </h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-center">
          <Mail className="text-gray-400 w-8 h-8" />
        </div>
      </div>
    </div>
  );
}
