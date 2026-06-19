import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Invoice } from "@/lib/models";
import { canViewUploader } from "@/lib/visibility";
import CommentForm from "@/components/CommentForm";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";
import { ArrowLeftIcon } from "@/components/icons";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const me = await requireUser();
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) notFound();

  const canView = await canViewUploader(me, invoice.uploaderId);
  if (!canView) notFound();

  const canDelete = me.role === "ADMIN" || String(invoice.uploaderId) === String(me._id);

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

      {canDelete && (
        <div className="pt-2">
          <DeleteInvoiceButton invoiceId={id} />
        </div>
      )}
    </div>
  );
}
