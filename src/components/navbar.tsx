"use client";

import React, { useState } from "react";
import Link from "next/link";
import LoginModal from "./loginmodal";
import Image from "next/image";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const logout = () => { };

  return (
    <>
      <div className="w-full h-20 bg-white flex items-center justify-between px-10 shadow-md border-b border-stone-300">

        <Link href="/">
          <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="rounded-full"
          />
        </Link>

        <div className="flex space-x-10 items-center">
          <Link href="/" className="text-stone-700 hover:text-black text-sm">
            Home
          </Link>

          <Link href="/scheduler" className="text-stone-700 hover:text-black text-sm">
            Schedule Service
          </Link>

          <Link href="/find-a-car" className="text-stone-700 hover:text-black text-sm">
            Find Your Car
          </Link>

          {!user ? (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-5 py-2 bg-stone-800 text-white text-sm rounded-xl hover:bg-black transition"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => setUser(null)}
              className="px-5 py-2 bg-stone-700 text-white text-sm rounded-xl hover:bg-black transition"
            >
              Sign Out ({user.email})
            </button>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        setUser={setUser}
      />
    </>
  );
}
