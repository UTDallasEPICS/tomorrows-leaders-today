"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "@/library/auth-client";
import "./login-page.css";

export default function LoginPage() {

  const router = useRouter(); // Interconnectivity with other pages
  const {
    register,
    handleSubmit
  } = useForm<{ email: string }>({});

  const onSubmit = async ({ email }: { email: string }) => {
    await signIn.magicLink({
      email: email
    }, {
      onRequest: () => console.log("sending"),
      onResponse: () => console.log("received response"),
      onSuccess: () => console.log("link sent"),
      onError: (ctx) => console.error("failed to send: " + ctx),
    })
  };

  return (
    <div className="login-wrapper">
      <h1 className="grant-header">
        <img
          src="/logo(1).png" // Replace with your actual path
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

        <input type="text" className="text-gray-800 w-full border-b-2" {...register("email", {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        })}></input>

        <button type="submit" className="login-button">
          Login with Email
        </button>
      </form>
    </div>
  );
}
