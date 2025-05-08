"use client";

import React from 'react';
import Navbar from "../components/Navbar";

interface Grant {
  title: string;
  amount: string;
  openDate: string;
  dueDate: string;
  categories: string[][];
}

const grants: Grant[] = Array(10).fill({
  title: 'Lorem ipsum odor amet, consectetuer adipiscing elit.',
  amount: '$ 1,000',
  openDate: '01/01/25',
  dueDate: '01/01/25',
  categories: [
    ['red', 'TAG'],
    ['green', 'TAG'],
    ['blue', 'TAG'],
    ['yellow', 'TAG'],
  ],
});

const Tag = ({ color, label }: { color: string; label: string }) => (
  <span className={`px-2 py-1 text-xs rounded-md text-white`} style={{ backgroundColor: color }}>
    {label}
  </span>
);

export default function GrantTracker() {
  return (
    <>
    
    <Navbar />

    <div className="p-6 bg-gray-100 min-h-screen">
      <header className="flex justify-between items-center bg-black text-white px-6 py-4 rounded-md">
        <div className="text-xl font-bold flex items-center gap-4">
          <img src="/logo.png" alt="TLT Logo" className="h-10 w-10" />
          <span className="text-white">TLT</span>
        </div>
        <nav className="space-x-6">
          <a className="text-yellow-400 font-semibold" href="#">Grant Tracker</a>
          <a href="#">AI Response Editor</a>
          <a href="#">Profile</a>
          <a href="#">Sign Out</a>
        </nav>
      </header>

      <section className="mt-8">
        <h1 className="text-3xl font-bold mb-4">Grant Tracker</h1>
        <div className="flex gap-4 mb-6">
          <input className="px-4 py-2 rounded shadow" placeholder="Sort by:" />
          <input className="px-4 py-2 rounded shadow" placeholder="" />
          <input className="px-4 py-2 rounded shadow" placeholder="" />
        </div>
        <div className="bg-white shadow rounded-md overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Open Date</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Categories</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-6 py-4 whitespace-nowrap">{grant.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{grant.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{grant.openDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{grant.dueDate}</td>
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
    </>
  );
}
