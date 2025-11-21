"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Simple helper for POST calls
  const sendRequest = async (url: string, body: any) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return { ok: false, message: "Server error." };
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please fill out all fields.");
      return;
    }

    if (mode === "login") {
      const result = await sendRequest("/api/login", { email, password });
      result.ok ? toast.success("Login successful!") : toast.error(result.message);
      if (result.ok) onClose();
    } else {
      const result = await sendRequest("/api/register", { email, password });
      result.ok ? toast.success("Account created!") : toast.error(result.message);
      if (result.ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[28rem] rounded-2xl shadow-xl p-8 border border-stone-300 relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-stone-600 hover:text-black"
        >
          x
        </button>

        {/* Title */}
        <h2 className="text-3xl font-semibold text-stone-900 mb-6 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full border border-stone-300 rounded-xl px-4 py-3 mb-4 text-stone-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full border border-stone-300 rounded-xl px-4 py-3 mb-6 text-stone-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-stone-900 text-white rounded-xl hover:bg-black transition"
        >
          {mode === "login" ? "Login" : "Register"}
        </button>

        {/* Switch between login/register */}
        <p className="text-stone-700 text-center mt-4 text-sm">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("register")} className="text-stone-900 underline">
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-stone-900 underline">
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
