// This default page will redirect to the login page.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push("/Login-page");
  }, [router]);

  return null;
}
