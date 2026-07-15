import { useEffect, useState } from "react";
import { Eye, EyeOff, Search, Star } from "lucide-react";
import { getAdminReviews, setReviewVisibility } from "../../api/admin";

const VISIBILITY_OPTIONS = ["all", "visible", "hidden"];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, isError, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 100,
        padding: "10px 18px",
        borderRadius: 999,
        background: isError ? "#dc2626" : "#20395f",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 8px 24px rgba(15,23,42,0.18)",
        animation: "fadeInUp 0.22s ease",
      }}
    >
      {isError ? message : `✓ ${message}`}
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <div className="admin-pagination-meta"><strong>{total}</strong> reviews</div>
      <div className="admin-pagination-controls">
        <button type="button" className="admin-secondary-btn compact" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <span>Page {page} / {totalPages}</span>
        <button type="button" className="admin-secondary-btn compact" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export default function AdminReviewModerationPage() {
  const [draftQuery, setDraftQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null); // { message, isError }

  const PAGE_SIZE = 10;

  const load = (page = data.pagination.page) => {
    setLoading(true);
    setError("");
    return getAdminReviews({ page, pageSize: PAGE_SIZE, visibility })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getAdminReviews({ page: 1, pageSize: PAGE_SIZE, visibility })
      .then((payload) => { if (active) setData(payload); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visibility]);

  const query = draftQuery.trim().toLowerCase();
  const filtered = query
    ? data.items.filter((r) => r.vendorName?.toLowerCase().includes(query) || r.authorName?.toLowerCase().includes(query) || r.body?.toLowerCase().includes(query))
    : data.items;

  const handleToggle = async (review) => {
    setUpdatingId(review.id);
    try {
      await setReviewVisibility(review.id, !review.isHidden);
      await load();
      setToast({ message: review.isHidden ? "Review restored successfully." : "Review hidden successfully." });
    } catch (err) {
      setError(err.message);
      setToast({ message: err.message, isError: true });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="admin-vendors-page">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} />
          <input value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} placeholder="Search reviews, vendors, authors…" />
        </div>
        <div className="admin-filter-cluster">
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {VISIBILITY_OPTIONS.map((v) => (
              <option key={v} value={v}>{v === "all" ? "All Reviews" : v[0].toUpperCase() + v.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="admin-feedback error">{error}</div> : null}

      <section className="admin-panel admin-table-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Author</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6"><div className="admin-feedback">Loading reviews…</div></td></tr>
            ) : filtered.length ? (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.vendorName || "—"}</strong></td>
                  <td>{r.authorName || "Anonymous"}</td>
                  <td className="admin-table-score">
                    <Star size={13} fill="currentColor" />
                    <span>{r.rating}</span>
                  </td>
                  <td>
                    <div className="admin-table-clamp clamp-2">{r.body || <span className="admin-dash">—</span>}</div>
                  </td>
                  <td>
                    <span className={`admin-status-pill ${r.isHidden ? "suspended" : "active"}`}>
                      {r.isHidden ? `Hidden${r.hiddenReason ? ` · ${r.hiddenReason}` : ""}` : "Visible"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        onClick={() => handleToggle(r)}
                        disabled={updatingId === r.id}
                        aria-label={r.isHidden ? "Unhide review" : "Hide review"}
                      >
                        {r.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6"><div className="admin-empty-state">No reviews matched this filter.</div></td></tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={data.pagination} onPageChange={load} />
      </section>

      {toast && <Toast message={toast.message} isError={toast.isError} onDone={() => setToast(null)} />}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
