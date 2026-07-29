// Local-testing escape hatch. Set VITE_DISABLE_AUTH=true in frontend/.env to
// skip the login/admin gate and let engagement actions run without a session
// (mirrors the backend's DISABLE_AUTH). Unset (default) = real auth enforced.
export const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";
export const ENGAGEMENT_TEST_MODE = import.meta.env.VITE_DISABLE_AUTH === "true";
