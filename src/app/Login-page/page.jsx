"use client";

import "./login-page.css";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    console.log("Google login clicked — waiting on API key");
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

      <div className="login-container">
        <div className="login-text-block">
          <h1 className="login-header">Welcome back!</h1>
          <h2 className="login-subtitle">Sign in below</h2>
        </div>

        <button className="login-button" onClick={handleGoogleLogin}>
            <div className="google-icon-wrapper">
            <img
                 src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google icon"
                className="google-icon"
                />
             </div>
                Login with Google
        </button>
      </div>
    </div>
  );
}
