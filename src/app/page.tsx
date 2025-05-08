import React from 'react';
import Navbar from './Navbar';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const Tag = ({ color, label }: { color: string; label: string }) => (
  <span
    className="px-4 py-1 rounded-full text-xs font-semibold text-white"
    style={{ backgroundColor: color }}
  >
    {label}
  </span>
);

export default async function GrantTracker() {
  const grants = await prisma.grants.findMany({
    include: {
      GrantTimelines: true,
    },
  });

  const formattedGrants = grants.map((grant) => {
    const open = grant.GrantTimelines.find(e => e.event_type === 'posted');
    const close = grant.GrantTimelines.find(e => e.event_type === 'closes');

    return {
      title: grant.title,
      amount: '$ TBD',
      openDate: open?.event_date?.toISOString().split('T')[0] ?? 'N/A',
      dueDate: close?.event_date?.toISOString().split('T')[0] ?? 'N/A',
      categories: [['#6B7280', grant.status ?? 'Unknown']],
    };
  });

  return (
    <div className="p-6 bg-[#f5f5f5] min-h-screen font-sans text-black">
      {/* Header */}
      <Navbar />

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
              {formattedGrants.map((grant, idx) => (
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
