"use client";

import { useRef, useState, useTransition } from "react";
import { addComment } from "@/app/actions";

export default function CommentForm({ invoiceId }: { invoiceId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addComment(invoiceId, formData);
      if (!res.ok) setError(res.error ?? "Failed");
      else formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-2">
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Add a comment…"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
