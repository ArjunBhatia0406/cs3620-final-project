"use client";

import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-200 flex flex-col">
      <Navbar />

      <div className="flex flex-col items-center justify-center flex-grow px-4 text-center">
        <h1 className="text-6xl font-extrabold text-stone-900 tracking-tight mb-6">
          Welcome to <span className="text-stone-700">Car Genie</span>
        </h1>

        <p className="text-lg text-stone-600 max-w-2xl leading-relaxed mb-10">
          The modern dealership toolkit. Manage vehicles, organize records, and streamline your workflow — all in one intuitive platform.
        </p>

        <button className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-lg hover:bg-black transition shadow-lg">
          Get Started
        </button>
      </div>
    </div>
  );
}
