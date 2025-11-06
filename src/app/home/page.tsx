import { PrismaClient } from '@prisma/client';
import React from 'react';
import Navbar from "../components/Navbar";
import dynamic from 'next/dynamic';
const GrantStatusEditor = dynamic(() => import('../components/GrantStatusEditor'), { ssr: false });

// Define interfaces for type safety
interface Timeline {
  eventType: string;
  eventDate?: Date;
}

interface Grant {
  id: number;
  title: string;
  status?: string;
  timelines: Timeline[];
}

interface FormattedGrant {
  title: string;
  amount: string;
  openDate: string;
  dueDate: string;
  categories: [string, string][];
  id?: number;
  status?: string;
}

const prisma = new PrismaClient();

const Tag = ({ color, label }: { color: string; label: string }) => (
  <span className={`px-2 py-1 text-xs rounded-md text-white`} style={{ backgroundColor: color }}>
    {label}
  </span>
);

export default async function Homepage() {
  const grants = await prisma.grant.findMany({
    include: {
      timelines: true,
    },
  }) as Grant[];

  const formatted: FormattedGrant[] = grants.map((grant: Grant) => {
    const open = grant.timelines.find((e: Timeline) => e.eventType === 'posted');
    const close = grant.timelines.find((e: Timeline) => e.eventType === 'closes');
    return {
      title: grant.title,
      id: grant.id,
      status: grant.status,
      amount: '$ TBD',
      openDate: open?.eventDate?.toISOString().split('T')[0] ?? 'N/A',
      dueDate: close?.eventDate?.toISOString().split('T')[0] ?? 'N/A',
      categories: [['gray', grant.status ?? 'Unknown']] as [string, string][],
    };
  });

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <section className="mt-8">
          <h1 className="text-3xl font-bold mb-4">Grant Tracker</h1>
          <div className="bg-white shadow rounded-md overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3">Title</th>
                          <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Open Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Categories</th>
                </tr>
              </thead>
              <tbody>
                {formatted.map((grant, idx: number) => (
                  <tr key={idx} className="border-t">
                            <td className="px-6 py-4 whitespace-nowrap">{grant.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap"><GrantStatusEditor grantId={grant['id'] ?? 0} currentStatus={grant['status']} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">{grant.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{grant.openDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{grant.dueDate}</td>
                    <td className="px-6 py-4 flex gap-2 flex-wrap">
                      {grant.categories.map(([color, label]: [string, string], tagIdx: number) => (
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
