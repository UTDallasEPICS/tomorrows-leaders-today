import { prisma } from "./db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins/magic-link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
                        user: process.env.NODEMAILER_USER,
                        pass: process.env.NODEMAILER_PASS
                    }
                });
                try {
                await transporter.sendMail({
            from: `TLT-Tomorrow's Leaders Today <${process.env.NODEMAILER_USER}>`,
            to: email,
            subject: "Email Verification",
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                </head>
                <body style="margin:0; padding:0; background-color:#0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
                    <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #111111; border: 2px solid #d4af37;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 30px 20px; text-align: left; border-bottom: 1px solid #d4af37;">
                            <span style="font-size: 28px; font-weight: 800; color: #d4af37; letter-spacing: 4px; text-transform: uppercase; line-height: 1.2; display: block;">
                                TOMORROW'S<br>LEADERS<br>TODAY
                            </span>
                            <div style="height: 2px; background-color: #d4af37; margin-top: 20px; width: 60px;"></div>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 30px 30px; color: #e0e0e0; font-size: 16px; line-height: 24px;">
                            <p style="margin: 0 0 20px; font-weight: 300;">Welcome to the future of leadership.</p>
                            <p style="margin: 0 0 30px; font-weight: 300;">Verify your email address to activate your account and unlock your journey.</p>
                            <!-- Golden CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0;">
                                <tr>
                                <td align="left" style="background-color: #d4af37;">
                                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 36px; color: #0a0a0a; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; border: none; background-color: #d4af37; line-height: 1.2;">
                                    VERIFY EMAIL
                                    </a>
                                </td>
                                </tr>
                            </table>
                            <p style="margin: 30px 0 0; font-size: 12px; color: #888888; line-height: 18px;">
                                If you didn’t create an account with TLT, please ignore this email.<br>
                                This link will expire in 24 hours.
                            </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #333333; text-align: left;">
                            <span style="font-size: 11px; color: #666666; letter-spacing: 1px;">&copy; TLT - Tomorrow's Leaders Today</span>
                            </td>
                        </tr>
                        </table>
                    </td>
                    </tr>
                </table>
                </body>
                </html>
            `
            });
        } catch (error)
        {
            console.error("Failed to send verification email:", error);
        }
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