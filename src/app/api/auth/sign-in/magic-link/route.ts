import { auth } from "@/library/auth";

export const POST = async (req: Request) => {
	try {
		const body = await req.json();

		// Enforce request body = { email: user_email@gmail.com}
		if (!body.email || !(body.email as string).match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
			throw "bad args";
		}

		console.log(process.env.APP_URL);

		const res = await auth.api.signInMagicLink({
			body: {
				email: body.email,
				name: "TLT",
				callbackURL: `${process.env.BETTER_AUTH_URL}/home`,
				newUserCallbackURL: `${process.env.BETTER_AUTH_URL}/home`,
				errorCallbackURL: process.env.BETTER_AUTH_URL
			},
			headers: {}
		});

		return Response.json({ status: 200 });
	} catch (e) {
		return Response.json({ status: 400, message: e });
	}
}