"use client";

import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-brand-border bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-brand-teal-dark">
          {siteConfig.companyName}
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-brand-ink-soft">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-teal-dark">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a
            href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
            className="hidden sm:block text-sm font-medium text-brand-ink-soft hover:text-brand-teal-dark"
          >
            {siteConfig.phone}
          </a>
          <Link
            href="/contact"
            className="hidden sm:block rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark transition-colors"
          >
            Get a Quote
          </Link>
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-brand-ink-soft hover:text-brand-teal-dark"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav
          id="mobile-nav"
          className="sm:hidden border-t border-brand-border px-6 py-4 flex flex-col gap-4 text-sm font-medium text-brand-ink-soft"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-brand-teal-dark"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
            className="hover:text-brand-teal-dark"
          >
            {siteConfig.phone}
          </a>
          <Link
            href="/contact"
            className="rounded-full bg-brand-teal px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-teal-dark transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Get a Quote
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
