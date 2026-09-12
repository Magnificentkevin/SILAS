export interface ServiceOffering {
  title: string;
  description: string;
}

export interface SiteConfig {
  companyName: string;
  domain: string;
  foundedYear: number;
  tagline: string;
  heroSubhead: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  serviceAreas: string[];
  services: ServiceOffering[];
  hours: string;
}

export const siteConfig: SiteConfig = {
  companyName: "All Business Cleaning",
  domain: "allbusinesscleaning.com",
  foundedYear: 2020,
  tagline: "Commercial cleaning for offices and small businesses.",
  heroSubhead:
    "Reliable, detail-oriented cleaning for offices and small businesses — scheduled around your hours, backed by a team that shows up and gets it right the first time.",
  phone: "(941) 545-5494",
  email: "hello@allbusinesscleaning.com",
  address: {
    street: "4225 Willow Hammock Dr",
    city: "Palmetto",
    state: "FL",
    zip: "34221",
  },
  serviceAreas: ["Manatee County"],
  services: [
    {
      title: "Office & Small Business Cleaning",
      description:
        "Recurring janitorial service for offices and small businesses — daily, weekly, or on whatever schedule keeps your business running without interruption.",
    },
    {
      title: "Deep Cleaning & Sanitization",
      description:
        "Periodic deep cleans that go beyond standard janitorial — floors, upholstery, and high-touch surfaces get the attention routine cleaning skips.",
    },
    {
      title: "Move-In / Move-Out Cleaning",
      description:
        "Fast, thorough turnover cleaning between tenants — bring a space up to move-in standard on a timeline that works for your leasing schedule.",
    },
    {
      title: "Post-Construction Cleanup",
      description:
        "Detail-level cleanup after a build-out or renovation, from dust and debris to fixtures and floors, so the space is ready for occupancy on day one.",
    },
    {
      title: "Scheduled Maintenance Plans",
      description:
        "A recurring cleaning program built around your business — consistent crews, consistent standards, and a schedule that adapts as your needs change.",
    },
  ],
  hours: "Mon–Fri 8am–6pm",
};
