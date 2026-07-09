import { Eye, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  createAdminVendor, deleteAdminVendor, getAdminVendors,
  updateAdminVendor, uploadVendorImage,
} from "../../api/admin";

const CATEGORIES = ["Malaysian / Local", "Nyonya / Peranakan", "Chinese", "Cafe / Dessert", "Western"];
const STATUS_OPTIONS = ["all", "active", "pending", "suspended"];
const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "az", label: "Name A-Z" },
  { value: "za", label: "Name Z-A" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

// Every 30-min slot in 12-hour form, zero-padded — "12:00 AM", "12:30 AM", "01:00 AM" … "11:30 PM".
// Matches the DB's stored hour format; picking from this list can never produce
// garbage like the "50 - 90" / "3 - 4" values some AI-extracted rows have.
const HOUR_SLOTS = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const period = h < 12 ? "AM" : "PM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    HOUR_SLOTS.push(`${String(displayHour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`);
  }
}

const MELAKA_BOUNDS = { latMin: 1.8, latMax: 2.6, lngMin: 101.8, lngMax: 102.8 };
const PHONE_RE = /^(\+?60|0)\d{8,10}$/;

const emptyForm = {
  vendor_name: "",
  address: "",
  latitude: "",
  longitude: "",
  cuisine_types: CATEGORIES[0],
  priceMin: "",
  priceMax: "",
  openSlot: "09:00 AM",
  closeSlot: "06:00 PM",
  signature_dishes: "",
  phone: "",
  status: "draft",
  imageFile: null,
};

// "RM 10 - RM 20 per person" / "RM10-20 per person" / "RM 20 per person" (equal
// min/max, single-value form) -> { priceMin: "10", priceMax: "20" }
function parsePriceRange(str) {
  const range = (str || "").match(/RM\s*(\d+(?:\.\d+)?)\s*-\s*(?:RM\s*)?(\d+(?:\.\d+)?)/i);
  if (range) return { priceMin: range[1], priceMax: range[2] };
  const single = (str || "").match(/RM\s*(\d+(?:\.\d+)?)/i);
  if (single) return { priceMin: single[1], priceMax: single[1] };
  return { priceMin: "", priceMax: "" };
}

