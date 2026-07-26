# Auth and Profile UI Polish Implementation Plan

> **For agentic workers:** Execute this plan inline in the current workspace. Preserve all unrelated user changes and do not commit unless explicitly requested.

**Goal:** Make the Login/Create Account, Profile, and Reset Password pages feel like one polished, spacious product surface on desktop and mobile.

**Architecture:** Keep the existing React components, Supabase flows, routes, and inline business logic. Add small semantic class hooks and shared CSS for layout, responsive widths, focus states, button feedback, and visual hierarchy; use only targeted inline-style adjustments where the current component already owns the layout.

**Tech Stack:** React, React Router, existing theme tokens, plain CSS, Vite.

## Global Constraints

- Do not change authentication, profile update, password reset, delete-account, or navigation behavior.
- Preserve the existing cream, forest, terracotta, typography, and Supabase-backed data flows.
- Desktop auth/reset width: approximately 460px; desktop profile width: approximately 560px.
- Mobile cards must remain within the viewport with 16px minimum side padding.
- All pressable controls receive explicit hover, focus-visible, active, and disabled treatment.
- Do not touch admin, discovery, map, vendor, or AI module UI.

### Task 1: Auth and Reset layout system

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`
- Modify: `frontend/src/pages/ResetPasswordPage.jsx`
- Modify: `frontend/src/global.css`

- [ ] Add `auth-page`, `auth-heading`, `auth-card`, `auth-tabs`, `auth-tab`, and `auth-control` hooks without changing handlers or form fields.
- [ ] Expand the auth and reset cards to the desktop target width while keeping mobile width fluid.
- [ ] Make the Sign In/Create Account tabs single-line, equal-width controls with an explicit pressed state.
- [ ] Add shared focus-visible, hover, active, disabled, and reduced-motion rules.
- [ ] Keep the existing copy, validation, loading labels, and Google sign-in behavior unchanged.

### Task 2: Profile information hierarchy

**Files:**
- Modify: `frontend/src/pages/ProfilePage.jsx`
- Modify: `frontend/src/global.css`

- [ ] Add `profile-page`, `profile-card`, `profile-header`, `profile-avatar`, `profile-details`, `profile-detail-row`, and `profile-actions` hooks.
- [ ] Expand the desktop profile surface to approximately 560px and use a responsive 16px mobile gutter.
- [ ] Keep the title and avatar centered, but left-align account detail rows for faster scanning.
- [ ] Preserve edit mode and all existing buttons while reducing Logout emphasis and visually separating Danger Zone.
- [ ] Add profile-specific interaction states without changing event handlers.

### Task 3: Verification

**Files:**
- Verify: `frontend/src/pages/LoginPage.jsx`
- Verify: `frontend/src/pages/ProfilePage.jsx`
- Verify: `frontend/src/pages/ResetPasswordPage.jsx`
- Verify: `frontend/src/global.css`

- [ ] Run `npm run build` from `frontend`.
- [ ] Run all existing `frontend/src/lib/*.test.mjs` tests.
- [ ] Run `git diff --check`.
- [ ] Confirm the diff contains only the three requested page surfaces, shared UI styles, and this plan.
