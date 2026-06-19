import { Types } from "mongoose";
import { dbConnect } from "./db";
import { InvoiceImage } from "./models";

// Invoice images are stored in MongoDB (the InvoiceImage collection) rather than
// on the local filesystem, so uploads work on read-only / serverless hosts.

export async function saveInvoiceImage(
  invoiceId: Types.ObjectId,
  file: File,
): Promise<{ mime: string }> {
  await dbConnect();
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  await InvoiceImage.create({ invoiceId, data: buf, mime });
  return { mime };
}

export async function readInvoiceImage(
  invoiceId: Types.ObjectId | string,
): Promise<{ data: Buffer; mime: string } | null> {
  await dbConnect();
  // No .lean(): Mongoose hydrates the Buffer field to a real Node Buffer
  // (a lean read returns a raw BSON Binary instead).
  const doc = await InvoiceImage.findOne({ invoiceId });
  if (!doc) return null;
  return { data: Buffer.from(doc.data), mime: doc.mime };
}
