"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/Test-page");
  }, [router]);

  return null; // No unnecessary UI, just redirects
} 