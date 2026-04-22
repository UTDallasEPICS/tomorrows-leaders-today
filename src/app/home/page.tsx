import { PrismaClient } from '@prisma/client';
import React from 'react';
import Navbar from "../components/Navbar";
import GrantsTable from "./components/GrantsTable";
import { protect } from '@/library/auth';

const prisma = new PrismaClient();

export default async function Homepage() {
  await protect();

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
        <section className="mt-6 md:mt-8 max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Grant Tracker</h1>
          {/* GrantsTable now owns SearchBar internally */}
          <GrantsTable />
        </section>
      </div>
    </>
  );
}