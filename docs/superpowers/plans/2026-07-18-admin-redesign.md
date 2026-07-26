# Admin Console Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Graphite + Cobalt Admin redesign with data-backed dashboard analytics and a unified visual system across Overview, Vendors, AI Processing, Reviews, and Settings.

**Architecture:** Extend the existing `/api/admin/dashboard` response with derived aggregates from Supabase. Add reusable, dependency-free SVG/CSS chart components and shared admin tokens, then let existing admin pages consume the same shell, panels, tables, filters, and status language. Preserve consumer-facing pages and existing admin routes.

**Tech Stack:** React 18, Vite, lucide-react, Express, Supabase JavaScript client, CSS, Node built-in test runner.

## Global Constraints

- Admin uses the Graphite + Cobalt palette and does not inherit the consumer-facing gold palette.
- Existing admin routes remain `/admin`, `/admin/vendors2`, `/admin/ai`, `/admin/reviews`, and `/admin/settings`.
- Dashboard analytics must be derived from real vendor/review records; do not invent visitor, revenue, or engagement values.
- Charts must remain readable, keyboard reachable, responsive, and dependency-free.
- Consumer-facing pages and existing AI review workflow behavior remain unchanged.
- Preserve unrelated worktree changes and the existing `backend/venv-new/` directory.

---

### Task 1: Lock the dashboard data contract with tests

**Files:**
- Create: `frontend/src/lib/adminDashboard.js`
- Create: `frontend/src/lib/adminDashboard.test.mjs`

**Interfaces:**
- `normalizeDashboardPayload(payload)` always returns the dashboard sections named in the design spec, using empty arrays for unavailable optional sections.
- `formatMetricDelta(current, previous)` returns a signed percentage label and tone.

- [ ] **Step 1:** Write failing tests for missing analytics sections and positive/negative metric deltas.
- [ ] **Step 2:** Run `node --test frontend/src/lib/adminDashboard.test.mjs` and confirm it fails because the helper does not exist.
- [ ] **Step 3:** Implement the smallest normalizer and delta formatter.
- [ ] **Step 4:** Run the focused test and confirm it passes.

### Task 2: Extend the dashboard analytics API

**Files:**
- Modify: `backend/routes/admin.js`

**Interfaces:**
- `GET /api/admin/dashboard` preserves `stats`, `recentVendors`, and `recentProcessing` for compatibility.
- The same response adds `kpis`, `vendorTrend`, `statusBreakdown`, `categoryBreakdown`, `sourceBreakdown`, `aiPipeline`, `attentionItems`, and `lastUpdated`.

- [ ] **Step 1:** Add a date-bucket helper for the last 30 days and derive vendor creation counts from `created_at`.
- [ ] **Step 2:** Add status, category, and source aggregations from the existing vendor query.
- [ ] **Step 3:** Add review visibility counts and an attention list using records that already exist.
- [ ] **Step 4:** Preserve existing response fields and return empty chart sections instead of failing when optional data is unavailable.
- [ ] **Step 5:** Run a Node syntax check for `backend/routes/admin.js`.

### Task 3: Build the admin visual foundation

**Files:**
- Modify: `frontend/src/admin-console.css`
- Modify: `frontend/src/components/admin/AdminLayout.jsx`

- [ ] **Step 1:** Replace admin variables with the Graphite + Cobalt tokens.
- [ ] **Step 2:** Add 12-column content layout, compact panel primitives, chart spacing, table states, focus states, and responsive breakpoints.
- [ ] **Step 3:** Update the sidebar and topbar copy to use Overview, Vendors, AI Content Queue, Review Moderation, and Settings language while preserving routes.
- [ ] **Step 4:** Add a mobile navigation affordance without changing route behavior.

### Task 4: Implement reusable analytics visuals

**Files:**
- Create: `frontend/src/components/admin/AdminCharts.jsx`
- Modify: `frontend/src/pages/admin/AdminDashboardPage.jsx`

- [ ] **Step 1:** Add accessible SVG line chart, horizontal bar chart, pipeline bars, and compact sparkline components.
- [ ] **Step 2:** Add the KPI strip with trend labels and direct links.
- [ ] **Step 3:** Add Vendor Growth, AI Pipeline, Category Distribution, Source Mix, Needs Attention, and Recent Activity panels.
- [ ] **Step 4:** Use `normalizeDashboardPayload` so older or partial API responses render a stable empty state.

### Task 5: Unify the remaining admin pages

**Files:**
- Modify: `frontend/src/pages/admin/AdminVendorManagementPage.jsx`
- Modify: `frontend/src/pages/admin/AdminAIProcessingConsolePage.jsx`
- Modify: `frontend/src/pages/admin/AdminReviewModerationPage.jsx`
- Modify: `frontend/src/pages/admin/AdminSettingsPage.jsx`

- [ ] **Step 1:** Replace page-specific warm/brand accents with shared admin tokens while preserving business logic.
- [ ] **Step 2:** Add page headings, filters, and table/action alignment consistent with the new shell.
- [ ] **Step 3:** Keep AI review, duplicate check, draft creation, and retry actions intact.
- [ ] **Step 4:** Add loading, error, empty, and focus states where current pages lack them.

### Task 6: Verify the redesign

**Files:**
- No new production files.

- [ ] **Step 1:** Run `node --test frontend/src/lib/pagination.test.mjs frontend/src/lib/aiReview.test.mjs frontend/src/lib/adminDashboard.test.mjs`.
- [ ] **Step 2:** Run `node --check backend/routes/admin.js`.
- [ ] **Step 3:** Run `npm run build` in `frontend`.
- [ ] **Step 4:** Run `git diff --check`.
- [ ] **Step 5:** Open each admin route in the local browser and inspect desktop and narrow-width layout, chart empty states, navigation, and existing AI workflow entry points.
