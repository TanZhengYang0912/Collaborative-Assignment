// ponytail: TEMPORARY — mirrors the backend's ENGAGEMENT_TEST_MODE bypass so
// the engagement UI doesn't redirect to /login while there's no real session.
// Remove this file and its two usages before the engagement module ships.
export const ENGAGEMENT_TEST_MODE = import.meta.env.VITE_ENGAGEMENT_TEST_MODE === "true";
