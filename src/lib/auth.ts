import { currentUser } from "@clerk/nextjs/server";
import { dbConnect } from "./db";
import { User, type IUser } from "./models";

/**
 * Returns the Mongo User document for the signed-in Clerk user, creating a
 * stub on first sight. Emails listed in ADMIN_EMAILS are provisioned as ADMIN.
 * Returns null when nobody is signed in.
 */
export async function getCurrentUser(): Promise<IUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  await dbConnect();

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();

  let user = await User.findOne({ clerkId: clerkUser.id });

  if (!user) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdminEmail = email ? adminEmails.includes(email.toLowerCase()) : false;

    user = await User.create({
      clerkId: clerkUser.id,
      email,
      name: fullName || undefined,
      role: isAdminEmail ? "ADMIN" : undefined,
      onboarded: isAdminEmail, // admins skip role selection
    });
  } else if (email && user.email !== email) {
    user.email = email;
    await user.save();
  }

  return user.toObject() as IUser;
}

/** Plain-object current user (safe to pass to client components). */
export async function requireUser(): Promise<IUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
