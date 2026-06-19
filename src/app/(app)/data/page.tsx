import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice, User } from "@/lib/models";
import { descendantIds } from "@/lib/visibility";
import { isManager, isAdmin, ROLE_LABELS, type Role } from "@/lib/roles";
import { EyeIcon, TableIcon } from "@/components/icons";

export default async function DataPage() {
  const me = await requireUser();
  if (!isManager(me.role) && !isAdmin(me.role)) redirect("/dashboard");

  await dbConnect();

  // Scope: admins see everyone; managers see their whole subtree (+ themselves).
  const scopeIds = isAdmin(me.role) ? null : [me._id, ...(await descendantIds(me._id))];
  const userFilter = scopeIds ? { _id: { $in: scopeIds } } : {};

  const [users, counts] = await Promise.all([
    User.find(userFilter).sort({ name: 1 }).lean(),
    Invoice.aggregate([
      ...(scopeIds ? [{ $match: { uploaderId: { $in: scopeIds } } }] : []),
      { $group: { _id: "$uploaderId", n: { $sum: 1 }, last: { $max: "$createdAt" } } },
    ]),
  ]);

  const countById = new Map(counts.map((c) => [String(c._id), { n: c.n as number, last: c.last as Date }]));

  const rows = users
    .map((u) => {
      const stat = countById.get(String(u._id));
      return {
        id: String(u._id),
        name: u.name ?? "Unnamed",
        email: u.email ?? "",
        role: (u.role ?? "") as Role | "",
        count: stat?.n ?? 0,
        last: stat?.last ?? null,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const totalInvoices = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <TableIcon size={22} className="text-brand-700" /> Data
        </h1>
        <p className="text-sm text-slate-500">
          Invoices uploaded per member. Tap <span className="font-medium">View</span> to see their submissions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
          <p className="text-xs font-medium text-slate-500">Members</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-2xl font-bold text-slate-900">{totalInvoices}</p>
          <p className="text-xs font-medium text-slate-500">Total invoices</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Member</span>
          <span className="text-right">Invoices</span>
          <span className="sr-only">Action</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No members in your scope yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                    {r.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {r.role ? ROLE_LABELS[r.role] : "—"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-sm font-bold tabular-nums text-brand-800">
                  {r.count}
                </span>
                <Link
                  href={`/data/${r.id}`}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700"
                >
                  <EyeIcon size={16} /> View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
