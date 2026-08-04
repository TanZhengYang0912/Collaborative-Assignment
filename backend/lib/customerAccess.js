// Mirrors frontend/src/lib/roles.js. "superadmin" is deliberately not included:
// requireRole() uses it for admin API access, but this predicate answers a
// different question — may this account use customer features — and the answer
// for any staff account is no.
export function isAdminUser(user) {
  return user?.app_metadata?.role === "admin";
}
