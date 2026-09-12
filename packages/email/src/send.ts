import { getResendClient } from "./resend.js";
import {
  QuoteRequestAdminEmail,
  type QuoteRequestAdminEmailProps,
} from "./templates/QuoteRequestAdminEmail.js";
import {
  QuoteRequestConfirmationEmail,
  type QuoteRequestConfirmationEmailProps,
} from "./templates/QuoteRequestConfirmationEmail.js";

export interface QuoteRequestEmailInput {
  from: string;
  adminTo: string;
  customer: QuoteRequestAdminEmailProps;
  confirmation: QuoteRequestConfirmationEmailProps;
}

export async function sendQuoteRequestEmails({
  from,
  adminTo,
  customer,
  confirmation,
}: QuoteRequestEmailInput) {
  const resend = getResendClient();

  const [adminResult, confirmationResult] = await Promise.all([
    resend.emails.send({
      from,
      to: adminTo,
      replyTo: customer.email,
      subject: `New quote request — ${customer.name}`,
      react: QuoteRequestAdminEmail(customer),
    }),
    resend.emails.send({
      from,
      to: customer.email,
      subject: "We received your quote request",
      react: QuoteRequestConfirmationEmail(confirmation),
    }),
  ]);

  if (adminResult.error) {
    throw new Error(`Failed to send admin notification: ${adminResult.error.message}`);
  }
  if (confirmationResult.error) {
    throw new Error(`Failed to send customer confirmation: ${confirmationResult.error.message}`);
  }

  return { adminResult, confirmationResult };
}
