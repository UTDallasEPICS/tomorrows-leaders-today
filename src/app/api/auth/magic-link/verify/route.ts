import { auth } from "@/library/auth";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
	try {
		const res = await auth.api.magicLinkVerify({
			query: {
				token: req.nextUrl.searchParams.get('token') as string,
				callbackURL: req.nextUrl.searchParams.get('callbackURL') as string
			},
			headers: {},
		});
	} catch (e: any) {
		console.log();
		if (e?.statusCode == 302 && e.headers?.get("location")) {
			return Response.redirect(e.headers.get("location") as string);
		} else {
			return Response.json(e);
		}
	}
}