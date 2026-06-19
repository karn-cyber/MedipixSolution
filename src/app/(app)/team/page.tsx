import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { isManager, recruitableRole, ROLE_LABELS } from "@/lib/roles";
import TeamManager from "@/components/TeamManager";

export default async function TeamPage() {
  const me = await requireUser();
  if (!isManager(me.role)) redirect("/dashboard");

  await dbConnect();
  const docs = await User.find({ managerId: me._id }).sort({ name: 1 }).lean();
  const members = docs.map((m) => ({
    id: String(m._id),
    name: m.name ?? "Unnamed",
    email: m.email ?? "",
    role: m.role ?? "",
  }));

  const recruit = recruitableRole(me.role)!;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My team</h1>
        <p className="text-sm text-slate-500">
          Add or remove the {ROLE_LABELS[recruit]}s reporting to you. Members are notified when added.
        </p>
      </div>
      <TeamManager members={members} recruitLabel={ROLE_LABELS[recruit]} />
    </div>
  );
}
