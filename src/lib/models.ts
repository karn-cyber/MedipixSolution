import mongoose, { Schema, model, models, Types } from "mongoose";
import { ROLES } from "./roles";

/* ----------------------------- User ----------------------------- */
export interface IUser {
  _id: Types.ObjectId;
  clerkId: string;
  email?: string;
  name?: string;
  role?: (typeof ROLES)[number];
  onboarded: boolean;
  managerId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    name: { type: String },
    role: { type: String, enum: ROLES },
    onboarded: { type: Boolean, default: false },
    managerId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true },
);

/* --------------------------- Comment ---------------------------- */
// Embedded in Invoice. Comments can be added before upload (in the form)
// and afterwards on the invoice detail page.
const CommentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

/* --------------------------- Invoice ---------------------------- */
export interface IInvoice {
  _id: Types.ObjectId;
  uploaderId: Types.ObjectId;
  uploaderName: string;
  imagePath: string;
  imageMime: string;
  title?: string;
  comments: {
    _id: Types.ObjectId;
    authorId: Types.ObjectId;
    authorName: string;
    body: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    uploaderName: { type: String, required: true },
    // Image bytes live in the separate InvoiceImage collection (keyed by this
    // invoice's _id) so list queries stay light and it works on read-only hosts.
    imagePath: { type: String },
    imageMime: { type: String, default: "image/jpeg" },
    title: { type: String },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true },
);

/* ------------------------ Notification -------------------------- */
export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

/* ------------------------ InvoiceImage -------------------------- */
// Stores the actual photo bytes in MongoDB. Kept in its own collection so the
// large Buffer is never pulled into invoice list/detail queries.
export interface IInvoiceImage {
  _id: Types.ObjectId;
  invoiceId: Types.ObjectId;
  data: Buffer;
  mime: string;
  createdAt: Date;
}

const InvoiceImageSchema = new Schema<IInvoiceImage>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, unique: true, index: true },
    data: { type: Buffer, required: true },
    mime: { type: String, default: "image/jpeg" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const User = (models.User as mongoose.Model<IUser>) || model<IUser>("User", UserSchema);
export const Invoice =
  (models.Invoice as mongoose.Model<IInvoice>) || model<IInvoice>("Invoice", InvoiceSchema);
export const Notification =
  (models.Notification as mongoose.Model<INotification>) ||
  model<INotification>("Notification", NotificationSchema);
export const InvoiceImage =
  (models.InvoiceImage as mongoose.Model<IInvoiceImage>) ||
  model<IInvoiceImage>("InvoiceImage", InvoiceImageSchema);
