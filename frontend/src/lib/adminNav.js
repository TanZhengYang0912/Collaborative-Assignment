// Shared helper for admin-only pages (AI module, vendor management) that
// need to send a "Back" button to the correct admin landing page —
// /superadmin for superadmins, /admin-home for regular admins.
import { supabase } from "../supabaseClient";

export async function adminHomePath() {
  const { data } = await supabase.auth.getSession();
  const role = data.session?.user?.app_metadata?.role;
  return role === "superadmin" ? "/superadmin" : "/admin-home";
}
