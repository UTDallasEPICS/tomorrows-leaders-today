'use client';
import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import SubmittedGrantsTable from './components/SubmittedGrantsTable';
import Dashboard from './components/Dashboard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
};

export default function HistoryPage() {
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
        { timestamp: "11/05/25 15:45 PM", userId: "1234", fromStatus: "Draft",  toStatus: "Applied" },
        { timestamp: "11/04/25 11:20 AM", userId: "1234", fromStatus: "Start",  toStatus: "Draft"   },
      ],
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
        { timestamp: "11/05/25 16:30 PM", userId: "1234", fromStatus: "Applied", toStatus: "Accepted" },
        { timestamp: "11/01/25 09:45 AM", userId: "1234", fromStatus: "Draft",   toStatus: "Applied"  },
      ],
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
        { timestamp: "11/04/25 14:20 PM", userId: "1234", fromStatus: "Applied", toStatus: "Rejected" },
        { timestamp: "10/30/25 11:15 AM", userId: "1234", fromStatus: "Draft",   toStatus: "Applied"  },
      ],
    },
  ]);

  // Search + filter state — owned here so Dashboard date filter and table stay in sync
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Application History Report', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 28);
    autoTable(doc, {
      head: [['Grant Name', 'Agency', 'Deadline', 'Funding', 'Status', 'Company']],
      body: grants.map(g => [g.grant, g.agency, g.deadline, g.fund, g.status, g.company]),
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [184, 154, 73], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25, halign: 'center' }, 5: { cellWidth: 45 } },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 35 },
    });
    const finalY = (doc as any).lastAutoTable.finalY || 35;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Applications: ${grants.length}`,                                      14, finalY + 23);
    doc.text(`Accepted: ${grants.filter(g => g.status === 'Accepted').length}`,           14, finalY + 30);
    doc.text(`Rejected: ${grants.filter(g => g.status === 'Rejected').length}`,           14, finalY + 37);
    doc.text(`Pending: ${grants.filter(g => g.status === 'Applied').length}`,             14, finalY + 44);
    doc.save(`Application_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
        <section className="mt-6 md:mt-8 max-w-7xl mx-auto">
          {/* Dashboard with date filter */}
          <Dashboard grants={grants} />

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Application History</h1>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#B89A49] hover:bg-[#A08940] text-white text-sm font-medium rounded-lg transition-colors shadow-sm self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>

          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-2 bg-white shadow rounded-md px-4 py-2.5 flex-1">
              <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className="bg-transparent outline-none border-none flex-1 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm shadow focus:outline-none focus:ring-1 focus:ring-[#B89A49]"
            >
              <option value="all">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <SubmittedGrantsTable
            grants={grants}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        </section>
      </div>
    </>
  );
}