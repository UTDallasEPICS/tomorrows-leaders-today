"use client";

import React, { useState } from 'react';

export default function GrantStatusEditor({ grantId, currentStatus }: { grantId: number; currentStatus?: string }) {
  const [status, setStatus] = useState(currentStatus ?? 'open');
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/change-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, newStatus })
      });
      if (!res.ok) throw new Error('Failed to update');
      setStatus(newStatus);
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select value={status} onChange={(e) => updateStatus(e.target.value)} className="rounded-md p-1 bg-white text-black" disabled={loading}>
        <option value="open">Open</option>
        <option value="draft">Draft</option>
        <option value="submitted">Submitted</option>
        <option value="closed">Closed</option>
      </select>
      {loading && <span className="text-sm text-gray-500">Saving...</span>}
    </div>
  );
}
