# Selective Feature Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the functional changes from commits `6bbe019` and `a22a193` into the current `main` worktree while preserving the current branch's UI, layout, colors, imagery, and design system.

**Architecture:** Port behavior at the smallest existing boundaries instead of cherry-picking either commit. The address feature will be integrated into the existing Admin Vendor form and retain its current markup/styles. The authentication changes will be integrated through a shared password field and existing page layouts; teammate page styling and generated image assets will not be imported.

**Tech Stack:** React 18, React Router, Supabase Auth, Express, Google Maps Places, Vite, Node test scripts.

## Global Constraints

- Do not cherry-pick `6bbe019` or `a22a193` wholesale.
- Preserve the current branch's design files and visual language; do not import teammate CSS/layout replacements.
- Exclude all `frontend/public/assets/vendor_food/**`, generated food-image manifests, and old page styling from `a22a193`.
- Preserve the existing server geocode endpoint unless the new Places behavior makes it demonstrably unused; do not remove it as part of the first pass.
- Do not stage or commit the user's existing unrelated worktree changes.

### Task 1: Add password visibility behavior without changing page design

**Files:**
- Create: `frontend/src/components/PasswordField.jsx`
- Modify: `frontend/src/pages/LoginPage.jsx`
- Modify: `frontend/src/pages/AdminLoginPage.jsx`
- Modify: `frontend/src/pages/ResetPasswordPage.jsx`
- Modify: `frontend/src/pages/SetAdminPasswordPage.jsx`
- Modify: `frontend/src/pages/ProfilePage.jsx` only where the reset flow needs behavior wiring

**Interfaces:**
- `PasswordField` accepts normal input props plus `style`, `className`, and `iconColor` and returns an input that temporarily reveals its value while pressed.

- [ ] **Step 1: Write a failing source-level behavior test**

Assert that each password page imports `PasswordField` and no longer renders its own password visibility implementation. Run the check against the current source and confirm it fails before adding the component.

- [ ] **Step 2: Implement the shared password field**

Use the page-provided style and color so the existing visual design remains unchanged. Keep the eye control keyboard-safe and hide the value on mouse/touch release.

- [ ] **Step 3: Replace duplicated password inputs**

Use the component in login, admin login, reset password, and set-admin-password pages without replacing their cards, typography, spacing, colors, or copy hierarchy.

- [ ] **Step 4: Run the source-level check and frontend build**

Run `npm run build` from `frontend/` and verify the password component is bundled without syntax errors.

### Task 2: Port password reset behavior and login error handling

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`
- Modify: `frontend/src/pages/ProfilePage.jsx`
- Modify: `frontend/src/pages/ResetPasswordPage.jsx`

**Interfaces:**
- Profile reset uses `supabase.auth.resetPasswordForEmail(userEmail, { redirectTo })`.
- Reset page accepts `?redirect=profile` and returns to `/profile` after a successful reset; normal forgot-password flow still returns to `/login`.

- [ ] **Step 1: Add failing behavior checks**

Check that the profile flow currently calls `updateUser` directly and that reset-page redirect behavior is absent.

- [ ] **Step 2: Port the reset-link flow**

Keep the current profile panel's styling, but change its behavior to send a reset email and show the existing design's success/error states. Preserve the logged-out forgot-password flow.

- [ ] **Step 3: Port friendly invalid-credential messaging**

Map only the exact Supabase invalid-login error to a friendly message. Do not copy the source commit's stray `login` token or any unrelated UI changes.

- [ ] **Step 4: Verify auth source contracts and build**

Run the auth checks and `npm run build` from `frontend/`.

### Task 3: Add Melaka Places autocomplete to the existing Admin Vendor form

**Files:**
- Modify: `frontend/src/pages/admin/AdminVendorManagementPage.jsx`
- Modify: `frontend/src/admin-console.css` only for the existing suggestion-layer z-index/hint treatment
- Keep: `backend/lib/geocode.js`, `backend/routes/admin.js`, and `frontend/src/api/admin.js` unless verification proves removal is safe

**Interfaces:**
- Address selection writes `address`, `latitude`, and `longitude` through the existing form `onChange` path.
- Places autocomplete is restricted to Malaysia and the existing Melaka coordinate bounds.
- Missing browser key or Places library falls back to the current manual address form.

- [ ] **Step 1: Write a failing behavior check**

Assert that the Admin Vendor page does not yet import `APIProvider`/`useMapsLibrary` and has no Places autocomplete handler.

- [ ] **Step 2: Integrate Places behavior into current markup**

Add the Places library and autocomplete lifecycle while preserving the existing form grid, label styling, input dimensions, error placement, modal spacing, and current design tokens.

- [ ] **Step 3: Preserve manual fallback**

When `VITE_MAPS_BROWSER_KEY` is absent or Places is unavailable, the address field must remain usable and the current Verify Address backend path must not be broken.

- [ ] **Step 4: Verify**

Run frontend build and source checks for the current Admin CSS/design files. Do not import `6bbe019`'s replacement page layout.

### Task 4: Design-preservation audit and final verification

**Files:**
- No new UI files unless a direct feature integration requires one.

- [ ] **Step 1: Confirm excluded teammate UI/assets**

Verify that no teammate `a22a193` generated images, old CSS, or full page snapshots were added.

- [ ] **Step 2: Run tests and builds**

Run existing `*.test.mjs` scripts, frontend `npm run build`, and `git diff --check`.

- [ ] **Step 3: Review the final diff**

Confirm changed files are limited to functional auth/address integration, the shared password field, and the plan; leave all pre-existing unrelated changes untouched.
