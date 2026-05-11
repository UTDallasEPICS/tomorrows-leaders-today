"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { signIn, useSession } from "@/library/auth-client";
import "./login-page.css";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (!session.isPending && !!session.data) {
      router.push("/home");
    }
  }, [session]);

  const { register, handleSubmit } = useForm<{ email: string }>({});

  const onSubmit = async ({ email }: { email: string }) => {
    setStatus("sending");
    await signIn.magicLink(
      { email },
      {
        onSuccess: () => setStatus("sent"),
        onError: (ctx: any) => {
          console.error("failed to send:", ctx);
          setStatus("idle");
        },
      },
    );
  };

  return (
    <div className="login-wrapper">
      <div className="grant-header">
        <img src="/logo(1).png" alt="TLT logo" className="grant-icon" />
        <span className="grant-title">Grant Tracker — TLT</span>
      </div>

      <div className="login-container">
        {status === "idle" && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "contents" }}
          >
            <p className="login-eyebrow">Sign in</p>
            <h1 className="login-header">Welcome back</h1>
            <p className="login-subtitle">
              Enter your email to receive a sign-in link
            </p>

            <label className="login-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="you@organization.org"
              {...register("email", {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              })}
            />

            <button type="submit" className="login-button">
              Continue with email
            </button>

            <p className="login-hint">
              A magic link will be sent to your inbox. No password needed.
            </p>
          </form>
        )}

        {status === "sending" && (
          <div className="login-status">
            <div className="login-spinner" />
            <p className="login-status-title">Sending your sign-in link...</p>
            <p className="login-status-sub">This will only take a moment.</p>
          </div>
        )}

        {status === "sent" && (
          <div className="login-status">
            <div className="login-check">✓</div>
            <p className="login-status-title">Check your inbox</p>
            <p className="login-status-sub">
              A sign-in link has been sent to your email address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
