"use client";

import React from 'react';
import GrantStatusEditor from './GrantStatusEditor';

export default function GrantStatusWrapper({ grantId, currentStatus }: { grantId: number; currentStatus?: string }) {
  return <GrantStatusEditor grantId={grantId} currentStatus={currentStatus} />;
}
