"use client";

import { useMemo, useState, useTransition } from "react";
import { addTeamMember, removeTeamMember } from "@/app/actions";
import { UsersIcon, TrashIcon, PlusIcon } from "@/components/icons";

export type DirEntry = {
  id: string;
  name: string;
  email: string;
  role: string;
  managerName: string | null;
  /** true if this person reports directly to the current manager */
  direct: boolean;
};

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function TeamManager({
  members,
  directory,
  recruitLabel,
}: {
  members: DirEntry[];
  directory: DirEntry[];
  recruitLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? directory.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        )
      : directory;
    return list.slice(0, 50);
  }, [query, directory]);

  function onAdd(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await addTeamMember(id);
      setBusyId(null);
      if (!res.ok) setError(res.error ?? "Failed");
      else setQuery("");
    });
  }

  function onRemove(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await removeTeamMember(id);
      setBusyId(null);
      if (!res.ok) setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      {/* Current team */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
          <UsersIcon size={18} className="text-brand-700" /> My team ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">
            No members yet. Search below to add your first {recruitLabel}.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">
                    {m.name}
                    {m.role && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {m.role}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.email}</p>
                  {!m.direct && m.managerName && (
                    <p className="truncate text-[11px] text-slate-400">via {m.managerName}</p>
                  )}
                </div>
                {m.direct ? (
                  <button
                    onClick={() => onRemove(m.id)}
                    disabled={pending && busyId === m.id}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-rose-600 disabled:opacity-60"
                  >
                    <TrashIcon size={15} /> {pending && busyId === m.id ? "…" : "Remove"}
                  </button>
                ) : (
                  <span className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400">
                    indirect
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Searchable directory */}
      <section>
        <h2 className="mb-2 font-semibold text-slate-800">Add a member</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />

        {directory.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">
            No other users on the platform yet.
          </p>
        ) : results.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">
            No one matches “{query}”.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                  {u.managerName && (
                    <p className="truncate text-[11px] text-amber-600">
                      Currently reports to {u.managerName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onAdd(u.id)}
                  disabled={pending && busyId === u.id}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <PlusIcon size={15} /> {pending && busyId === u.id ? "Adding…" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!query && directory.length > results.length && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Showing {results.length} of {directory.length}. Search to narrow down.
          </p>
        )}
      </section>
    </div>
  );
}
