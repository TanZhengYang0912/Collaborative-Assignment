import { Router } from "express";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// ENGAGEMENT & BOOKMARKING MODULE — Khor Yik Qi
//
// Endpoints to build:
//   GET/POST/DELETE /api/engagement/wishlist          — save/unsave restaurants
//   GET/POST/DELETE /api/engagement/wishlist/folders  — custom folder organisation
//   POST            /api/engagement/reviews           — submit star rating + review text + photo
//   GET             /api/engagement/reviews/:id       — get reviews for a restaurant
//   POST            /api/engagement/reviews/:id/like  — like/dislike a review
// ─────────────────────────────────────────────────────────────────────────────

export default router;
