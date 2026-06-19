"use client";

import { useRef, useState, useTransition } from "react";
import { uploadInvoice } from "@/app/actions";
import { CameraIcon, ImageIcon, HashIcon, CommentIcon } from "@/components/icons";

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
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  function onSubmit(formData: FormData) {
    setError(null);
    if (!file) {
      setError("Please take a photo or choose an image of the invoice.");
      return;
    }
    startTransition(async () => {
      try {
        const compressed = await compress(file);
        formData.set("image", compressed);
        await uploadInvoice(formData);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return; // redirect on success — let Next handle it
        }
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {/* Hidden inputs: one forces the camera, one opens the gallery. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      {preview ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <img src={preview} alt="Invoice preview" className="max-h-80 w-full bg-slate-100 object-contain" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
            >
              <CameraIcon size={18} /> Retake
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
            >
              <ImageIcon size={18} /> Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-600"
          >
            <CameraIcon size={32} className="text-brand-700" />
            <span className="font-medium">Take photo</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-600"
          >
            <ImageIcon size={32} className="text-brand-700" />
            <span className="font-medium">Choose from gallery</span>
          </button>
        </div>
      )}

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
          <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <HashIcon size={15} /> Individual count
          </label>
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
          <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <HashIcon size={15} /> Total count
          </label>
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
        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <CommentIcon size={15} /> Comment (optional)
        </label>
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
