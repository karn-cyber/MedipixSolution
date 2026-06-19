import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import InstallButton from "@/components/InstallButton";
import { isClerkConfigured } from "@/lib/clerk-config";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/icons/icon-192.png" alt="Medipix" className="h-12 w-12 rounded-2xl shadow-md" />
      <div>
        <p className="text-xl font-bold tracking-tight text-slate-900">Medipix</p>
        <p className="text-xs font-medium text-brand-700">Invoice & Team Visibility</p>
      </div>
    </div>
  );
}

const FEATURES = [
  ["📸", "Snap & upload", "Capture invoices/bills from your phone in seconds."],
  ["👀", "Manager visibility", "Your ABM/ZBM sees your submissions automatically."],
  ["🧮", "Accurate counts", "Track individual and total counts on every invoice."],
  ["💬", "Add context", "Drop comments so nothing gets lost in translation."],
];

export default async function Home() {
  const configured = isClerkConfigured();
  const signedIn = configured ? Boolean((await auth()).userId) : false;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
      <Logo />

      <div className="mt-10 flex-1">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
          Invoices, organised.
          <br />
          <span className="text-brand-700">Visible to the right people.</span>
        </h1>
        <p className="mt-3 text-slate-500">
          The Medipix field app for Territory, Area and Zonal managers. Install it on your
          phone — no app store needed.
        </p>

        <div className="mt-8">
          <InstallButton />
        </div>

        <div className="mt-6 space-y-3">
          {FEATURES.map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-slate-800">{title}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {!configured ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <p className="font-semibold">⚙️ Setup needed</p>
            <p className="mt-1">
              Add your Clerk keys to <code className="rounded bg-amber-100 px-1">.env</code> and restart
              to enable login. See <code className="rounded bg-amber-100 px-1">README.md</code>.
            </p>
          </div>
        ) : signedIn ? (
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white"
          >
            Open dashboard →
          </Link>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white"
            >
              Sign in to continue
            </Link>
            <p className="mt-3 text-center text-sm text-slate-500">
              New here?{" "}
              <Link href="/sign-up" className="font-semibold text-brand-700">
                Create an account
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
