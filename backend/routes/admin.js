import { Router } from "express";
import { supabase } from "../supabase.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT — superadmin-only. Invite/list/remove regular admins.
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get("/admins", requireRole("superadmin"), async (req, res) => {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });

  const admins = data.users
    .filter((u) => u.app_metadata?.role === "admin")
    .map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      mustChangePassword: !!u.user_metadata?.must_change_password,
    }));

  res.json({ admins });
});

router.post("/admins", requireRole("superadmin"), async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return res.status(500).json({ error: listError.message });
  if (existing.users.some((u) => u.email?.toLowerCase() === email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: email,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { must_change_password: true },
  });
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    admin: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
      mustChangePassword: true,
    },
  });
});

router.delete("/admins/:id", requireRole("superadmin"), async (req, res) => {
  const { id } = req.params;
  if (id === req.callerUser.id) {
    return res.status(400).json({ error: "You can't remove your own account." });
  }

  const { data: target, error: getError } = await supabase.auth.admin.getUserById(id);
  if (getError || !target?.user) {
    return res.status(404).json({ error: "Admin not found." });
  }
  if (target.user.app_metadata?.role !== "admin") {
    return res.status(400).json({ error: "Only admin accounts can be removed here." });
  }

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

export default router;
