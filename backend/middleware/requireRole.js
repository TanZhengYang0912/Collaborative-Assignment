import { supabase } from "../supabase.js";

// ponytail: TEMPORARY — auth fully disabled for local testing. Flip back to
// false to restore real token/role verification below.
const AUTH_DISABLED = true;

// Verifies the caller's Supabase access token and checks their app_metadata.role
// against an allow-list. Attaches the resolved user to req.callerUser on success.
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (AUTH_DISABLED) {
      req.callerUser = { id: "dev", app_metadata: { role: "superadmin" } };
      return next();
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    if (!allowedRoles.includes(data.user.app_metadata?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.callerUser = data.user;
    next();
  };
}
