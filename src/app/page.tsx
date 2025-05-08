"use client";
import React from 'react';
import Navbar from "./Navbar";
//import Slideout from "./components/Slideout";
import Tags from './components/tags';



interface Grant {
  title: string;
  amount: string;
  openDate: string;
  dueDate: string;
  categories: string[][];
}

const grants: Grant[] = Array(7).fill({
  title: 'Lorem ipsum odor amet, consectetuer adipiscing elit.',
  amount: '$ 1,000',
  openDate: '01/01/25',
  dueDate: '01/01/25',
  categories: [
    ['#EF4444', 'TAG'],
    ['#22C55E', 'TAG'],
    ['#3B82F6', 'TAG'],
    ['#FACC15', 'TAG'],
  ],
});

const Tag = ({ color, label }: { color: string; label: string }) => (
  <span
    className="px-4 py-1 rounded-full text-xs font-semibold text-white"
    style={{ backgroundColor: color }}
  >
    {label}
  </span>
);

export default function GrantTracker() {
  return (

    <div className="p-6 bg-[#f5f5f5] min-h-screen font-sans text-black">
      {/* Header */}
      <Navbar/>

      {/* Sidebar */}
      {/* <div className="container mx-auto fixed top-0 right-0 h-screen w-64 bg-white shadow-lg z-50"/>
        <Slideout/> */ }

      {/* Main */}
      <section className="mt-10">
        <h1 className="text-3xl font-bold mb-6">Grant Tracker</h1>

        {/* Filter bar */}
        <div className="flex gap-4 mb-6">
          <input className="px-4 py-2 rounded-lg shadow text-sm w-40" placeholder="Sort by:" />
          <input className="px-4 py-2 rounded-lg shadow text-sm w-40" placeholder="Filter 1" />
          <input className="px-4 py-2 rounded-lg shadow text-sm w-40" placeholder="Filter 2" />
        </div>

        {/* Table */}
        <div className="bg-white shadow-lg rounded-xl overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Open Date</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Categories</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{grant.title}</td>
                  <td className="px-6 py-4 font-medium">{grant.amount}</td>
                  <td className="px-6 py-4">{grant.openDate}</td>
                  <td className="px-6 py-4">{grant.dueDate}</td>
                  <td className="px-6 py-4 flex gap-2 flex-wrap">
                    {grant.categories.map(([color, label], tagIdx) => (
                      <Tag key={tagIdx} color={color} label={label} />
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}