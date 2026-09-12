import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `About | ${siteConfig.companyName}`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-ink">About {siteConfig.companyName}</h1>
      <p className="mt-2 text-sm font-medium text-brand-teal">
        Serving {siteConfig.serviceAreas.join(", ")} since {siteConfig.foundedYear}
      </p>
      <p className="mt-6 text-brand-ink-soft leading-relaxed">{siteConfig.heroSubhead}</p>
      <p className="mt-4 text-brand-ink-soft leading-relaxed">
        We serve {siteConfig.serviceAreas.join(", ")} and can be reached at{" "}
        <a href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`} className="text-brand-teal font-medium">
          {siteConfig.phone}
        </a>{" "}
        or{" "}
        <a href={`mailto:${siteConfig.email}`} className="text-brand-teal font-medium">
          {siteConfig.email}
        </a>
        .
      </p>
    </div>
  );
}
