"use client"

import { useRouter } from "next/navigation";
import { useSession } from "@/library/auth-client";
import { useEffect } from "react";

export const useProtected = () => {
	const router = useRouter();
	const session = useSession();

	useEffect(() => {
		if (!session.isPending && !session.data) {
			router.push("/Login-page")
		}
	}, [session]);
}