//"use client";

import Image from "next/image";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 p-8 grid grid-cols-3 gap-8">
      {/* Left Column (1/3 width) */}
      <div className="col-span-1 space-y-6 sticky top-8 h-fit">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src="/icon.png"
                alt="Profile picture"
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">John Doe</h1>
            <p className="text-gray-600">Member since 2023</p>
          </div>

          {/* Basic Info Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              <button className="text-gray-500 hover:text-gray-700">
                {/* Simple pencil SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                  <path d="M2 2l7.586 7.586"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-gray-800">John Doe</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">john.doe@example.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-800">(123) 456-7890</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (2/3 width) */}
      <div className="col-span-2 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] pr-2">
        {/* Category Preferences Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Category Preferences</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">Education</span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full">Environment</span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full">Healthcare</span>
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">Arts</span>
          </div>
        </div>

        {/* Grant Fields Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Grant Fields</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Primary Field</p>
              <p className="text-gray-800">Education Technology</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Secondary Fields</p>
              <p className="text-gray-800">Environmental Conservation, Public Health</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Grant Size Preference</p>
              <p className="text-gray-800">$50,000 - $100,000</p>
            </div>
          </div>
        </div>

        {/* Uploaded Documents Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Uploaded Documents</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">501(c)(3) Certificate</p>
                <p className="text-sm text-gray-500">Uploaded: 01/15/2023</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800">Download</button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Financial Statements</p>
                <p className="text-sm text-gray-500">Uploaded: 02/28/2023</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800">Download</button>
            </div>
          </div>
        </div>

        {/* Foundations Contacted Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Foundations Contacted</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Gates Foundation</p>
                  <p className="text-sm text-gray-500">Education Initiative</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Active</span>
              </div>
              <p className="mt-2 text-sm">Last contacted: 03/15/2023</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Ford Foundation</p>
                  <p className="text-sm text-gray-500">Social Justice Program</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Pending</span>
              </div>
              <p className="mt-2 text-sm">Last contacted: 04/01/2023</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
