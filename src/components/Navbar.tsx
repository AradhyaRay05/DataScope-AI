"use client";

import { ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="white"
          />
        </svg>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <a
          href="#"
          className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] flex items-center gap-1 transition-colors"
        >
          Platform <ChevronDown className="w-4 h-4" />
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
        >
          Features
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
        >
          Documentation
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
        >
          Pricing
        </a>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="#"
          className="hidden sm:inline-block text-white/80 hover:text-white text-sm font-medium font-[family-name:var(--font-instrument-sans)] transition-colors"
        >
          GitHub
        </a>
        <a
          href="#"
          className="bg-white text-black rounded-full px-5 py-2.5 font-semibold text-sm font-[family-name:var(--font-instrument-sans)] hover:bg-white/90 transition-colors"
        >
          Get Started
        </a>
      </div>
    </nav>
  );
}
