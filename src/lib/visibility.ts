import { Types } from "mongoose";
import { dbConnect } from "./db";
import { User, type IUser } from "./models";

/**
 * The set of uploader ids whose invoices `me` may see:
 *  - ADMIN: null (means "everyone" — caller should not filter)
 *  - manager: themselves + their direct reports
 *  - others: just themselves
 */
export async function visibleUploaderIds(me: IUser): Promise<Types.ObjectId[] | null> {
  if (me.role === "ADMIN") return null;
  await dbConnect();
  const reports = await User.find({ managerId: me._id }).select("_id").lean();
  return [me._id, ...reports.map((r) => r._id as Types.ObjectId)];
}
