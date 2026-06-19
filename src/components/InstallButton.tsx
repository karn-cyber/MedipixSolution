"use client";

import { useEffect, useState } from "react";
import { CheckIcon, DownloadIcon } from "@/components/icons";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

declare global {
  interface Window {
    __bipEvent?: BIPEvent;
  }
}

type Platform = "android" | "ios" | "desktop";

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("android");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    // Pick up an event captured before this component mounted.
    if (window.__bipEvent) setDeferred(window.__bipEvent);

    const onReady = () => window.__bipEvent && setDeferred(window.__bipEvent);
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      window.__bipEvent = undefined;
    };
    window.addEventListener("bip-ready", onReady);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("bip-ready", onReady);
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-800">
        <CheckIcon size={16} /> Installed — open Medipix from your home screen.
      </p>
    );
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      window.__bipEvent = undefined;
      if (choice.outcome !== "accepted") setShowHelp(true);
    } else {
      // No native prompt available — guide the user through manual install.
      setShowHelp(true);
    }
  }

  const help =
    platform === "ios"
      ? "On iPhone (Safari): tap the Share button, then “Add to Home Screen”."
      : platform === "android"
        ? "In Chrome: tap the ⋮ menu (top-right), then “Add to Home screen” / “Install app”."
        : "In Chrome/Edge: click the install icon in the address bar, or the ⋮ menu → “Install Medipix”.";

  return (
    <div className="space-y-3">
      <button
        onClick={install}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-brand-700/20 active:scale-[0.99]"
      >
        <DownloadIcon size={20} />
        Download Medipix
      </button>

      {showHelp && (
        <div className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow ring-1 ring-slate-200">
          {help}
        </div>
      )}
      {!deferred && !showHelp && (
        <p className="text-center text-xs text-slate-400">
          Tap to install. On iPhone use Safari; on Android use Chrome.
        </p>
      )}
    </div>
  );
}
