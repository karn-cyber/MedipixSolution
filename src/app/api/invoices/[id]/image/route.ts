import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Invoice, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { readInvoiceImage } from "@/lib/storage";

// Serves an invoice image only to users allowed to see that invoice.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await getCurrentUser();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });

  await dbConnect();
  const invoice = await Invoice.findById(id);
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const uploader = await User.findById(invoice.uploaderId);
  const canView =
    me.role === "ADMIN" ||
    invoice.uploaderId.equals(me._id) ||
    (uploader?.managerId && uploader.managerId.equals(me._id));
  if (!canView) return new NextResponse("Forbidden", { status: 403 });

  const image = await readInvoiceImage(invoice._id);
  if (!image) return new NextResponse("Image unavailable", { status: 404 });

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime || invoice.imageMime || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
