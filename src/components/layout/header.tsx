"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "HOME" },
  { href: "/events", label: "EVENTS" },
  { href: "/about", label: "ABOUT" },
];

const LANGS = [
  { code: "en", label: "English", href: "/" },
  { code: "ko", label: "한국어", href: "/" },
  { code: "ja", label: "日本語", href: "/" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight"
            style={{ color: "oklch(0.65 0.21 42)" }}
          >
            Bridge Osaka
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold tracking-wide text-gray-700 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language */}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {LANGS.map((lang, i) => (
                <span key={lang.code} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">|</span>}
                  <Link
                    href={lang.href}
                    className="hover:text-primary transition-colors"
                  >
                    {lang.label}
                  </Link>
                </span>
              ))}
            </div>

            {/* Login */}
            <Link
              href="/auth/login"
              className="rounded-full border-2 border-primary px-4 py-1 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-full border-2 border-primary px-3 py-1 text-xs font-semibold text-primary"
            >
              Login
            </Link>
            <button
              className="flex h-8 w-8 items-center justify-center text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-1 flex gap-3 px-3 text-sm text-gray-500">
              {LANGS.map((lang, i) => (
                <span key={lang.code} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">|</span>}
                  <Link href={lang.href} className="hover:text-primary">
                    {lang.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
