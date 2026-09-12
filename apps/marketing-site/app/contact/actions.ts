"use server";

import { sendQuoteRequestEmails } from "@repo/email";
import { siteConfig } from "@/lib/site-config";

export interface QuoteFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitQuoteRequest(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const serviceType = String(formData.get("serviceType") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Please fill in your name, email, and a short message." };
  }

  try {
    await sendQuoteRequestEmails({
      from: `${siteConfig.companyName} <quotes@${siteConfig.domain}>`,
      adminTo: siteConfig.email,
      customer: { name, email, phone, serviceType, message },
      confirmation: {
        name,
        companyName: siteConfig.companyName,
        companyPhone: siteConfig.phone,
      },
    });
    return { status: "success" };
  } catch (error) {
    console.error("Failed to send quote request emails", error);
    return {
      status: "error",
      message: `Something went wrong — please call us at ${siteConfig.phone} instead.`,
    };
  }
}
