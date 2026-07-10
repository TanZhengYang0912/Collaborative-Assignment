import { Router } from "express";
import { supabase } from "../supabase.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MODULE — Joshua
// Add authentication routes here (register, login, logout, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// Permanently deletes the calling user's own Supabase auth account.
// Requires the user's access token (from the frontend session) so this can
// only ever delete the account making the request — never an arbitrary id.
router.delete("/account", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing access token" });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  res.json({ success: true });
});

export default router;
