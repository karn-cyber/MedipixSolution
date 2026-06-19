import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice, User } from "@/lib/models";
import { descendantIds } from "@/lib/visibility";
import { isManager, isAdmin, ROLE_LABELS, type Role } from "@/lib/roles";
import { ArrowLeftIcon } from "@/components/icons";

export default async function MemberData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const me = await requireUser();
  if (!isManager(me.role) && !isAdmin(me.role)) redirect("/dashboard");

  await dbConnect();

  // Authorize: admins see anyone; managers see themselves and their subtree.
  if (!isAdmin(me.role)) {
    const allowed = new Set([String(me._id), ...(await descendantIds(me._id)).map(String)]);
    if (!allowed.has(id)) notFound();
  }

  const person = await User.findById(id).lean();
  if (!person) notFound();

  const invoices = await Invoice.find({ uploaderId: id }).sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-5">
      <Link href="/data" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        <ArrowLeftIcon size={16} /> Data
      </Link>

      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-800">
          {(person.name ?? "?")[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{person.name ?? "Unnamed"}</p>
          <p className="truncate text-xs text-slate-500">{person.email}</p>
          <p className="text-[11px] font-medium text-brand-700">
            {person.role ? ROLE_LABELS[person.role as Role] : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
          <p className="text-[11px] font-medium text-slate-500">invoices</p>
        </div>
      </div>

      <h2 className="font-semibold text-slate-800">Uploaded invoices</h2>
      {invoices.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-100">
          {person.name ?? "This member"} hasn&apos;t uploaded any invoices yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {invoices.map((inv) => (
            <li key={String(inv._id)}>
              <Link
                href={`/invoices/${inv._id}`}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              >
                <img
                  src={`/api/invoices/${inv._id}/image`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full bg-slate-100 object-cover"
                />
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium text-slate-800">{inv.title || "Invoice"}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(inv.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
