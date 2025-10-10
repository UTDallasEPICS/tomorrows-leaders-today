import { prisma } from "./db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createTransport } from "nodemailer";
import { env } from "process";

const DATABASE_PROVIDER = "sqlite" // "sqlite" | "cockroachdb" | "mysql" | "postgresql" | "sqlserver" | "mongodb"

console.log(env.NODEMAILER_USER);

const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: env.NODEMAILER_USER,
        pass: env.NODEMAILER_PASS
    }
})

export const auth = betterAuth({
    appName: "auth-tlt",
    database: prismaAdapter(prisma, {
        provider: DATABASE_PROVIDER // Change to 
    }),
    emailAndPassword: {
        enabled: false
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            transporter.sendMail({
                from: `TLT-Tomorrow's Leaders Today <${env.NODEMAILER_USER}>`,
                to: user.email,
                subject: "Email Verification",
                html: `Click the link to verify your email: ${url}`
            })
        },
    }
})