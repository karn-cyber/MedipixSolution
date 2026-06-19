"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

export default function BottomNav({ items, unread }: { items: Item[]; unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-brand-700" : "text-slate-400"
              }`}
            >
              <span className="text-xl leading-none">{it.icon}</span>
              {it.label}
              {it.href === "/notifications" && unread > 0 && (
                <span className="absolute right-1/2 top-1 translate-x-3 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
