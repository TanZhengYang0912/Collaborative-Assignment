const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function parseResponse(response) {
  if (response.ok) return response.json();

  let message = "Request failed";
  try {
    const payload = await response.json();
    message = payload.details || payload.error || message;
  } catch {
    message = await response.text();
  }
  throw new Error(message || "Request failed");
}

async function requestJson(path, options) {
  try {
    const response = await fetch(`${BASE}${path}`, options);
    return parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach admin backend at ${BASE}. Make sure the Node server is running on port 4000.`);
    }
    throw error;
  }
}

export async function getAdminDashboard() {
  return requestJson("/api/admin/dashboard");
}

export async function getAdminVendors({ page = 1, pageSize = 10, status = "all", category = "all", sort = "default", q = "" }) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    status,
    category,
    sort,
    q,
  });
  return requestJson(`/api/admin/vendors?${params}`);
}

export async function updateAdminVendor(id, payload) {
  return requestJson(`/api/admin/vendors/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getAdminAiRecords({ page = 1, pageSize = 5 }) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return requestJson(`/api/admin/ai-records?${params}`);
}

export async function submitAdminAiUrl(url) {
  return requestJson("/api/admin/ai/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export async function getAdminAiServiceStatus() {
  return requestJson("/api/admin/ai/service-status");
}

export async function createAdminVendor(payload) {
  return requestJson("/api/admin/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminVendor(id) {
  return requestJson(`/api/admin/vendors/${id}`, {
    method: "DELETE",
  });
}

// Reuses Toh's existing image-upload endpoint (/api/vendors/:id/image) — both
// admin pages operate on the same `vendors` table row, no need for a second
// upload implementation under /api/admin.
export async function uploadVendorImage(id, file) {
  return requestJson(`/api/vendors/${id}/image`, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
}

export async function getAdminSettings() {
  return requestJson("/api/admin/settings");
}

export async function getAdminReviews({ page = 1, pageSize = 10, visibility = "all" }) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), visibility });
  return requestJson(`/api/admin/reviews?${params}`);
}

export async function setReviewVisibility(id, isHidden) {
  return requestJson(`/api/admin/reviews/${id}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_hidden: isHidden }),
  });
}
