import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignIn appearance={{ elements: { rootBox: "w-full", card: "shadow-xl" } }} />
    </main>
  );
}
