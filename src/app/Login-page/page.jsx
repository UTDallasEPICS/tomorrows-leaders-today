"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import "./login-page.css";

export default function LoginPage() {

  const router = useRouter(); // Interconnectivity with other pages
  const {
    register,
    handleSubmit
  } = useForm < { email: string } > ({});

  const handleGoogleLogin = () => {
    console.log("Google login clicked — waiting on API key");
    router.push("/home"); // Redirect to home page after login
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

      <form className="login-container">
        <div className="login-text-block">
          <h1 className="login-header">Welcome back!</h1>
          <h2 className="login-subtitle">Sign in with your email below</h2>
        </div>

        <input type="text" className="text-gray-800 w-full border-b-2"></input>

        <button className="login-button" onClick={handleGoogleLogin}>
          Login with Email
        </button>
      </form>
    </div>
  );
}
