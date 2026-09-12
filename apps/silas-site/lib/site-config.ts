export interface SilasFeature {
  title: string;
  description: string;
}

export const silasConfig = {
  name: "SILAS",
  domain: "silaserv.com",
  tagline: "A distributed orchestration platform for stateful enterprise operations.",
  heroSubhead:
    "Isolated client-side context, deterministic Saga-based recovery, finite-resource leasing, and a cryptographically verifiable audit chain — coordinating stateful operations across heterogeneous systems.",
  portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.silaserv.com",
  clientPortalUrl: process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "https://clients.silaserv.com",
  features: [
    {
      title: "Lease-based resource arbitration",
      description:
        "Finite resources — equipment, access windows, crew capacity — get arbitrated through deterministic leases instead of ad hoc locking.",
    },
    {
      title: "Deterministic Saga recovery",
      description:
        "Multi-step operations recover through inverse actions computed deterministically, not brittle retry logic bolted on after the fact.",
    },
    {
      title: "Cryptographically verifiable audit chain",
      description:
        "Every state change is hash-chained into an append-only audit trail — tamper-evident by construction, not by policy.",
    },
  ] satisfies SilasFeature[],
};
