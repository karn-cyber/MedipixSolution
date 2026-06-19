import UploadForm from "@/components/UploadForm";

export default function NewInvoicePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Upload invoice</h1>
        <p className="text-sm text-slate-500">
          Snap a photo, enter the counts, and it&apos;s instantly visible to your manager.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
