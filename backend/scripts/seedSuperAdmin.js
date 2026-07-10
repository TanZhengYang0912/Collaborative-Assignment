// One-off seed script — creates the demo superadmin account if it doesn't
// already exist. Run manually with `node scripts/seedSuperAdmin.js` from the
// backend/ directory. Not imported by the running app; safe to re-run.
import { supabase } from "../supabase.js";

const EMAIL = "admin@gmail.com";
const PASSWORD = "adminn";

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }

  const existing = data.users.find((u) => u.email?.toLowerCase() === EMAIL);
  if (existing) {
    console.log(`Superadmin ${EMAIL} already exists (id: ${existing.id}). Nothing to do.`);
    return;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role: "superadmin" },
  });
  if (createError) {
    console.error("Failed to create superadmin:", createError.message);
    process.exit(1);
  }

  console.log(`Created superadmin ${EMAIL} (id: ${created.user.id}).`);
}

main();
