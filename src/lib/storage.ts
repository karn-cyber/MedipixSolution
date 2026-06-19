import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";

// Invoice images live outside /public so they can be served access-controlled.
const UPLOAD_DIR = join(process.cwd(), "data", "uploads");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

export async function saveInvoiceImage(file: File): Promise<{ path: string; mime: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const ext = MIME_EXT[mime] ?? extname(file.name) ?? ".jpg";
  const name = `${randomUUID()}${ext}`;
  await writeFile(join(UPLOAD_DIR, name), buf);
  return { path: name, mime };
}

export async function readInvoiceImage(path: string): Promise<Buffer> {
  // Guard against path traversal — only a bare filename is valid.
  if (path.includes("/") || path.includes("..")) throw new Error("Invalid path");
  return readFile(join(UPLOAD_DIR, path));
}
