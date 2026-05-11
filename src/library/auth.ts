import { prisma } from "./db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins/magic-link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const DATABASE_PROVIDER = "sqlite"; // "sqlite" | "cockroachdb" | "mysql" | "postgresql" | "sqlserver" | "mongodb"

const logo_url: string =
  "https://www.tltleaders.org/wp-content/uploads/2023/02/TLT2.png";

export const auth = betterAuth({
  appName: "auth-tlt",
  database: prismaAdapter(prisma, {
    provider: DATABASE_PROVIDER, // Change to
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
            pass: process.env.NODEMAILER_PASS,
          },
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
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Email Verification</title>
            </head>
            <body style="margin:0;padding:40px 16px;background:#111008;font-family:Arial,sans-serif;">

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #2a2000;">

                <!-- Header -->
                <tr>
                    <td style="background:#1a1200;padding:24px 40px;border-bottom:2px solid #c9960c;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                        <td style="vertical-align:middle;">
                            <img
                            src="${logo_url}"
                            alt="TLT Logo"
                            width="44"
                            height="44"
                            style="display:block;border-radius:50%;object-fit:cover;"
                            />
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                            <span style="font-size:13px;font-weight:bold;color:#e8b820;letter-spacing:0.1em;display:block;">
                            TLT — TOMORROW'S LEADERS TODAY
                            </span>
                        </td>
                        </tr>
                    </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 16px;font-size:12px;font-weight:bold;color:#c9960c;letter-spacing:0.1em;text-transform:uppercase;">Email Verification</p>
                    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111008;line-height:1.3;">Verify your email address</h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.7;">
                        Thank you for joining Tomorrow's Leaders Today. Click the button below to verify your email address and activate your account.
                    </p>
                    <a href="${url}" style="display:inline-block;background:#c9960c;color:#1a1200;font-size:13px;font-weight:bold;padding:14px 32px;text-decoration:none;letter-spacing:0.08em;border-radius:0;">
                        VERIFY MY EMAIL
                    </a>
                    <p style="margin:32px 0 0;font-size:13px;color:#999;line-height:1.6;">
                        Or copy and paste this link into your browser:<br/>
                        <span style="color:#c9960c;word-break:break-all;"><a href=${url} target="_blank" rel="noopener noreferrer">${url}</a></span>
                    </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="border-top:1px solid #eee;padding:16px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                        <td style="font-size:12px;color:#aaa;">This link expires in 24 hours.</td>
                        <td align="right" style="font-size:12px;color:#aaa;">If you didn't request this, ignore this email.</td>
                        </tr>
                    </table>
                    </td>
                </tr>

                </table>
            </td></tr>
            </table>

            </body>
            </html>
            `,
          });
        } catch (error) {
          console.error("Failed to send verification email:", error);
        }
      },
      disableSignUp: false,
    }),
  ],
  user: {
    additionalFields: {}, // If any additional User fields are needed for database, add them here (https://www.better-auth.com/docs/concepts/database#extending-core-schema)
    // Use pnpm exec @better-auth/cli generate to update schema
  },
});

export const protect = async () => {
  // Get session with betterauth API
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // Bad session, redirect to login
    redirect("/login");
  }

  return session;
};
