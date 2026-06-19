"use client";

import { useRef, useState, useTransition } from "react";
import { uploadInvoice } from "@/app/actions";

// Downscale a captured photo to keep uploads light for mobile data.
async function compress(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) return file;
  return new File([blob], "invoice.jpg", { type: "image/jpeg" });
}

export default function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function onSubmit(formData: FormData) {
    setError(null);
    if (!file) {
      setError("Please take or choose a photo of the invoice.");
      return;
    }
    startTransition(async () => {
      try {
        const compressed = await compress(file);
        formData.set("image", compressed);
        await uploadInvoice(formData);
      } catch (err) {
        // redirect() throws a special error that Next handles — ignore it.
        if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
          return;
        }
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <input
          ref={fileRef}
          type="file"
          name="image"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="hidden"
        />
        {preview ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="block w-full overflow-hidden rounded-2xl ring-1 ring-slate-200"
          >
            <img src={preview} alt="Invoice preview" className="max-h-80 w-full object-contain bg-slate-100" />
            <span className="block bg-white py-2 text-sm font-medium text-brand-700">Retake / choose another</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-500"
          >
            <span className="text-4xl">📷</span>
            <span className="font-medium">Tap to photograph the invoice</span>
            <span className="text-xs text-slate-400">or choose from gallery</span>
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Label (optional)</label>
        <input
          name="title"
          placeholder="e.g. Apollo Pharmacy — March"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Individual count</label>
          <input
            name="individualCount"
            type="number"
            min={0}
            defaultValue={1}
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Total count</label>
          <input
            name="totalCount"
            type="number"
            min={0}
            defaultValue={1}
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Comment (optional)</label>
        <textarea
          name="comment"
          rows={3}
          placeholder="Add any context before uploading…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-brand-700 px-5 py-4 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload invoice"}
      </button>
    </form>
  );
}
