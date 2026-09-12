import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Services | ${siteConfig.companyName}`,
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-ink">Services</h1>
      <p className="mt-3 text-brand-ink-soft max-w-2xl">
        Serving {siteConfig.serviceAreas.join(", ")}.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {siteConfig.services.map((service) => (
          <div key={service.title} className="rounded-xl border border-brand-border p-6">
            <h2 className="font-semibold text-brand-ink text-lg">{service.title}</h2>
            <p className="mt-2 text-sm text-brand-ink-soft">{service.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/contact"
          className="inline-block rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark transition-colors"
        >
          Request a Quote
        </Link>
      </div>
    </div>
  );
}
