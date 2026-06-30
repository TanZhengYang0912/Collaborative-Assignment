import { Router } from "express";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// AI CONTENT PROCESSING MODULE — Tan Chun Jie
//
// Endpoints to build:
//   POST /api/ai/submit       — accept TikTok/YouTube URL, validate, queue for processing
//   POST /api/ai/transcribe   — speech-to-text from video audio
//   POST /api/ai/summarize    — summarize transcript into key food recommendations
//   POST /api/ai/extract      — extract eatery name, dishes, location → store in DB
// ─────────────────────────────────────────────────────────────────────────────

export default router;
