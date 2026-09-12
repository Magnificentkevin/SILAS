"use client";

import { useActionState } from "react";
import { submitQuoteRequest, type QuoteFormState } from "@/app/contact/actions";

const initialState: QuoteFormState = { status: "idle" };

export function QuoteForm() {
  const [state, formAction, isPending] = useActionState(submitQuoteRequest, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-brand-teal bg-brand-teal-soft/40 p-6 text-brand-ink">
        Thanks — we received your request and will be in touch shortly.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Service type" name="serviceType" placeholder="e.g. Office, Move-out" />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-ink mb-1" htmlFor="message">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-brand-teal-dark transition-colors disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Request a Quote"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-ink mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
      />
    </div>
  );
}
