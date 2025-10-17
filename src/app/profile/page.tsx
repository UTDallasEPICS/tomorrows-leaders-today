"use client";
import { SquarePen } from 'lucide-react';
import Image from "next/image";
import Navbar from "../components/Navbar";
import { useState } from "react";
import GrantFields from "./components/GrantFields";
import ProfileHeader from "./components/ProfileHeader";
import { FoundationsContacted } from "./components/FoundationsContacted";

export default function ProfilePage() {
  
  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Application History
        </h1>
      </div>
    </>
  );
}
