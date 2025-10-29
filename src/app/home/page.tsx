import { PrismaClient } from '@prisma/client';
import React from 'react';
import Navbar from "../components/Navbar";
import { protect } from '@/library/auth';

// Define interfaces for type safety
interface GrantApplication {
  grantId: number;
  accountId: number;
  applicationDate: Date;
  status: string;
}

interface Grant {
  id: number;
  title: string;
  agency: string;
  openingDate?: Date;
  closingDate?: Date;
  category?: string;
  applicationType?: string;
  applications: GrantApplication[];
}

interface FormattedGrant {
  title: string;
  amount: string;
  openDate: string;
  dueDate: string;
  status: [string, string];
}

const prisma = new PrismaClient();

const Tag = ({ color, label }: { color: string; label: string }) => (
  <span className={`px-2 py-1 text-xs rounded-md text-white`} style={{ backgroundColor: color }}>
    {label}
  </span>
);

export default async function Homepage() {
  await protect();

  const grants = await prisma.grant.findMany({
    include: {
      applications: true,
    },
  }) as Grant[];

  const formatted: FormattedGrant[] = grants.map((grant: Grant) => {
    const status = grant.applications[0]?.status || 'Not Applied';
    return {
      title: grant.title,
      amount: '$ TBD',
      openDate: grant.openingDate?.toISOString().split('T')[0] ?? 'N/A',
      dueDate: grant.closingDate?.toISOString().split('T')[0] ?? 'N/A',
      status: ["gray", status],
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
                    <td className="px-6 py-4 whitespace-nowrap">{grant.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{grant.openDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{grant.dueDate}</td>
                    <td className="px-6 py-4 flex gap-2 flex-wrap">
                      <Tag color={grant.status[0]} label={grant.status[1]} />
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