import { Types } from "mongoose";
import { dbConnect } from "./db";
import { User, type IUser } from "./models";

/** All user ids in `rootId`'s management subtree (descendants, excluding root). */
export async function descendantIds(rootId: Types.ObjectId): Promise<Types.ObjectId[]> {
  await dbConnect();
  const all = await User.find().select("_id managerId").lean();

  const childrenByManager = new Map<string, Types.ObjectId[]>();
  for (const u of all) {
    if (!u.managerId) continue;
    const key = String(u.managerId);
    const arr = childrenByManager.get(key);
    if (arr) arr.push(u._id as Types.ObjectId);
    else childrenByManager.set(key, [u._id as Types.ObjectId]);
  }

  const out: Types.ObjectId[] = [];
  const seen = new Set<string>();
  const queue: string[] = [String(rootId)];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const child of childrenByManager.get(cur) ?? []) {
      const cs = String(child);
      if (seen.has(cs)) continue; // guard against accidental cycles
      seen.add(cs);
      out.push(child);
      queue.push(cs);
    }
  }
  return out;
}

/**
 * Uploader ids whose invoices `me` may see:
 *  - ADMIN: null ("everyone" — caller should not filter)
 *  - everyone else: themselves + their entire downward management subtree
 *    (so a ZBM sees their ABMs and all TMs beneath them).
 */
export async function visibleUploaderIds(me: IUser): Promise<Types.ObjectId[] | null> {
  if (me.role === "ADMIN") return null;
  const desc = await descendantIds(me._id);
  return [me._id, ...desc];
}

/** Can `me` view an invoice uploaded by `uploaderId`? (self, any ancestor, or admin) */
export async function canViewUploader(
  me: IUser,
  uploaderId: Types.ObjectId,
): Promise<boolean> {
  if (me.role === "ADMIN") return true;
  if (uploaderId.equals(me._id)) return true;

  await dbConnect();
  // Walk up the uploader's manager chain looking for `me`.
  let current = await User.findById(uploaderId).select("managerId").lean();
  let depth = 0;
  while (current?.managerId && depth < 10) {
    if (String(current.managerId) === String(me._id)) return true;
    current = await User.findById(current.managerId).select("managerId").lean();
    depth++;
  }
  return false;
}
