import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-teal-soft/40">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm text-brand-ink-soft">
        <div>
          <p className="font-semibold text-brand-ink">{siteConfig.companyName}</p>
          <p className="mt-2">{siteConfig.address.street}</p>
          <p>
            {siteConfig.address.city}, {siteConfig.address.state} {siteConfig.address.zip}
          </p>
        </div>
        <div>
          <p className="font-semibold text-brand-ink">Contact</p>
          <p className="mt-2">
            <a href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`} className="hover:text-brand-teal-dark">
              {siteConfig.phone}
            </a>
          </p>
          <p>
            <a href={`mailto:${siteConfig.email}`} className="hover:text-brand-teal-dark">
              {siteConfig.email}
            </a>
          </p>
          <p className="mt-2">{siteConfig.hours}</p>
        </div>
        <div>
          <p className="font-semibold text-brand-ink">Service Areas</p>
          <p className="mt-2">{siteConfig.serviceAreas.join(", ")}</p>
        </div>
      </div>
      <div className="border-t border-brand-border px-6 py-4 text-xs text-brand-ink-soft flex justify-between max-w-6xl mx-auto">
        <span>
          &copy; {new Date().getFullYear()} {siteConfig.companyName} · Est. {siteConfig.foundedYear}
        </span>
        <div className="flex gap-4">
          <a href="https://silaserv.com" className="hover:text-brand-teal-dark">
            Powered by SILAS
          </a>
          <Link href="/contact" className="hover:text-brand-teal-dark">
            Get a Quote
          </Link>
        </div>
      </div>
    </footer>
  );
}
