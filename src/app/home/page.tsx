import { PrismaClient } from '@prisma/client';
import React from 'react';
import Navbar from "../components/Navbar";
import GrantsTable from "./components/GrantsTable";
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
          <GrantsTable />
        </section>
      </div>
    </>
  );
}