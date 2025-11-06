"use client";

import React from 'react';
import Navbar from "../components/Navbar";
import SubmittedGrantsTable from './components/SubmittedGrantsTable';
import { protect } from "@/library/auth";

export default function HistoryPage() {
  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <section className="mt-8">
          <h1 className="text-3xl font-bold mb-4">Application History</h1>
          <SubmittedGrantsTable />
        </section>
      </div>
    </>
  );
}