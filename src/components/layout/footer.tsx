import Link from "next/link";
import { CalendarDays, Instagram, Twitter } from "lucide-react";

const LINKS = {
  platform: [
    { href: "/events", label: "Events" },
    { href: "/about", label: "About Bridge" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-foreground">Bridge</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
              大阪の国際コミュニティ。
              <br />
              오사카 국제 커뮤니티.
              <br />
              International community in Osaka.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Platform
            </h3>
            <ul className="space-y-2">
              {LINKS.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              {LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bridge Osaka. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Osaka, Japan 🇯🇵</p>
        </div>
      </div>
    </footer>
  );
}
