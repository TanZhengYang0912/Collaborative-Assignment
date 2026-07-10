// VENDORS MODULE — Toh Lian Thing
// Vendor Management — Data Entry Dashboard, served at /vendors via App.jsx.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminHomePath } from "../lib/adminNav";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const API = `${BASE}/api/vendors`;
const PAGE_SIZE = 10;

const STATUS_META = {
  draft:     { label: "Draft",     bg: "#fef3c7", fg: "#92400e", dot: "#f59e0b" },
  active:    { label: "Active",    bg: "#d1fae5", fg: "#065f46", dot: "#10b981" },
  suspended: { label: "Suspended", bg: "#fee2e2", fg: "#991b1b", dot: "#ef4444" },
};

const EMPTY_FORM = {
  vendor_name: "", address: "", latitude: "", longitude: "",
  cuisine_types: "", operating_hours_raw: "", phone: "",
  price_range: "", signature_dishes: "", status: "draft",
};

const MELAKA = { latMin: 1.8, latMax: 2.6, lngMin: 101.8, lngMax: 102.8 };
const HOURS_RE = /(\d{1,2}([:.]\d{2})?\s*(am|pm))|(\d{1,2}[:.]\d{2})|(24\s*hours?)/i;

function validateForm(f) {
  const e = {};
  const name = f.vendor_name.trim();
  if (!name) e.vendor_name = "Business name is required";
  else if (name.length < 2 || name.length > 120) e.vendor_name = "Must be 2–120 characters";

  if (!f.address.trim()) e.address = "Address is required";

  const lat = parseFloat(f.latitude);
  if (f.latitude === "" || Number.isNaN(lat)) e.latitude = "Latitude is required (number)";
  else if (lat < MELAKA.latMin || lat > MELAKA.latMax) e.latitude = `Outside Melaka (${MELAKA.latMin}–${MELAKA.latMax})`;

  const lng = parseFloat(f.longitude);
  if (f.longitude === "" || Number.isNaN(lng)) e.longitude = "Longitude is required (number)";
  else if (lng < MELAKA.lngMin || lng > MELAKA.lngMax) e.longitude = `Outside Melaka (${MELAKA.lngMin}–${MELAKA.lngMax})`;

  if (!f.cuisine_types.trim()) e.cuisine_types = "At least one cuisine type is required";

  const hours = f.operating_hours_raw.trim();
  if (!hours) e.operating_hours_raw = "Operating hours are required";
  else if (!HOURS_RE.test(hours)) e.operating_hours_raw = 'Include a time, e.g. "Mon–Sun 9:00am – 10:00pm"';

  const phone = f.phone.trim();
  if (!phone) e.phone = "Contact number is required";
  else if (!/^(\+?60|0)\d{8,10}$/.test(phone.replace(/[\s-]/g, ""))) {
    e.phone = "Invalid Malaysian number, e.g. 06-283 1234";
  }

  if (!f.price_range.trim()) e.price_range = "Price range is required";
  if (!f.signature_dishes.trim()) e.signature_dishes = "Signature dishes are required";
  return e;
}

const C = {
  cream: "#FBF4EA",
  card: "#FFFFFF",
  accent: "#D85A30",
  accentDark: "#993C1D",
  text: "#3E2C23",
  muted: "#9A8478",
  border: "#EADBCB",
};