// Swaps min/max if entered backwards; collapses to a single value when equal.
function formatPriceRange(minRaw, maxRaw) {
  let min = Number.parseFloat(minRaw);
  let max = Number.parseFloat(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (min > max) [min, max] = [max, min];
  if (min === max) return `RM ${min} per person`;
  return `RM ${min} - RM ${max} per person`;
}

// "07:00 AM - 02:00 PM" -> { openSlot: "07:00 AM", closeSlot: "02:00 PM" }.
// Garbage strings ("50 - 90", "3 - 4", "30:00 PM - 10") don't match this
// pattern at all and fall back to sane defaults — editing + saving such a
// vendor replaces the bad value with a clean one.
const HOURS_RE = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;

function toSlot(hh, mm, period) {
  const h = Math.min(12, Math.max(1, Number.parseInt(hh, 10) || 12));
  const min = Number.parseInt(mm, 10) >= 15 ? 30 : 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period.toUpperCase()}`;
}

function parseHours(str) {
  const m = (str || "").match(HOURS_RE);
  if (!m) return { openSlot: "09:00 AM", closeSlot: "06:00 PM" };
  const openSlot = toSlot(m[1], m[2], m[3]);
  const closeSlot = toSlot(m[4], m[5], m[6]);
  return {
    openSlot: HOUR_SLOTS.includes(openSlot) ? openSlot : "09:00 AM",
    closeSlot: HOUR_SLOTS.includes(closeSlot) ? closeSlot : "06:00 PM",
  };
}

function makeForm(vendor) {
  return {
    vendor_name: vendor.name || "",
    address: vendor.fullAddress || "",
    latitude: vendor.latitude != null ? String(vendor.latitude) : "",
    longitude: vendor.longitude != null ? String(vendor.longitude) : "",
    cuisine_types: CATEGORIES.includes(vendor.category) ? vendor.category : CATEGORIES[0],
    ...parsePriceRange(vendor.priceRange),
    ...parseHours(vendor.operatingHours),
    signature_dishes: vendor.dishes?.join(", ") || "",
    phone: vendor.phone || "",
    status: (vendor.status || "draft").toLowerCase(),
    imageFile: null,
  };
}

function validateForm(form) {
  const errors = {};

  const name = form.vendor_name.trim();
  if (!name) errors.vendor_name = "Vendor name is required.";
  else if (name.length < 2 || name.length > 120) errors.vendor_name = "Must be 2–120 characters.";

  if (!form.address.trim()) errors.address = "Address is required.";

  const lat = Number.parseFloat(form.latitude);
  if (form.latitude === "" || Number.isNaN(lat)) errors.latitude = "Latitude is required.";
  else if (lat < MELAKA_BOUNDS.latMin || lat > MELAKA_BOUNDS.latMax) {
    errors.latitude = `Outside Melaka (${MELAKA_BOUNDS.latMin}–${MELAKA_BOUNDS.latMax}).`;
  }

  const lng = Number.parseFloat(form.longitude);
  if (form.longitude === "" || Number.isNaN(lng)) errors.longitude = "Longitude is required.";
  else if (lng < MELAKA_BOUNDS.lngMin || lng > MELAKA_BOUNDS.lngMax) {
    errors.longitude = `Outside Melaka (${MELAKA_BOUNDS.lngMin}–${MELAKA_BOUNDS.lngMax}).`;
  }

  if (form.priceMin === "" || Number.isNaN(Number.parseFloat(form.priceMin)) || Number(form.priceMin) < 0) {
    errors.priceMin = "Required (number ≥ 0).";
  }
  if (form.priceMax === "" || Number.isNaN(Number.parseFloat(form.priceMax)) || Number(form.priceMax) < 0) {
    errors.priceMax = "Required (number ≥ 0).";
  }

  if (!form.signature_dishes.trim()) errors.signature_dishes = "Signature dishes are required.";

  const phone = form.phone.trim();
  if (!phone) errors.phone = "Contact number is required.";
  else if (!PHONE_RE.test(phone.replace(/[\s-]/g, ""))) errors.phone = "Invalid Malaysian number, e.g. 06-283 1234.";

  if (form.openSlot === form.closeSlot) errors.hours = "Opening and closing time can't be the same.";

  return errors;
}

function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <div className="admin-pagination-meta">
        <strong>{total}</strong> vendors in Supabase
      </div>
      <div className="admin-pagination-controls">
        <button type="button" className="admin-secondary-btn compact" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span>Page {page} / {totalPages}</span>
        <button type="button" className="admin-secondary-btn compact" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

function FieldError({ message }) {
  return message ? <div className="admin-field-error">{message}</div> : null;
}

// Shared by the Add Vendor modal, the Edit form, AND the read-only View —
// `disabled` greys every control out for View, without duplicating markup.
function VendorFormFields({ form, errors, onChange, onFileChange, disabled }) {
  return (
    <>
      <label>
        <span>Name</span>
        <input name="vendor_name" value={form.vendor_name} onChange={onChange} disabled={disabled} placeholder="e.g. Cendol Pak Hj Ramli" />
        <FieldError message={errors?.vendor_name} />
      </label>

      <label>
        <span>Address</span>
        <textarea name="address" value={form.address} onChange={onChange} disabled={disabled} rows={2} placeholder="Full address" />
        <FieldError message={errors?.address} />
      </label>

      <div className="admin-modal-grid">
        <label>
          <span>Latitude</span>
          <input type="number" step="any" name="latitude" value={form.latitude} onChange={onChange} disabled={disabled} placeholder="2.1946" />
          <FieldError message={errors?.latitude} />
        </label>
        <label>
          <span>Longitude</span>
          <input type="number" step="any" name="longitude" value={form.longitude} onChange={onChange} disabled={disabled} placeholder="102.2485" />
          <FieldError message={errors?.longitude} />
        </label>
      </div>

      <div className="admin-modal-grid admin-modal-grid-3">
        <label>
          <span>Category</span>
          <select name="cuisine_types" value={form.cuisine_types} onChange={onChange} disabled={disabled}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          <span>Price Range (RM / Person)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12.5, color: "var(--admin-muted)", flexShrink: 0 }}>RM</span>
            <input type="number" min="0" name="priceMin" value={form.priceMin} onChange={onChange} disabled={disabled} style={{ minWidth: 0, width: 56 }} />
            <span style={{ fontSize: 12.5, color: "var(--admin-muted)", flexShrink: 0 }}>–</span>
            <span style={{ fontSize: 12.5, color: "var(--admin-muted)", flexShrink: 0 }}>RM</span>
            <input type="number" min="0" name="priceMax" value={form.priceMax} onChange={onChange} disabled={disabled} style={{ minWidth: 0, width: 56 }} />
          </div>
          <FieldError message={errors?.priceMin || errors?.priceMax} />
        </label>

        <label>
          <span>Operating Hours</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select name="openSlot" value={form.openSlot} onChange={onChange} disabled={disabled} style={{ flex: 1, minWidth: 0 }}>
              {HOUR_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>–</span>
            <select name="closeSlot" value={form.closeSlot} onChange={onChange} disabled={disabled} style={{ flex: 1, minWidth: 0 }}>
              {HOUR_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <FieldError message={errors?.hours} />
        </label>
      </div>

      <label>
        <span>Signature Dishes</span>
        <input name="signature_dishes" value={form.signature_dishes} onChange={onChange} disabled={disabled} placeholder="Comma-separated e.g. Cendol, Ice Kacang" />
        <FieldError message={errors?.signature_dishes} />
      </label>

      <div className="admin-modal-grid admin-modal-grid-3">
        <label>
          <span>Phone</span>
          <input name="phone" value={form.phone} onChange={onChange} disabled={disabled} placeholder="e.g. +60 12-345 6789" />
          <FieldError message={errors?.phone} />
        </label>
        <label>
          <span>Add Image</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFileChange} disabled={disabled} />
        </label>
        <label>
          <span>Status</span>
          <select name="status" value={form.status} onChange={onChange} disabled={disabled}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>
    </>
  );
}

function VendorDetailModal({ vendor, editing, form, errors, saving, error, onClose, onChange, onFileChange, onEditToggle, onSave }) {
  if (!vendor) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card wide" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{editing ? "Edit Vendor" : vendor.name}</h2>
          </div>
          <button type="button" className="admin-icon-btn subtle" onClick={onClose}>×</button>
        </div>

        <div className="admin-modal-form">
          <VendorFormFields form={form} errors={editing ? errors : null} onChange={onChange} onFileChange={onFileChange} disabled={!editing} />

          {!editing && (
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--admin-muted)" }}>
              <span>Source: {vendor.sourcePlatform}</span>
              <span>Location: {vendor.locationPrecision || "Unknown"}</span>
              <span>AI Score: {vendor.aiScore ? Number(vendor.aiScore).toFixed(1) : "—"}</span>
            </div>
          )}

          {error && <div className="admin-feedback error">{error}</div>}

          <div className="admin-modal-actions">
            {editing ? (
              <>
                <button type="button" className="admin-secondary-btn compact" onClick={onEditToggle}>Cancel</button>
                <button type="button" className="admin-primary-btn compact" onClick={onSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="admin-secondary-btn compact" onClick={onClose}>Close</button>
                <button type="button" className="admin-primary-btn compact" onClick={onEditToggle}>
                  <Pencil size={14} />
                  <span>Edit Vendor</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddVendorModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }));

  const handleSave = async () => {
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setError("");
    try {
      const created = await createAdminVendor({
        vendor_name: form.vendor_name,
        address: form.address,
        cuisine_types: form.cuisine_types,
        signature_dishes: form.signature_dishes,
        price_range: formatPriceRange(form.priceMin, form.priceMax),
        phone: form.phone,
        latitude: form.latitude,
        longitude: form.longitude,
        operating_hours_raw: `${form.openSlot} - ${form.closeSlot}`,
        status: form.status,
      });
      if (form.imageFile && created?.id) {
        await uploadVendorImage(created.id, form.imageFile);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card wide" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>Add Vendor</h2>
            <p>Create a new vendor record in Supabase</p>
          </div>
          <button type="button" className="admin-icon-btn subtle" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-form">
          <VendorFormFields form={form} errors={errors} onChange={handleChange} onFileChange={handleFileChange} disabled={false} />
          {error && <div className="admin-feedback error">{error}</div>}
          <div className="admin-modal-actions">
            <button type="button" className="admin-secondary-btn compact" onClick={onClose}>Cancel</button>
            <button type="button" className="admin-primary-btn compact" onClick={handleSave} disabled={saving}>
              {saving ? "Creating…" : "Create Vendor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorManagementPage() {
  const { setTopbarAction } = useOutletContext();
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const PAGE_SIZE = 10;

  // Real-time search — debounce like VendorsPage.jsx, no Enter/submit needed.
  useEffect(() => {
    const t = setTimeout(() => setQuery(draftQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [draftQuery]);

  // "Add Vendor" lives in the AdminLayout topbar (left of "View Site") — only
  // this page sets it, via Outlet context; cleared on unmount.
  useEffect(() => {
    setTopbarAction(
      <button type="button" className="admin-primary-btn compact" onClick={() => setShowAddModal(true)}>
        <Plus size={14} />
        <span>Add Vendor</span>
      </button>
    );
    return () => setTopbarAction(null);
  }, [setTopbarAction]);

  const loadVendors = (overrides = {}) => {
    const page = overrides.page ?? 1;
    setLoading(true);
    setError("");
    return getAdminVendors({ page, pageSize: PAGE_SIZE, status, category, sort, q: query })
      .then((payload) => setData(payload))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getAdminVendors({ page: data.pagination.page, pageSize: PAGE_SIZE, status, category, sort, q: query })
      .then((payload) => { if (active) setData(payload); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.pagination.page, status, category, sort, query]);

  const resetToFirstPage = () => setData((cur) => ({ ...cur, pagination: { ...cur.pagination, page: 1 } }));

  const openVendor = (vendor) => {
    setSelectedVendor(vendor);
    setEditing(false);
    setError("");
    setErrors({});
    setForm(makeForm(vendor));
  };

  const handlePageChange = (page) => {
    setData((cur) => ({ ...cur, pagination: { ...cur.pagination, page } }));
  };

  const handleSave = async () => {
    if (!selectedVendor) return;
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setError("");
    try {
      await updateAdminVendor(selectedVendor.id, {
        vendor_name: form.vendor_name,
        address: form.address,
        cuisine_types: form.cuisine_types,
        signature_dishes: form.signature_dishes,
        price_range: formatPriceRange(form.priceMin, form.priceMax),
        phone: form.phone,
        latitude: form.latitude,
        longitude: form.longitude,
        operating_hours_raw: `${form.openSlot} - ${form.closeSlot}`,
        status: form.status,
      });
      if (form.imageFile) {
        await uploadVendorImage(selectedVendor.id, form.imageFile);
      }
      const refreshed = await getAdminVendors({ page: data.pagination.page, pageSize: PAGE_SIZE, status, category, sort, q: query });
      setData(refreshed);
      const updated = refreshed.items.find((i) => i.id === selectedVendor.id);
      if (updated) { setSelectedVendor(updated); setForm(makeForm(updated)); }
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteAdminVendor(id);
      setConfirmDeleteId(null);
      const refreshed = await getAdminVendors({ page: data.pagination.page, pageSize: PAGE_SIZE, status, category, sort, q: query });
      setData(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-vendors-page">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} />
          <input
            value={draftQuery}
            onChange={(e) => { setDraftQuery(e.target.value); resetToFirstPage(); }}
            placeholder="Search Vendors, Categories, Dishes…"
          />
        </div>

        <div className="admin-filter-cluster">
          <select value={category} onChange={(e) => { setCategory(e.target.value); resetToFirstPage(); }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); resetToFirstPage(); }}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); resetToFirstPage(); }}>
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {error ? <div className="admin-feedback error">{error}</div> : null}

      <section className="admin-panel admin-table-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Hours</th>
              <th>Status</th>
              <th>AI Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6"><div className="admin-feedback">Loading vendors…</div></td></tr>
            ) : data.items.length ? (
              data.items.map((vendor) => (
                <tr key={vendor.id}>
                  <td><strong>{vendor.name}</strong></td>
                  <td>{vendor.category}</td>
                  <td>{vendor.operatingHours || <span className="admin-dash">—</span>}</td>
                  <td>
                    <span className={`admin-status-pill ${vendor.status.toLowerCase()}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="admin-table-score">
                    {vendor.aiScore ? (
                      <>
                        <Star size={13} fill="currentColor" />
                        <span>{Number(vendor.aiScore).toFixed(1)}</span>
                      </>
                    ) : (
                      <span className="admin-dash">—</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" onClick={() => openVendor(vendor)} aria-label={`View ${vendor.name}`}>
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { openVendor(vendor); setEditing(true); }}
                        aria-label={`Edit ${vendor.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      {confirmDeleteId === vendor.id ? (
                        <div className="admin-confirm-row">
                          <span>Delete?</span>
                          <button type="button" className="danger" onClick={() => handleDelete(vendor.id)} disabled={deleting}>
                            {deleting ? "…" : "Yes"}
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)}>No</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => setConfirmDeleteId(vendor.id)}
                          aria-label={`Delete ${vendor.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6"><div className="admin-empty-state">No vendors matched this filter.</div></td></tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={data.pagination} onPageChange={handlePageChange} />
      </section>

      <VendorDetailModal
        vendor={selectedVendor}
        editing={editing}
        form={form}
        errors={errors}
        saving={saving}
        error={error}
        onClose={() => setSelectedVendor(null)}
        onEditToggle={() => {
          // Always resync from the source-of-truth vendor — discards any
          // unsaved edits when cancelling out of edit mode too.
          if (selectedVendor) setForm(makeForm(selectedVendor));
          setErrors({});
          setError("");
          setEditing((v) => !v);
        }}
        onChange={(e) => {
          const { name, value } = e.target;
          setForm((cur) => ({ ...cur, [name]: value }));
        }}
        onFileChange={(e) => setForm((cur) => ({ ...cur, imageFile: e.target.files?.[0] || null }))}
        onSave={handleSave}
      />

      {showAddModal && (
        <AddVendorModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => loadVendors({ page: 1 })}
        />
      )}
    </section>
  );
}
