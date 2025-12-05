"use client";

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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Application History Report', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated on: ${currentDate}`, 14, 28);
    
    // Prepare table data
    const tableData = grants.map(grant => [
      grant.grant,
      grant.agency,
      grant.deadline,
      grant.fund,
      grant.status,
      grant.company
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Grant Name', 'Agency', 'Deadline', 'Funding', 'Status', 'Company']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: {
        fillColor: [184, 154, 73], // Gold color matching your theme
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Grant Name
        1: { cellWidth: 30 }, // Agency
        2: { cellWidth: 25 }, // Deadline
        3: { cellWidth: 25 }, // Funding
        4: { cellWidth: 25, halign: 'center' }, // Status
        5: { cellWidth: 45 } // Company
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 35 }
    });
    
    // Add summary section at the bottom
    const finalY = (doc as any).lastAutoTable.finalY || 35;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY + 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalApplications = grants.length;
    const acceptedCount = grants.filter(g => g.status === 'Accepted').length;
    const rejectedCount = grants.filter(g => g.status === 'Rejected').length;
    const pendingCount = grants.filter(g => g.status === 'Applied').length;
    
    doc.text(`Total Applications: ${totalApplications}`, 14, finalY + 23);
    doc.text(`Accepted: ${acceptedCount}`, 14, finalY + 30);
    doc.text(`Rejected: ${rejectedCount}`, 14, finalY + 37);
    doc.text(`Pending: ${pendingCount}`, 14, finalY + 44);
    
    // Save the PDF
    doc.save(`Application_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 min-h-screen">
        <section className="mt-8">
          <Dashboard grants={grants} />
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Application History</h1>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#B89A49] hover:bg-[#A08940] text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              Export PDF
            </button>
          </div>
          <SubmittedGrantsTable grants={grants} />
        </section>
      </div>
    </>
  );
}