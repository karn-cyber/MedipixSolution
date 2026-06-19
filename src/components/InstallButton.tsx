"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua));

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-800">
        ✓ Installed — open Medipix from your home screen.
      </p>
    );
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else if (isIOS) {
      setShowIOS(true);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={install}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-brand-700/20 active:scale-[0.99]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Download Medipix
      </button>

      {showIOS && (
        <div className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow ring-1 ring-slate-200">
          On iPhone: tap the <span className="font-semibold">Share</span> button in Safari, then{" "}
          <span className="font-semibold">“Add to Home Screen.”</span>
        </div>
      )}
      {!deferred && !isIOS && (
        <p className="text-center text-xs text-slate-400">
          Open in Chrome/Edge on Android, or Safari on iPhone, to install to your home screen.
        </p>
      )}
    </div>
  );
}
