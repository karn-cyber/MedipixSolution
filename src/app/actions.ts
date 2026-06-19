"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Invoice, InvoiceImage, Notification, User } from "@/lib/models";
import { requireUser } from "@/lib/auth";
import { saveInvoiceImage } from "@/lib/storage";
import { canViewUploader } from "@/lib/visibility";
import { ROLES, recruitableRole, isManager, ROLE_LABELS, type Role } from "@/lib/roles";

type ActionResult = { ok: boolean; error?: string };

/* --------------------------- Onboarding -------------------------- */
export async function completeOnboarding(formData: FormData): Promise<void> {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;

  if (!name) throw new Error("Name is required");
  if (!ROLES.includes(role) || role === "ADMIN") throw new Error("Pick a valid role");

  await dbConnect();
  await User.updateOne({ _id: me._id }, { $set: { name, role, onboarded: true } });
  redirect("/dashboard");
}

/* ------------------------- Invoice upload ------------------------ */
export async function uploadInvoice(formData: FormData): Promise<void> {
  const me = await requireUser();
  await dbConnect();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) throw new Error("An invoice photo is required");

  const title = String(formData.get("title") ?? "").trim() || undefined;
  const initialComment = String(formData.get("comment") ?? "").trim();
  const mime = file.type || "image/jpeg";

  const comments = initialComment
    ? [{ authorId: me._id, authorName: me.name ?? "Unknown", body: initialComment, createdAt: new Date() }]
    : [];

  const invoice = await Invoice.create({
    uploaderId: me._id,
    uploaderName: me.name ?? "Unknown",
    imageMime: mime,
    title,
    comments,
  });

  // Persist the photo bytes to MongoDB; roll back the invoice if it fails.
  try {
    await saveInvoiceImage(invoice._id, file);
  } catch (e) {
    await Invoice.deleteOne({ _id: invoice._id });
    throw e;
  }

  // Notify the uploader's manager that a new invoice is visible to them.
  if (me.managerId) {
    await Notification.create({
      userId: me.managerId,
      message: `${me.name ?? "A team member"} uploaded a new invoice${title ? `: ${title}` : ""}.`,
      link: `/invoices/${invoice._id}`,
    });
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice._id}`);
}

/* --------------------------- Comments ---------------------------- */
export async function addComment(invoiceId: string, formData: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Comment can't be empty" };

  await dbConnect();
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found" };

  // Visibility check: uploader, anyone above them in the hierarchy, or admin.
  const canView = await canViewUploader(me, invoice.uploaderId);
  if (!canView) return { ok: false, error: "Not allowed" };

  invoice.comments.push({
    _id: new Types.ObjectId(),
    authorId: me._id,
    authorName: me.name ?? "Unknown",
    body,
    createdAt: new Date(),
  });
  await invoice.save();

  // Notify the uploader if someone else commented.
  if (!invoice.uploaderId.equals(me._id)) {
    await Notification.create({
      userId: invoice.uploaderId,
      message: `${me.name ?? "Someone"} commented on your invoice.`,
      link: `/invoices/${invoice._id}`,
    });
  }

  revalidatePath(`/invoices/${invoiceId}`);
  return { ok: true };
}

/* --------------------------- Delete ------------------------------ */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const me = await requireUser();
  await dbConnect();

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) redirect("/invoices");

  // Only the original uploader or an admin may delete.
  const canDelete = me.role === "ADMIN" || invoice.uploaderId.equals(me._id);
  if (!canDelete) throw new Error("You can't delete this invoice");

  await InvoiceImage.deleteOne({ invoiceId: invoice._id });
  await Invoice.deleteOne({ _id: invoice._id });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}

/* ----------------------- Team management ------------------------- */
export async function addTeamMember(userId: string): Promise<ActionResult> {
  const me = await requireUser();
  if (!isManager(me.role)) return { ok: false, error: "Only managers can add members" };

  const targetRole = recruitableRole(me.role);
  if (!targetRole) return { ok: false, error: "Your role can't recruit members" };

  if (!userId) return { ok: false, error: "Pick a member to add" };

  await dbConnect();
  const member = await User.findById(userId).catch(() => null);
  if (!member) {
    return { ok: false, error: "That user no longer exists" };
  }
  if (member._id.equals(me._id)) return { ok: false, error: "You can't add yourself" };
  if (member.managerId && member.managerId.equals(me._id)) {
    return { ok: false, error: "Already on your team" };
  }

  member.managerId = me._id;
  member.role = targetRole; // align role with the team they're joining
  member.onboarded = true;
  await member.save();

  await Notification.create({
    userId: member._id,
    message: `You were added to ${me.name ?? "a manager"}'s team as a ${ROLE_LABELS[targetRole]}.`,
    link: "/dashboard",
  });

  revalidatePath("/team");
  return { ok: true };
}

export async function removeTeamMember(memberId: string): Promise<ActionResult> {
  const me = await requireUser();
  if (!isManager(me.role)) return { ok: false, error: "Only managers can remove members" };

  await dbConnect();
  const member = await User.findById(memberId);
  if (!member || !member.managerId || !member.managerId.equals(me._id)) {
    return { ok: false, error: "That person isn't on your team" };
  }

  member.managerId = null;
  await member.save();

  await Notification.create({
    userId: member._id,
    message: `You were removed from ${me.name ?? "a manager"}'s team.`,
  });

  revalidatePath("/team");
  return { ok: true };
}

/* --------------------------- Notifications ----------------------- */
export async function markAllNotificationsRead(): Promise<void> {
  const me = await requireUser();
  await dbConnect();
  await Notification.updateMany({ userId: me._id, read: false }, { $set: { read: true } });
  revalidatePath("/notifications");
}
