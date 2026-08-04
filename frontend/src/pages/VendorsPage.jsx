// VENDORS MODULE — Toh Lian Thing
// Vendor Management — Data Entry Dashboard, served at /vendors via App.jsx.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
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

// Shared literal class strings — repeated often enough to name, complete
// enough for Tailwind's scanner to see every utility.
const INPUT = "min-h-11 w-full rounded-lg border border-sand bg-white px-3 text-sm text-ink outline-none focus:border-forest";
const BTN = "inline-flex min-h-11 items-center justify-center rounded-lg border border-sand bg-white px-4 text-sm font-medium text-ink hover:border-forest disabled:opacity-60";
const BTN_PRIMARY = "inline-flex min-h-11 items-center justify-center rounded-lg bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-light disabled:opacity-60";
const BTN_DANGER = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#dc2626] px-4 text-sm font-semibold text-white disabled:opacity-60";
const TH = "whitespace-nowrap border-b border-sand px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.4px] text-muted";
const TD = "border-b border-sand px-3.5 py-3 align-middle text-[13.5px]";
const OVERLAY = "fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(62,44,35,.5)] p-0 sm:items-center sm:p-5";

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
        {label}{required && <span className="text-[#dc2626]"> *</span>}
      </label>
      {children}
      {error && <div className="mt-1 text-xs text-[#dc2626]">{error}</div>}
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
    <div className={OVERLAY} onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="max-h-dvh w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,.25)] sm:max-h-[92dvh] sm:max-w-[640px] sm:rounded-2xl sm:p-6">
        <h2 className="mb-4 mt-0 text-[19px] font-semibold">{isEdit ? "Edit vendor" : "Add new vendor"}</h2>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Business name" required error={errors.vendor_name}>
              <input className={INPUT} value={form.vendor_name} onChange={set("vendor_name")} placeholder="e.g. Nyonya Kitchen Melaka" />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Address" required error={errors.address}>
              <input className={INPUT} value={form.address} onChange={set("address")} placeholder="Street address, Melaka" />
            </Field>
          </div>

          <Field label="Latitude" required error={errors.latitude}>
            <input className={INPUT} value={form.latitude} onChange={set("latitude")} placeholder="2.1946" />
          </Field>
          <Field label="Longitude" required error={errors.longitude}>
            <input className={INPUT} value={form.longitude} onChange={set("longitude")} placeholder="102.2485" />
          </Field>

          <Field label="Cuisine types (comma-separated)" required error={errors.cuisine_types}>
            <input className={INPUT} value={form.cuisine_types} onChange={set("cuisine_types")} placeholder="Nyonya, Malay" />
          </Field>
          <Field label="Operating hours" required error={errors.operating_hours_raw}>
            <input className={INPUT} value={form.operating_hours_raw} onChange={set("operating_hours_raw")} placeholder="Mon–Sun 9:00am – 10:00pm" />
          </Field>

          <Field label="Contact number" required error={errors.phone}>
            <input className={INPUT} value={form.phone} onChange={set("phone")} placeholder="06-283 1234" />
          </Field>
          <Field label="Price range" required error={errors.price_range}>
            <input className={INPUT} value={form.price_range} onChange={set("price_range")} placeholder="RM10–RM30" />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Signature dishes" required error={errors.signature_dishes}>
              <input className={INPUT} value={form.signature_dishes} onChange={set("signature_dishes")} placeholder="Cendol, Chicken Rice Balls" />
            </Field>
          </div>

          <Field label="Status" error={errors.status}>
            <select className={INPUT} value={form.status} onChange={set("status")}>
              {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
          </Field>

          <Field label="Storefront image">
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} className="hidden" />
            <button type="button" className={`${BTN} w-full`} onClick={() => fileInput.current?.click()}>
              {imageFile ? imageFile.name : preview ? "Replace image…" : "Choose image…"}
            </button>
          </Field>

          {preview && (
            <div className="sm:col-span-2">
              <img src={preview} alt="Storefront preview" className="max-h-[220px] w-full rounded-[10px] border border-sand object-cover" />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button className={BTN} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={BTN_PRIMARY} onClick={save} disabled={saving}>
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
    <div className={OVERLAY} onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="w-full rounded-t-2xl bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,.25)] sm:max-w-[420px] sm:rounded-2xl sm:p-6">
        <h3 className="mb-2.5 mt-0 text-[17px] font-semibold">Delete vendor?</h3>
        <p className="mb-5 mt-0 text-sm leading-normal text-[#6B5A4E]">
          <strong>{vendor.vendor_name}</strong> and its storefront image will be permanently removed. This cannot be undone.
        </p>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button className={BTN} onClick={onClose} disabled={busy}>Cancel</button>
          <button className={BTN_DANGER} onClick={confirm} disabled={busy}>
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
    { label: "Total vendors", value: meta.total ?? 0, color: "#202A35" },
    { label: "Active", value: counts.active ?? 0, color: STATUS_META.active.dot },
    { label: "Draft", value: counts.draft ?? 0, color: STATUS_META.draft.dot },
    { label: "Suspended", value: counts.suspended ?? 0, color: STATUS_META.suspended.dot },
  ];

  return (
    <div className="min-h-dvh bg-chalk font-body text-ink">
      {/* Brand top bar — same look as the user-facing Dashboard header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sand bg-white px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-forest"><Store size={18} strokeWidth={1.7} /> TrueBites</div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-muted sm:inline">Admin · Vendor Management</span>
          <button className={BTN} onClick={handleBack}>← Back</button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="m-0 text-2xl text-forest">Vendor Management</h1>
            <p className="mb-0 mt-1 text-sm text-muted">
              Create, review and publish eatery records for the TrueBites tourist map.
            </p>
          </div>
          <button className={BTN_PRIMARY} onClick={() => setModal({ mode: "create" })}>+ Add vendor</button>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-sand bg-white px-4 py-3.5">
              <div className="text-[12.5px] font-semibold text-[#9A8478]">{s.label}</div>
              <div className="mt-0.5 text-[26px] font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search & filters — one column on phones, the original six-across from lg */}
        <div className="mb-4.5 rounded-xl border border-sand bg-white p-4">
          <div className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <input className={INPUT} placeholder="🔍 Search business name…" value={search} onChange={(ev) => setSearch(ev.target.value)} />
            <select className={INPUT} value={cuisine} onChange={(ev) => { setCuisine(ev.target.value); setPage(1); }}>
              <option value="">All cuisines</option>
              {meta.cuisines.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={INPUT} value={status} onChange={(ev) => { setStatus(ev.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
            <input className={INPUT} placeholder="Location…" value={location}
              onChange={(ev) => setLocation(ev.target.value)} onBlur={() => setPage(1)}
              onKeyDown={(ev) => ev.key === "Enter" && setPage(1)} />
            <input className={INPUT} placeholder="Hours, e.g. 9am…" value={hours}
              onChange={(ev) => setHours(ev.target.value)} onBlur={() => setPage(1)}
              onKeyDown={(ev) => ev.key === "Enter" && setPage(1)} />
            <button
              className={hasFilters
                ? `${BTN} w-full sm:col-span-2 lg:col-span-1 lg:w-auto`
                : `${BTN} invisible w-full sm:col-span-2 lg:col-span-1 lg:w-auto`}
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-sand bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={TH}>Vendor</th>
                  <th className={TH}>Cuisine</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>Hours</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className={`${TD} p-10 text-center text-[#9A8478]`} colSpan={6}>Loading vendors…</td></tr>
                ) : loadError ? (
                  <tr><td className={`${TD} p-10 text-center text-[#dc2626]`} colSpan={6}>
                    Failed to load vendors: {loadError} — is the backend running on {BASE}?
                  </td></tr>
                ) : vendors.length === 0 ? (
                  <tr><td className={`${TD} p-10 text-center text-[#9A8478]`} colSpan={6}>
                    {hasFilters ? "No vendors match your search or filters." : "No vendors yet — click “+ Add vendor” to create the first record."}
                  </td></tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-chalk">
                      <td className={TD}>
                        <div className="flex min-w-[220px] items-center gap-3">
                          {v.storefront_image_url ? (
                            <img src={v.storefront_image_url} alt="" loading="lazy"
                              className="size-[46px] shrink-0 rounded-lg border border-sand object-cover" />
                          ) : (
                            <div className="flex size-[46px] shrink-0 items-center justify-center rounded-lg bg-chalk"><Store size={20} color="#40544A" strokeWidth={1.6} /></div>
                          )}
                          <div>
                            <div className="font-semibold">{v.vendor_name}</div>
                            {v.phone && <div className="text-xs text-[#9A8478]">📞 {v.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className={TD}>{v.cuisine_types || <span className="text-[#B9A99B]">—</span>}</td>
                      <td className={`${TD} max-w-[240px]`}>
                        <div className="break-words" title={v.address}>{v.address}</div>
                        <div className="text-[11.5px] text-[#B9A99B]">{Number(v.latitude)?.toFixed(4)}, {Number(v.longitude)?.toFixed(4)}</div>
                      </td>
                      <td className={`${TD} max-w-[170px]`}>
                        <div className="truncate" title={v.operating_hours_raw}>
                          {v.operating_hours_raw || <span className="text-[#B9A99B]">—</span>}
                        </div>
                      </td>
                      <td className={TD}>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={v.status || "draft"} />
                          <select
                            value={v.status || "draft"}
                            onChange={(ev) => changeStatus(v, ev.target.value)}
                            title="Change visibility status"
                            className="min-h-11 rounded-md border border-[#d1d5db] bg-white px-1 text-xs"
                          >
                            {Object.entries(STATUS_META).map(([val, m]) => <option key={val} value={val}>{m.label}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className={`${TD} whitespace-nowrap text-right`}>
                        <button className={`${BTN} px-3 text-[13px]`} onClick={() => setModal({ mode: "edit", vendor: v })}>Edit</button>
                        <button className={`${BTN} ml-2 border-[#fca5a5] px-3 text-[13px] text-[#dc2626]`} onClick={() => setModal({ mode: "delete", vendor: v })}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !loadError && total > 0 && (
            <div className="flex flex-col gap-3 border-t border-sand px-4 py-3 text-[13px] text-[#9A8478] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} vendor{total === 1 ? "" : "s"}
              </span>
              <div className="flex items-center justify-center gap-2">
                <button className={`${BTN} px-3 text-[13px]`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <span>Page {page} / {totalPages}</span>
                <button className={`${BTN} px-3 text-[13px]`} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
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
        <div className={toast.isError
          ? "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[2000] mx-auto w-fit max-w-[90vw] break-words rounded-[10px] bg-danger px-5 py-2.5 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,.3)] sm:left-auto sm:right-5 sm:mx-0"
          : "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[2000] mx-auto w-fit max-w-[90vw] break-words rounded-[10px] bg-ink px-5 py-2.5 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,.3)] sm:left-auto sm:right-5 sm:mx-0"}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