const S = {
  page: { minHeight: "100vh", background: C.cream, fontFamily: "system-ui, -apple-system, sans-serif", color: C.text },
  wrap: { maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" },
  input: { width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, background: C.card, color: C.text, boxSizing: "border-box", outline: "none" },
  label: { display: "block", fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 5 },
  err: { color: "#dc2626", fontSize: 12, marginTop: 4 },
  btn: { padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, cursor: "pointer", fontWeight: 500 },
  btnPrimary: { padding: "9px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 600 },
  th: { textAlign: "left", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" },
  td: { padding: "12px 14px", fontSize: 13.5, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" },
  overlay: { position: "fixed", inset: 0, background: "rgba(62,44,35,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: m.bg, color: m.fg, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot }} />
      {m.label}
    </span>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <label style={S.label}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>
      {children}
      {error && <div style={S.err}>{error}</div>}
    </div>
  );
}

function VendorFormModal({ vendor, onClose, onSaved, notify }) {
  const isEdit = Boolean(vendor?.id);
  const [form, setForm] = useState(() =>
    isEdit
      ? Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, vendor[k] == null ? "" : String(vendor[k])]))
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(vendor?.storefront_image_url || null);
  const fileInput = useRef(null);

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  const pickImage = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      notify("Please choose a JPEG, PNG, WebP or GIF image", true);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify("Image must be under 8 MB", true);
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  async function save() {
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const r = await fetch(isEdit ? `${API}/${vendor.id}` : API, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "save failed");
      }

      if (imageFile) {
        const up = await fetch(`${API}/${data.id}/image`, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        if (!up.ok) {
          const upErr = await up.json().catch(() => ({}));
          notify(`Vendor saved, but image upload failed: ${upErr.error || up.status}`, true);
          onSaved();
          return;
        }
      }

      notify(isEdit ? "Vendor updated" : "Vendor created");
      onSaved();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.overlay} onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
        <h2 style={{ margin: "0 0 18px", fontSize: 19 }}>{isEdit ? "Edit vendor" : "Add new vendor"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Business name" required error={errors.vendor_name}>
              <input style={S.input} value={form.vendor_name} onChange={set("vendor_name")} placeholder="e.g. Nyonya Kitchen Melaka" />
            </Field>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Address" required error={errors.address}>
              <input style={S.input} value={form.address} onChange={set("address")} placeholder="Street address, Melaka" />
            </Field>
          </div>

          <Field label="Latitude" required error={errors.latitude}>
            <input style={S.input} value={form.latitude} onChange={set("latitude")} placeholder="2.1946" />
          </Field>
          <Field label="Longitude" required error={errors.longitude}>
            <input style={S.input} value={form.longitude} onChange={set("longitude")} placeholder="102.2485" />
          </Field>

          <Field label="Cuisine types (comma-separated)" required error={errors.cuisine_types}>
            <input style={S.input} value={form.cuisine_types} onChange={set("cuisine_types")} placeholder="Nyonya, Malay" />
          </Field>
          <Field label="Operating hours" required error={errors.operating_hours_raw}>
            <input style={S.input} value={form.operating_hours_raw} onChange={set("operating_hours_raw")} placeholder="Mon–Sun 9:00am – 10:00pm" />
          </Field>

          <Field label="Contact number" required error={errors.phone}>
            <input style={S.input} value={form.phone} onChange={set("phone")} placeholder="06-283 1234" />
          </Field>
          <Field label="Price range" required error={errors.price_range}>
            <input style={S.input} value={form.price_range} onChange={set("price_range")} placeholder="RM10–RM30" />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Signature dishes" required error={errors.signature_dishes}>
              <input style={S.input} value={form.signature_dishes} onChange={set("signature_dishes")} placeholder="Cendol, Chicken Rice Balls" />
            </Field>
          </div>

          <Field label="Status" error={errors.status}>
            <select style={S.input} value={form.status} onChange={set("status")}>
              {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
          </Field>

          <Field label="Storefront image">
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} style={{ display: "none" }} />
            <button type="button" style={{ ...S.btn, width: "100%" }} onClick={() => fileInput.current?.click()}>
              {imageFile ? imageFile.name : preview ? "Replace image…" : "Choose image…"}
            </button>
          </Field>

          {preview && (
            <div style={{ gridColumn: "1 / -1" }}>
              <img src={preview} alt="Storefront preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, border: "1px solid #EADBCB" }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button style={S.btn} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation
function DeleteModal({ vendor, onClose, onDeleted, notify }) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const r = await fetch(`${API}/${vendor.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error || "delete failed");
      notify(`Deleted "${vendor.vendor_name}"`);
      onDeleted();
    } catch (err) {
      notify(err.message, true);
      setBusy(false);
    }
  }

  return (
    <div style={S.overlay} onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 17 }}>Delete vendor?</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6B5A4E", lineHeight: 1.5 }}>
          <strong>{vendor.vendor_name}</strong> and its storefront image will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button style={S.btn} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={{ ...S.btnPrimary, background: "#dc2626", opacity: busy ? 0.6 : 1 }} onClick={confirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard 
export default function VendorsPage() {
  const navigate = useNavigate();
  const handleBack = async () => navigate(await adminHomePath());

  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState({ cuisines: [], statusCounts: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // { mode: "create" } | { mode: "edit", vendor } | { mode: "delete", vendor }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg, isError = false) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, isError });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadMeta = useCallback(async () => {
    try {
      const r = await fetch(`${API}/meta`);
      if (r.ok) setMeta(await r.json());
    } catch { /* stats are non-critical — table still works without them */ }
  }, []);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (cuisine) params.set("cuisine", cuisine);
      if (status) params.set("status", status);
      if (location) params.set("location", location);
      if (hours) params.set("hours", hours);
      const r = await fetch(`${API}?${params}`);
      if (!r.ok) throw new Error((await r.json()).error || `request failed (${r.status})`);
      const data = await r.json();
      setVendors(data.vendors);
      setTotal(data.total);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, cuisine, status, location, hours]);

  useEffect(() => { loadVendors(); }, [loadVendors]);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  const refresh = () => { loadVendors(); loadMeta(); };

  async function changeStatus(vendor, newStatus) {
    // Optimistic update — revert on failure
    setVendors((vs) => vs.map((v) => (v.id === vendor.id ? { ...v, status: newStatus } : v)));
    try {
      const r = await fetch(`${API}/${vendor.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "status update failed");
      notify(`"${vendor.vendor_name}" → ${STATUS_META[newStatus].label}`);
      loadMeta();
    } catch (err) {
      setVendors((vs) => vs.map((v) => (v.id === vendor.id ? { ...v, status: vendor.status } : v)));
      notify(err.message, true);
    }
  }

  const clearFilters = () => {
    setSearch(""); setCuisine(""); setStatus(""); setLocation(""); setHours(""); setPage(1);
  };
  const hasFilters = search || cuisine || status || location || hours;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const counts = meta.statusCounts || {};
  const stats = [
    { label: "Total vendors", value: meta.total ?? 0, color: "#3E2C23" },
    { label: "Active", value: counts.active ?? 0, color: STATUS_META.active.dot },
    { label: "Draft", value: counts.draft ?? 0, color: STATUS_META.draft.dot },
    { label: "Suspended", value: counts.suspended ?? 0, color: STATUS_META.suspended.dot },
  ];

  return (
    <div style={S.page}>
      {/* Brand top bar — same look as the user-facing Dashboard header */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.accentDark, fontSize: 18, fontWeight: 600 }}>🍜 TrueBites</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: C.muted }}>Admin · Vendor Management</span>
          <button style={S.btn} onClick={handleBack}>← Back</button>
        </div>
      </header>

      <div style={S.wrap}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: C.accentDark }}>Vendor Management</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: C.muted }}>
              Create, review and publish eatery records for the TrueBites tourist map.
            </p>
          </div>
          <button style={S.btnPrimary} onClick={() => setModal({ mode: "create" })}>+ Add vendor</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #EADBCB" }}>
              <div style={{ fontSize: 12.5, color: "#9A8478", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search & filters */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #EADBCB", marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "center" }}>
            <input style={S.input} placeholder="🔍 Search business name…" value={search} onChange={(ev) => setSearch(ev.target.value)} />
            <select style={S.input} value={cuisine} onChange={(ev) => { setCuisine(ev.target.value); setPage(1); }}>
              <option value="">All cuisines</option>
              {meta.cuisines.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select style={S.input} value={status} onChange={(ev) => { setStatus(ev.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
            <input style={S.input} placeholder="Location…" value={location}
              onChange={(ev) => setLocation(ev.target.value)} onBlur={() => setPage(1)}
              onKeyDown={(ev) => ev.key === "Enter" && setPage(1)} />
            <input style={S.input} placeholder="Hours, e.g. 9am…" value={hours}
              onChange={(ev) => setHours(ev.target.value)} onBlur={() => setPage(1)}
              onKeyDown={(ev) => ev.key === "Enter" && setPage(1)} />
            <button style={{ ...S.btn, visibility: hasFilters ? "visible" : "hidden" }} onClick={clearFilters}>Clear</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EADBCB", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Vendor</th>
                  <th style={S.th}>Cuisine</th>
                  <th style={S.th}>Location</th>
                  <th style={S.th}>Hours</th>
                  <th style={S.th}>Status</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td style={{ ...S.td, textAlign: "center", padding: 40, color: "#9A8478" }} colSpan={6}>Loading vendors…</td></tr>
                ) : loadError ? (
                  <tr><td style={{ ...S.td, textAlign: "center", padding: 40, color: "#dc2626" }} colSpan={6}>
                    Failed to load vendors: {loadError} — is the backend running on {BASE}?
                  </td></tr>
                ) : vendors.length === 0 ? (
                  <tr><td style={{ ...S.td, textAlign: "center", padding: 40, color: "#9A8478" }} colSpan={6}>
                    {hasFilters ? "No vendors match your search or filters." : "No vendors yet — click “+ Add vendor” to create the first record."}
                  </td></tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = C.cream)}
                      onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {v.storefront_image_url ? (
                            <img src={v.storefront_image_url} alt="" loading="lazy"
                              style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", border: "1px solid #EADBCB", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 46, height: 46, borderRadius: 8, background: "#FBF4EA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🍜</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{v.vendor_name}</div>
                            {v.phone && <div style={{ fontSize: 12, color: "#9A8478" }}>📞 {v.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>{v.cuisine_types || <span style={{ color: "#B9A99B" }}>—</span>}</td>
                      <td style={{ ...S.td, maxWidth: 240 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.address}>{v.address}</div>
                        <div style={{ fontSize: 11.5, color: "#B9A99B" }}>{Number(v.latitude)?.toFixed(4)}, {Number(v.longitude)?.toFixed(4)}</div>
                      </td>
                      <td style={{ ...S.td, maxWidth: 170 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.operating_hours_raw}>
                          {v.operating_hours_raw || <span style={{ color: "#B9A99B" }}>—</span>}
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <StatusBadge status={v.status || "draft"} />
                          <select
                            value={v.status || "draft"}
                            onChange={(ev) => changeStatus(v, ev.target.value)}
                            title="Change visibility status"
                            style={{ border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, padding: "3px 4px", background: "#fff", cursor: "pointer" }}
                          >
                            {Object.entries(STATUS_META).map(([val, m]) => <option key={val} value={val}>{m.label}</option>)}
                          </select>
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button style={{ ...S.btn, padding: "6px 12px", fontSize: 13 }} onClick={() => setModal({ mode: "edit", vendor: v })}>Edit</button>
                        <button style={{ ...S.btn, padding: "6px 12px", fontSize: 13, marginLeft: 8, color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => setModal({ mode: "delete", vendor: v })}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !loadError && total > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #EADBCB", fontSize: 13, color: "#9A8478" }}>
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} vendor{total === 1 ? "" : "s"}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button style={{ ...S.btn, padding: "6px 12px", fontSize: 13, opacity: page <= 1 ? 0.5 : 1 }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <span>Page {page} / {totalPages}</span>
                <button style={{ ...S.btn, padding: "6px 12px", fontSize: 13, opacity: page >= totalPages ? 0.5 : 1 }} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.mode === "create" && (
        <VendorFormModal onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} notify={notify} />
      )}
      {modal?.mode === "edit" && (
        <VendorFormModal vendor={modal.vendor} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} notify={notify} />
      )}
      {modal?.mode === "delete" && (
        <DeleteModal vendor={modal.vendor} onClose={() => setModal(null)} onDeleted={() => { setModal(null); refresh(); }} notify={notify} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.isError ? "#dc2626" : "#3E2C23", color: "#fff",
          padding: "11px 20px", borderRadius: 10, fontSize: 14, zIndex: 2000,
          boxShadow: "0 8px 24px rgba(0,0,0,.3)", maxWidth: "90vw",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}