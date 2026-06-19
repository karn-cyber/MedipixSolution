"use client";

import { useRef, useState, useTransition } from "react";
import { addTeamMember, removeTeamMember } from "@/app/actions";

type Member = { id: string; name: string; email: string; role: string };

export default function TeamManager({
  members,
  recruitLabel,
}: {
  members: Member[];
  recruitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onAdd(formData: FormData) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await addTeamMember(formData);
      if (!res.ok) setError(res.error ?? "Failed");
      else {
        setNotice("Member added and notified.");
        formRef.current?.reset();
      }
    });
  }

  function onRemove(id: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await removeTeamMember(id);
      if (!res.ok) setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-5">
      <form ref={formRef} action={onAdd} className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <label className="block text-sm font-semibold text-slate-700">Add a {recruitLabel}</label>
        <div className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="employee@gmail.com"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-slate-400">They must have signed in to Medipix at least once.</p>
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        {notice && <p className="text-sm font-medium text-brand-700">{notice}</p>}
      </form>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Team ({members.length})</h2>
        {members.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">
            No members yet. Add one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">
                  {m.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{m.name}</p>
                  <p className="truncate text-xs text-slate-500">{m.email} · {m.role}</p>
                </div>
                <button
                  onClick={() => onRemove(m.id)}
                  disabled={pending}
                  className="rounded-lg px-2 py-1 text-sm font-medium text-rose-600 disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
