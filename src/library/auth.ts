import { prisma } from "./db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins/magic-link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "process";

const DATABASE_PROVIDER = "sqlite" // "sqlite" | "cockroachdb" | "mysql" | "postgresql" | "sqlserver" | "mongodb"

export const auth = betterAuth({
    appName: "auth-tlt",
    database: prismaAdapter(prisma, {
        provider: DATABASE_PROVIDER // Change to 
    }),
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                const mailer = await import("nodemailer"); // can't do this at top-level b/c middleware runs in Edge, and nodemailer does not.
                const transporter = mailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                        user: env.NODEMAILER_USER,
                        pass: env.NODEMAILER_PASS
                    }
                });
                transporter.sendMail({
                    from: `TLT-Tomorrow's Leaders Today <${env.NODEMAILER_USER}>`,
                    to: email,
                    subject: "Email Verification",
                    html: `Click the link to verify your email: ${url}`
                })
            },
            disableSignUp: false,
        }),
    ],
    user: {
        additionalFields: {}    // If any additional User fields are needed for database, add them here (https://www.better-auth.com/docs/concepts/database#extending-core-schema)
        // Use pnpm exec @better-auth/cli generate to update schema
    }
});

export const protect = async () => {
    // Get session with betterauth API
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        // Bad session, redirect to login
        redirect("/Login-page");
    }

    return session;
}