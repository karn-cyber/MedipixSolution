import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/lib/models";
import { visibleUploaderIds } from "@/lib/visibility";
import { isManager } from "@/lib/roles";
import { PlusIcon, CommentIcon } from "@/components/icons";

export default async function InvoicesPage() {
  const me = await requireUser();
  await dbConnect();

  const ids = await visibleUploaderIds(me);
  const filter = ids ? { uploaderId: { $in: ids } } : {};
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
        <Link href="/invoices/new" className="flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
          <PlusIcon size={16} /> Upload
        </Link>
      </div>
      <p className="text-sm text-slate-500">
        {isManager(me.role)
          ? "Your submissions plus everything from your team."
          : me.role === "ADMIN"
            ? "Every invoice across Medipix."
            : "Everything you've uploaded."}
      </p>

      {invoices.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-100">
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((inv) => (
            <li key={String(inv._id)}>
              <Link
                href={`/invoices/${inv._id}`}
                className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 active:bg-slate-50"
              >
                <img
                  src={`/api/invoices/${inv._id}/image`}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{inv.title || "Invoice"}</p>
                  <p className="text-xs text-slate-500">
                    {inv.uploaderName} ·{" "}
                    {new Date(inv.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                      Individual {inv.individualCount}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      Total {inv.totalCount}
                    </span>
                    {inv.comments.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <CommentIcon size={12} /> {inv.comments.length}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
