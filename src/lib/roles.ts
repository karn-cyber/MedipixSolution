export const ROLES = ["TM", "ABM", "ZBM", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// Roles a user can self-assign during onboarding (ADMIN is provisioned via env).
export const SELECTABLE_ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: "TM", label: "Territory Manager (TM)", blurb: "Field rep. Uploads invoices/bills. Reports to an ABM." },
  { value: "ABM", label: "Area Business Manager (ABM)", blurb: "Manages a team of TMs. Reports to a ZBM." },
  { value: "ZBM", label: "Zonal Business Manager (ZBM)", blurb: "Manages a team of ABMs. Top of the field hierarchy." },
];

export const ROLE_LABELS: Record<Role, string> = {
  TM: "Territory Manager",
  ABM: "Area Business Manager",
  ZBM: "Zonal Business Manager",
  ADMIN: "Administrator",
};

// Managers (own a team / can add members).
export function isManager(role?: Role | null): boolean {
  return role === "ABM" || role === "ZBM";
}

export function isAdmin(role?: Role | null): boolean {
  return role === "ADMIN";
}

// Which role a given manager role is allowed to recruit onto their team.
// ZBM recruits ABMs; ABM recruits TMs.
export function recruitableRole(managerRole?: Role | null): Role | null {
  if (managerRole === "ZBM") return "ABM";
  if (managerRole === "ABM") return "TM";
  return null;
}
