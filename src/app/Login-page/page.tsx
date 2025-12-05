"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { signIn, useSession } from "@/library/auth-client";
import { Loader2, Mail } from "lucide-react";
import "./login-page.css";

export default function LoginPage() {
  const router = useRouter(); 
  const session = useSession(); 

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Sending authentication email...");

  useEffect(() => {
    if (!session.isPending && !!session.data) {
      router.push("/home");
    }
  }, [session, router]);

  const { register, handleSubmit } = useForm<{ email: string }>({});

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true); // show loading screen

    await signIn.magicLink(
      { email },
      {
        onRequest: () => console.log("sending"),
        onResponse: () => console.log("received response"),
        onSuccess: () => {
          console.log("link sent");
          setTimeout(() => {
            setMessage("✅ Authentication email sent! Please check your inbox.");
          }, 1500);
          // Optional: redirect to another page after a few seconds
          setTimeout(() => {
            router.push("/"); // change this to desired redirect page
          }, 4000);
        },
        onError: (ctx) => {
          console.error("failed to send: " + ctx);
          setMessage("❌ Failed to send authentication email. Please try again.");
          setTimeout(() => setLoading(false), 2000);
        },
      }
    );
  };

  // 🌀 Show loading screen while sending email
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Checking your credentials...
          </h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="flex justify-center">
            <Mail className="text-gray-400 w-8 h-8" />
          </div>
        </div>
      </div>
    );
  }

  // 🧠 Normal login page
  return (
    <div className="login-wrapper">
      <h1 className="grant-header">
        <img
          src="/logo(1).png"
          alt="logo"
          className="grant-icon"
        />
        GRANT TRACKER
      </h1>

      <form className="login-container" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-text-block">
          <h1 className="login-header">Welcome back!</h1>
          <h2 className="login-subtitle">Sign in with your email below</h2>
        </div>

        <input
          type="text"
          className="text-gray-800 w-full border-b-2"
          {...register("email", {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          })}
        />

        <button type="submit" className="login-button">
          Login with Email
        </button>
      </form>
    </div>
  );
}
