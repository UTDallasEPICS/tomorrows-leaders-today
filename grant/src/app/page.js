"use client";
import '../app/globals.css';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 p-4">
      {/* Header + Logo */}
      <img
          src="/images/whiteTLT.png"
          alt="TLT Logo 1"
          className="max-h-[80vh]
          w-6/12
          object-contain
          mb-8 rounded-lg"
        />
      <div className="mb-8 text-2xl font-bold text-white">Grant Tracker</div>

      {/* White Box */}
      <div className="w-full max-w-sm rounded-md bg-white p-6 shadow">
        <h1 className="mb-1 text-xl font-semibold text-gray-800">Welcome back!</h1>
        <p className="mb-6 text-gray-600">Sign in below</p>

        {/* Google Login Button */}
        <button className="flex w-full items-center justify-center gap-2 rounded bg-yellow-600 py-2 px-4 font-medium text-white hover:bg-yellow-700">
          <img
            src="/images/Google.png"
            alt="Google Icon"
            className="max-h-[80vh]
            w-6/12
            object-contain
            mb-8 rounded-lg"
          />
            <path
              fill="currentColor"
              d="M12 11.98v2.04h5.72c-.23 1.22-.93 2.26-1.97 2.95v2.44h3.2c1.87-1.73 2.95-4.28 2.95-7.42 0-.5-.04-.98-.1-1.45h-3.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.7 0 4.97-.9 6.62-2.42l-3.2-2.44c-.9.6-2.06.96-3.42.96-2.62 0-4.84-1.77-5.63-4.15H3.05v2.59C4.67 20.2 8.02 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M6.37 14.95a5.99 5.99 0 0 1 0-3.9v-2.6H3.05a10 10 0 0 0 0 9.1l3.32-2.6z"
            />
            <path
              fill="currentColor"
              d="M12 4.5c1.47 0 2.8.51 3.85 1.51l2.88-2.88C16.95 1.95 14.7 1 12 1 8.02 1 4.67 3.8 3.05 7.4l3.32 2.6C7.16 7.62 9.38 4.85 12 4.5z"
            />
          <span>Login with Google</span>
        </button>
      </div>
    </main>
  );
}
