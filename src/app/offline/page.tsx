export default function Offline() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <img src="/icons/icon-192.png" alt="Medipix" className="h-16 w-16 rounded-2xl" />
      <h1 className="text-xl font-bold text-slate-900">You&apos;re offline</h1>
      <p className="text-slate-500">
        Medipix needs a connection to load invoices. Reconnect and try again.
      </p>
    </main>
  );
}
