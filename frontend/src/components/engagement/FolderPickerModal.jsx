import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../lib/theme";


export default function FolderPickerModal({ vendorName, folders, onClose, onSave, onCreateFolder }) {
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(null); // folder id currently saving, or "new"
  const [error, setError] = useState("");

  const customFolders = folders.filter((f) => !f.is_default);

  const handleSave = async (folderId) => {
    setSaving(folderId || "default");
    setError("");
    try {
      await onSave(folderId);
    } catch (e) {
      setError(e.message);
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setError("Folder name is required.");
      return;
    }
    const exists = folders.some((f) => f.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setError("A folder with this name already exists.");
      return;
    }
    setSaving("new");
    setError("");
    try {
      await onCreateFolder(name);
    } catch (e) {
      setError(e.message);
      setSaving(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(27,42,74,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 340, background: C.card, borderRadius: 16,
          fontFamily: FONT_BODY, boxShadow: "0 20px 60px rgba(27,42,74,0.35)",
          padding: "18px 18px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.navy, margin: 0 }}>Save to folder</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.muted} />
          </button>
        </div>
        {vendorName && <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>{vendorName}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
          <button
            onClick={() => handleSave(null)}
            disabled={saving !== null}
            style={{
              textAlign: "left", padding: "10px 12px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.cream, cursor: "pointer",
              fontSize: 13.5, color: C.navy, fontFamily: FONT_BODY, fontWeight: 600,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span>Save without folder</span>
            {saving === "default" && <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 400 }}>Saving…</span>}
          </button>
          {customFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSave(f.id)}
              disabled={saving !== null}
              style={{
                textAlign: "left", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer",
                fontSize: 13.5, color: C.navy, fontFamily: FONT_BODY,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span>{f.name}</span>
              {saving === f.id && <span style={{ fontSize: 11.5, color: C.muted }}>Saving…</span>}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          {creating ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                  fontSize: 13.5, fontFamily: FONT_BODY,
                }}
              />
              <button
                onClick={handleCreate}
                disabled={saving !== null}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "none", background: C.navy,
                  color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY,
                }}
              >
                {saving === "new" ? "…" : "Create"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                color: C.gold, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY, padding: 0,
              }}
            >
              <FolderPlus size={15} /> New folder
            </button>
          )}
        </div>

        {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#c0392b" }}>{error}</div>}
      </div>
    </div>
  );
}
