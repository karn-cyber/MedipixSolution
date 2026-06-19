import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { isManager, recruitableRole, ROLE_LABELS } from "@/lib/roles";
import TeamManager, { type DirEntry } from "@/components/TeamManager";

export default async function TeamPage() {
  const me = await requireUser();
  if (!isManager(me.role)) redirect("/dashboard");

  await dbConnect();
  const all = await User.find().sort({ name: 1 }).lean();
  const nameById = new Map(all.map((u) => [String(u._id), u.name ?? "Unnamed"]));
  const meId = String(me._id);

  // BFS down the hierarchy to collect everyone in my subtree.
  const childrenByManager = new Map<string, string[]>();
  for (const u of all) {
    if (!u.managerId) continue;
    const k = String(u.managerId);
    (childrenByManager.get(k) ?? childrenByManager.set(k, []).get(k)!).push(String(u._id));
  }
  const subtree = new Set<string>();
  const queue = [meId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const child of childrenByManager.get(cur) ?? []) {
      if (subtree.has(child)) continue;
      subtree.add(child);
      queue.push(child);
    }
  }

  const toEntry = (u: (typeof all)[number]): DirEntry => ({
    id: String(u._id),
    name: u.name ?? "Unnamed",
    email: u.email ?? "",
    role: u.role ?? "",
    managerName: u.managerId ? (nameById.get(String(u.managerId)) ?? null) : null,
    direct: u.managerId ? String(u.managerId) === meId : false,
  });

  const members = all.filter((u) => subtree.has(String(u._id))).map(toEntry);
  // Directory = everyone not me and not already under me.
  const directory = all
    .filter((u) => String(u._id) !== meId && !subtree.has(String(u._id)))
    .map(toEntry);

  const recruit = recruitableRole(me.role)!;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My team</h1>
        <p className="text-sm text-slate-500">
          You add {ROLE_LABELS[recruit]}s directly; everyone reporting under them appears here
          automatically. Search by name or email to add someone.
        </p>
      </div>
      <TeamManager members={members} directory={directory} recruitLabel={ROLE_LABELS[recruit]} />
    </div>
  );
}
