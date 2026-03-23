"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe, CalendarDays } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
];

const LANGS = [
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  const currentLangLabel = LANGS.find((l) => l.code === currentLang)?.label ?? "English";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Bridge</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language picker */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{currentLangLabel}</span>
              </button>

              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-border bg-white py-1 shadow-md">
                    {LANGS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setCurrentLang(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                          currentLang === lang.code
                            ? "text-primary font-medium"
                            : "text-foreground"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Auth buttons */}
            <Link
              href="/auth/login"
              className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Sign up
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex gap-1">
                {LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setMobileOpen(false);
                    }}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                      currentLang === lang.code
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-1">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
