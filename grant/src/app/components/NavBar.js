"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  // Get the current route, e.g. "/pages/profile"
  const pathname = usePathname()

  // A small helper to decide if a route matches the current path
  function isActive(route) {
    return pathname === route
  }

  return (
    <div className="bg-gray-800 text-white py-8 px-6 flex items-center justify-between">
        
      {/* Left side: Logo (WIP) */}
      <h1 className="text-xl font-bold">TLT</h1>

      {/* Right side: Links */}
      <div className="flex space-x-6">
        <Link
          href="/pages/home"
          className={`cursor-pointer hover:underline ${
            isActive("/pages/grant") ? "font-bold" : ""
          }`}
        >
          Grant Tracker
        </Link>

        <Link
          href="/pages/home"
          className={`cursor-pointer hover:underline ${
            isActive("/pages/ai") ? "font-bold" : ""
          }`}
        >
          AI Response Editor
        </Link>

        <Link
          href="/pages/settings"
          className={`cursor-pointer hover:underline ${
            isActive("/pages/settings") ? "font-bold" : ""
          }`}
        >
          Settings
        </Link>

        <Link
            href="/pages/profile"
            className={`cursor-pointer hover:underline ${
                isActive("/pages/profile") ? "font-bold" : ""
            }`}
        >
            Profile
        </Link>
      </div>
    </div>
  )
}