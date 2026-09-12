import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { QuoteForm } from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.companyName}`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-ink">Get a Quote</h1>
      <p className="mt-3 text-brand-ink-soft">
        Fill out the form and we&apos;ll get back to you shortly — or call{" "}
        <a href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`} className="text-brand-teal font-medium">
          {siteConfig.phone}
        </a>
        .
      </p>
      <div className="mt-8">
        <QuoteForm />
      </div>
    </div>
  );
}
