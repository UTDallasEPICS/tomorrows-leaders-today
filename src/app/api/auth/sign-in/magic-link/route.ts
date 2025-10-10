import { auth } from "@/library/auth";

export const POST = async (req: Request) => {
	try {
		const body = await req.json();

		// Enforce request body = { email: user_email@gmail.com}
		if (!body.email || !(body.email as string).match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
			throw "bad args";
		}

		const res = await auth.api.signInMagicLink({
			body: {
				email: body.email,
				name: "TLT",
				callbackURL: "/",
				newUserCallbackURL: "/",
			},
			headers: {}
		});

		console.log(res);

		return Response.json({ status: 200 });
	} catch (e) {
		return Response.json({ status: 400, message: e });
	}
}