import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { completeOnboarding } from "@/app/actions";
import { SELECTABLE_ROLES } from "@/lib/roles";

export default async function Onboarding() {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");
  if (me.onboarded) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
      <img src="/icons/icon-192.png" alt="Medipix" className="h-12 w-12 rounded-2xl" />
      <h1 className="mt-5 text-2xl font-bold text-slate-900">Welcome to Medipix</h1>
      <p className="mt-1 text-slate-500">Tell us who you are to finish setting up your account.</p>

      <form action={completeOnboarding} className="mt-8 space-y-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
          <input
            name="name"
            required
            defaultValue={me.name ?? ""}
            placeholder="e.g. Anita Sharma"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Your role</label>
          <div className="space-y-2">
            {SELECTABLE_ROLES.map((r, i) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 has-[:checked]:border-brand-600 has-[:checked]:ring-2 has-[:checked]:ring-brand-100"
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  required
                  defaultChecked={i === 0}
                  className="mt-1 h-4 w-4 accent-brand-700"
                />
                <span>
                  <span className="block font-semibold text-slate-800">{r.label}</span>
                  <span className="block text-sm text-slate-500">{r.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-700 px-5 py-4 text-base font-semibold text-white active:scale-[0.99]"
        >
          Get started →
        </button>
      </form>
    </main>
  );
}
