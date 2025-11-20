"use client";

import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import SubmittedGrantsTable from './components/SubmittedGrantsTable';
import Dashboard from './components/Dashboard';

type StatusUpdate = {
    timestamp: string;
    userId: string;
    fromStatus: string;
    toStatus: string;
};

type Grant = {
    grant: string;
    agency: string;
    release: string;
    deadline: string;
    fund: string;
    status: 'Applied' | 'Rejected' | 'Accepted';
    company: string;
    description: string;
    website?: string;
    statusUpdates: StatusUpdate[];
}

export default function HistoryPage() {
  // Sample data - only submitted applications with status updates
  const [grants] = useState<Grant[]>([
    {
      grant: "Community Development Fund",
      agency: "Dell Foundation",
      release: "10/15/2025",
      deadline: "11/30/2025",
      fund: "$175,000",
      status: "Applied",
      company: "Dell Foundation: Community Support Initiative",
      description: "Supporting local community development through educational programs.",
      website: "https://dell.foundation/grants",
      statusUpdates: [
        {
          timestamp: "11/05/25 15:45 PM",
          userId: "1234",
          fromStatus: "Draft",
          toStatus: "Applied"
        },
        {
          timestamp: "11/04/25 11:20 AM",
          userId: "1234",
          fromStatus: "Start",
          toStatus: "Draft"
        }
      ]
    },
    {
      grant: "STEM Education Initiative",
      agency: "IBM Foundation",
      release: "08/01/2025",
      deadline: "10/15/2025",
      fund: "$200,000",
      status: "Accepted",
      company: "IBM Foundation: STEM Education Program",
      description: "Advancing STEM education in underserved communities.",
      website: "https://ibm.org/grants",
      statusUpdates: [
        {
          timestamp: "11/05/25 16:30 PM",
          userId: "1234",
          fromStatus: "Applied",
          toStatus: "Accepted"
        },
        {
          timestamp: "11/01/25 09:45 AM",
          userId: "1234",
          fromStatus: "Draft",
          toStatus: "Applied"
        }
      ]
    },
    {
      grant: "Digital Literacy Program",
      agency: "Microsoft Foundation",
      release: "07/01/2025",
      deadline: "09/30/2025",
      fund: "$150,000",
      status: "Rejected",
      company: "Microsoft Foundation: Digital Skills Initiative",
      description: "Enhancing digital literacy across educational institutions.",
      website: "https://microsoft.foundation/grants",
      statusUpdates: [
        {
          timestamp: "11/04/25 14:20 PM",
          userId: "1234",
          fromStatus: "Applied",
          toStatus: "Rejected"
        },
        {
          timestamp: "10/30/25 11:15 AM",
          userId: "1234",
          fromStatus: "Draft",
          toStatus: "Applied"
        }
      ]
    }
  ]);

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <section className="mt-8">
          <Dashboard grants={grants} />
          <h1 className="text-3xl font-bold mb-4">Application History</h1>
          <SubmittedGrantsTable grants={grants} />
        </section>
      </div>
    </>
  );
}