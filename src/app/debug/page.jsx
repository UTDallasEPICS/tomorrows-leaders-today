export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-4">
      <h1 className="text-3xl font-bold">✅ Tailwind IS working — Debug Route</h1>
      <div className="w-10 h-10 bg-red-500" />
      <p className="text-red-500 underline italic font-mono text-xl">
        This should be red, underlined, italic, monospace, and large.
      </p>
      <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
        Test Button
      </button>
    </div>
  );
}
