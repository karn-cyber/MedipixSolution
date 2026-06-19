// True when Clerk keys are present. Used to render a friendly setup screen
// (instead of crashing) when the app is started before Clerk is configured.
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}
