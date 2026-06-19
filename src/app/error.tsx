"use client";

import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <img src="/icons/icon-192.png" alt="Medipix" className="h-14 w-14 rounded-2xl" />
      <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
      <p className="max-w-xs text-sm text-slate-500">
        The app couldn&apos;t load. This is usually a brief connection issue — try again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
        >
          Reload
        </a>
      </div>
    </div>
  );
}
