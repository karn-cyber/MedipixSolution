"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Surface the real error in the console for debugging on-device.
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <img src="/icons/icon-192.png" alt="Medipix" className="h-14 w-14 rounded-2xl" />
      <h1 className="text-lg font-bold text-slate-900">Couldn&apos;t load this page</h1>
      <p className="max-w-xs text-sm text-slate-500">
        Something went wrong — usually a brief network hiccup. Try again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
