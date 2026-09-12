export const CURRENT_BAA_TERMS_VERSION = 'v1';

/**
 * Placeholder standard terms text — the digest is generated over this string, so any
 * real wording change must accompany a bump of CURRENT_BAA_TERMS_VERSION.
 * Replace with legal-reviewed language before handling real healthcare-site business.
 */
export const STANDARD_BAA_TERMS_V1 = `
SILAS BUSINESS ASSOCIATE AGREEMENT — STANDARD TERMS (${CURRENT_BAA_TERMS_VERSION})

By accepting these terms, the signing party agrees to handle any protected health
information encountered while servicing the covered facility in accordance with
applicable healthcare privacy and security regulations, and authorizes SILAS to
retain a cryptographic record of this acceptance for audit purposes.
`.trim();
