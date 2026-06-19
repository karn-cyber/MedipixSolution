import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice, User } from "@/lib/models";
import CommentForm from "@/components/CommentForm";
import { ArrowLeftIcon } from "@/components/icons";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const me = await requireUser();
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) notFound();

  const uploader = await User.findById(invoice.uploaderId).lean();
  const canView =
    me.role === "ADMIN" ||
    String(invoice.uploaderId) === String(me._id) ||
    (uploader?.managerId && String(uploader.managerId) === String(me._id));
  if (!canView) notFound();

  return (
    <div className="space-y-5">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        <ArrowLeftIcon size={16} /> Invoices
      </Link>

      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <img
          src={`/api/invoices/${id}/image`}
          alt={invoice.title || "Invoice"}
          className="max-h-[60vh] w-full bg-slate-100 object-contain"
        />
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{invoice.title || "Invoice"}</h1>
        <p className="text-sm text-slate-500">
          Uploaded by {invoice.uploaderName} ·{" "}
          {new Date(invoice.createdAt).toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <p className="text-2xl font-bold text-slate-900">{invoice.individualCount}</p>
          <p className="text-xs font-medium text-slate-500">Individual count</p>
        </div>
        <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
          <p className="text-2xl font-bold text-brand-800">{invoice.totalCount}</p>
          <p className="text-xs font-medium text-brand-700">Total count</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-slate-800">Comments ({invoice.comments.length})</h2>
        {invoice.comments.length === 0 ? (
          <p className="text-sm text-slate-400">No comments yet.</p>
        ) : (
          <ul className="space-y-2">
            {invoice.comments.map((c) => (
              <li key={String(c._id)} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{c.authorName}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
        <CommentForm invoiceId={id} />
      </div>
    </div>
  );
}
