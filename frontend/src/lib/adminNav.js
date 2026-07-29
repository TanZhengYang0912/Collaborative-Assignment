// Shared helper for admin-only pages (AI module, vendor management) whose
// "Back" button should return to the admin console.
export async function adminHomePath() {
  return "/admin";
}
