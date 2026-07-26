# AI Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the administrator review-to-draft workflow described in the AI Content Processing specification without changing the existing AI Processing page layout or visual language.

**Architecture:** Keep the existing FastAPI processing pipeline and React workflow steps. Add a small review payload normalizer on the frontend, and add explicit backend actions for review persistence, duplicate checking, draft creation, and retrying a failed job. The draft endpoint re-checks duplicates server-side so the review gate cannot be bypassed by stale UI state.

**Tech Stack:** React, Vite, Node built-in test runner, FastAPI, Pydantic, Supabase REST API.

## Global Constraints

- Preserve existing UI structure, colors, spacing, component classes, and navigation.
- Store administrator-reviewed text and extracted fields before creating a vendor record.
- Create vendor records with explicit `status: "draft"`.
- Check possible duplicates using vendor name and location before draft creation.
- Allow retrying a failed processing job without resubmitting its URL.
- Preserve existing batch processing and unrelated worktree changes.

---

### Task 1: Define and test the review payload contract

**Files:**
- Create: `frontend/src/lib/aiReview.js`
- Create: `frontend/src/lib/aiReview.test.mjs`

**Interfaces:**
- `normalizeTextList(value)` returns a trimmed, de-duplicated string array from an array or comma/newline-separated text.
- `normalizeExtracted(extracted, overrides)` returns the editable vendor fields in the backend payload shape.
- `buildDraftPayload(jobId, summary, extracted, overrides)` returns `{ job_id, summary, extracted }`.

- [ ] **Step 1: Write failing tests for list normalization and draft payload construction.**
- [ ] **Step 2: Run `node --test frontend/src/lib/aiReview.test.mjs` and confirm the failure is caused by the missing module.
- [ ] **Step 3:** Implement the smallest normalizer and payload builder.
- [ ] **Step 4:** Re-run the focused test and confirm it passes.

### Task 2: Add backend review actions

**Files:**
- Modify: `backend/routes/process.py`
- Modify: `backend/services/supabase_client.py`

**Interfaces:**
- `POST /api/review/{job_id}` accepts `{ summary, extracted }`, persists review data to the job output, and retains processing status `completed`.
- `POST /api/duplicate-check/{job_id}` accepts `{ summary, extracted }` and returns ranked possible duplicate vendors.
- `POST /api/create-draft/{job_id}` accepts `{ summary, extracted, duplicate_acknowledged }`; it returns a duplicate-review response until the administrator acknowledges candidates, then inserts/updates a vendor with `status: "draft"`.
- `POST /api/retry/{job_id}` reuses the stored source URL and starts the same job again with incremented retry metadata.

- [ ] **Step 1:** Add a pure duplicate candidate matcher using normalized name and location tokens.
- [ ] **Step 2:** Add request models and endpoints that load the job from memory or its status file.
- [ ] **Step 3:** Persist reviewed summary and extracted fields before draft creation.
- [ ] **Step 4:** Make draft creation re-run duplicate detection and set explicit draft status.
- [ ] **Step 5:** Add retry state reset and background pipeline restart.
- [ ] **Step 6:** Run `python -m py_compile backend/routes/process.py backend/services/supabase_client.py`.

### Task 3: Connect the existing React workflow

**Files:**
- Modify: `frontend/src/pages/admin/AdminAIProcessingConsolePage.jsx`
- Modify: `frontend/src/components/ai/TranscriptStep.jsx`
- Modify: `frontend/src/components/ai/SummaryStep.jsx`
- Modify: `frontend/src/components/ai/ExtractionStep.jsx`

**Interfaces:**
- The parent workflow owns the edited summary so it survives navigation from Summary to Extraction.
- Summary and extraction fields remain in their existing cards/field positions and use their existing visual classes.
- The existing save action becomes a review-aware draft action; duplicate candidates and confirmation appear inline only when needed.
- The existing error card gains a Retry action that calls `/api/retry/{job_id}`.

- [ ] **Step 1:** Add parent review-summary state and API handlers.
- [ ] **Step 2:** Make the existing summary card editable without changing its placement or visual treatment.
- [ ] **Step 3:** Make the existing extraction fields editable and submit the normalized review payload.
- [ ] **Step 4:** Add duplicate result/acknowledgement handling to the existing action area.
- [ ] **Step 5:** Add retry handling to the existing processing error card.

### Task 4: Verify the integrated behavior

**Files:**
- No new production files.

- [ ] **Step 1:** Run `node --test frontend/src/lib/pagination.test.mjs frontend/src/lib/aiReview.test.mjs`.
- [ ] **Step 2:** Run `npm run build` in `frontend`.
- [ ] **Step 3:** Run `python -m py_compile backend/routes/process.py backend/services/supabase_client.py`.
- [ ] **Step 4:** Run `git diff --check` and inspect the diff for UI-only regressions.
- [ ] **Step 5:** Open the existing AI Processing page and confirm the original layout remains intact, the URL field has no default link, and review actions appear only in the existing workflow.
