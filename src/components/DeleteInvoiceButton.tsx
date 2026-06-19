"use client";

import { useState, useTransition } from "react";
import { deleteInvoice } from "@/app/actions";
import { TrashIcon } from "@/components/icons";

export default function DeleteInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      try {
        await deleteInvoice(invoiceId);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return; // success redirect
        }
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-200"
      >
        <TrashIcon size={18} /> Delete invoice
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-200">
      <p className="text-sm font-medium text-rose-700">Delete this invoice permanently?</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={onDelete}
          disabled={pending}
          className="rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </div>
  );
}
