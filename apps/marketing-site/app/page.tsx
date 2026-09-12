import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="text-sm font-semibold text-brand-teal uppercase tracking-wide">
          {siteConfig.serviceAreas.join(" · ")}
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-brand-ink max-w-2xl">
          {siteConfig.tagline}
        </h1>
        <p className="mt-6 text-lg text-brand-ink-soft max-w-xl">{siteConfig.heroSubhead}</p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark transition-colors"
          >
            Get a Free Quote
          </Link>
          <Link
            href="/services"
            className="rounded-full border border-brand-border px-6 py-3 text-sm font-semibold text-brand-ink hover:border-brand-teal transition-colors"
          >
            View Services
          </Link>
        </div>
      </section>

      <section className="bg-brand-teal-soft/40 border-y border-brand-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-brand-ink">What we offer</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {siteConfig.services.map((service) => (
              <div
                key={service.title}
                className="rounded-xl bg-background border border-brand-border p-6"
              >
                <h3 className="font-semibold text-brand-ink">{service.title}</h3>
                <p className="mt-2 text-sm text-brand-ink-soft">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-brand-ink">Ready to get started?</h2>
        <p className="mt-3 text-brand-ink-soft">
          Tell us a bit about your space and we&apos;ll get back to you with a quote.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark transition-colors"
        >
          Request a Quote
        </Link>
      </section>
    </>
  );
}
