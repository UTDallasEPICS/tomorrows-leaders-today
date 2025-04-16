"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/ai-response-editor");
  }, [router]);

  useEffect(() => {
    router.push("/Login-page");
  }, [router]);

  return null; // No unnecessary UI, just redirects
}
