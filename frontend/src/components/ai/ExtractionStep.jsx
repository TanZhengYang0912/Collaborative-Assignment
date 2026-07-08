import React, { useState } from 'react';

function getSentimentClass(sentiment) {
  if (!sentiment) return 'recommended';
  const s = sentiment.toLowerCase();
  if (s.includes('highly') || s.includes('recommended')) return 'recommended';
  if (s.includes('mixed'))                                 return 'mixed';
  if (s.includes('not'))                                   return 'not-recommended';
  return 'recommended';
}

function getSentimentEmoji(sentiment) {
  if (!sentiment) return '⭐';
  const s = sentiment.toLowerCase();
  if (s.includes('highly')) return '🌟';
  if (s.includes('recommended')) return '⭐';
  if (s.includes('mixed')) return '🤔';
  if (s.includes('not')) return '👎';
  return '⭐';
}

// Inline editable field — shows value if present, input box if blank
function EditableField({ label, value, placeholder, onChange }) {
  return (
    <div className="extraction-field">
      <div className="extraction-field-label">{label}</div>
      {value ? (
        <div className="extraction-field-value">{value}</div>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={onChange.current || ''}
          onChange={e => onChange.set(e.target.value)}
          style={{
            marginTop: 4,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px dashed var(--border)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-primary)',
            fontSize: 13,
            width: '100%',
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}

export default function ExtractionStep({ jobData, onBack, onReset }) {
  const extracted = jobData.extracted || {};

  // Manual overrides for fields the AI left blank
  const [priceOverride, setPriceOverride]  = useState('');
  const [hoursOverride, setHoursOverride]  = useState('');

  const finalPrice = extracted.price_range     || priceOverride;
  const finalHours = extracted.operating_hours_raw || hoursOverride;

  // Build the merged record (AI extraction + any manual overrides)
  const mergedRecord = {
    ...extracted,
    price_range:         finalPrice || null,
    operating_hours_raw: finalHours || null,
  };

  // ── Download as CSV: fetch from backend, save with proper filename ──
  const downloadCSV = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/export-csv/${jobData.job_id}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const vendorName = (mergedRecord.vendor_name || 'vendor').replace(/[^a-zA-Z0-9]/g, '_');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vendorName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>📋</span> Information Extraction
      </div>
      <div className="card-subtitle">
        Structured eatery data extracted from the transcript by Groq llama-3.1-8b.
      </div>

      {/* Sentiment + Malacca badge */}
      {extracted.sentiment_score && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
            AI Sentiment Score
          </div>
          <span className="sentiment-badge recommended">
            ⭐ {extracted.sentiment_score} / 5.0
          </span>
          {extracted.is_in_malacca !== undefined && (
            <span style={{
              marginLeft: 12,
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: extracted.is_in_malacca ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              color: extracted.is_in_malacca ? 'var(--success)' : 'var(--text-muted)',
            }}>
              {extracted.is_in_malacca ? '📍 Verified Malacca Location' : '⚠️ Not in Malacca'}
            </span>
          )}
        </div>
      )}

      {/* Cuisine Types */}
      {Array.isArray(extracted.cuisine_types) && extracted.cuisine_types.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
            🍜 Cuisine Types
          </div>
          <div className="dishes-list">
            {extracted.cuisine_types.map((cuisine, i) => (
              <span key={i} className="dish-tag" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{cuisine}</span>
            ))}
          </div>
        </div>
      )}

      {/* Signature dishes */}
      {Array.isArray(extracted.signature_dishes) && extracted.signature_dishes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
            🍽️ Signature Dishes
          </div>
          <div className="dishes-list">
            {extracted.signature_dishes.map((dish, i) => (
              <span key={i} className="dish-tag">{dish}</span>
            ))}
          </div>
        </div>
      )}

      {/* Field grid — fixed fields (vendor_name, address) */}
      <div className="extraction-grid" style={{ marginBottom: 14 }}>
        <div className="extraction-field">
          <div className="extraction-field-label">🏪 Vendor Name</div>
          <div className={`extraction-field-value ${!extracted.vendor_name ? 'null-value' : ''}`}>
            {extracted.vendor_name || 'Not mentioned'}
          </div>
        </div>
        <div className="extraction-field">
          <div className="extraction-field-label">📍 Address</div>
          <div className={`extraction-field-value ${!extracted.address ? 'null-value' : ''}`}>
            {extracted.address || 'Not mentioned'}
          </div>
        </div>

        {/* Price Range — editable if blank */}
        <div className="extraction-field">
          <div className="extraction-field-label">💰 Price Range</div>
          {extracted.price_range ? (
            <div className="extraction-field-value">{extracted.price_range}</div>
          ) : (
            <input
              type="text"
              placeholder="e.g. RM10–20 per person"
              value={priceOverride}
              onChange={e => setPriceOverride(e.target.value)}
              style={{
                marginTop: 6,
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px dashed var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                fontSize: 13,
                width: '100%',
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* Operating Hours — editable if blank */}
        <div className="extraction-field">
          <div className="extraction-field-label">🕐 Operating Hours</div>
          {extracted.operating_hours_raw ? (
            <div className="extraction-field-value">{extracted.operating_hours_raw}</div>
          ) : (
            <input
              type="text"
              placeholder="e.g. 9am–10pm daily"
              value={hoursOverride}
              onChange={e => setHoursOverride(e.target.value)}
              style={{
                marginTop: 6,
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px dashed var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)',
                fontSize: 13,
                width: '100%',
                outline: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Special Notes — full width */}
      <div className="extraction-field" style={{ marginBottom: 20 }}>
        <div className="extraction-field-label">📝 Special Notes</div>
        <div className={`extraction-field-value ${!extracted.special_notes ? 'null-value' : ''}`}>
          {extracted.special_notes || 'Not mentioned'}
        </div>
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <button id="back-to-summary-btn" className="btn btn-ghost" onClick={onBack}>
          ← Summary
        </button>
        <div className="action-bar-right">
          {/* Download as CSV */}
          <button id="download-csv-btn" className="btn btn-ghost" onClick={downloadCSV}>
            📥 Download as CSV
          </button>
          {/* Save to Database */}
          <div className="tooltip-wrap">
            <button className="btn btn-disabled" disabled>
              🗄️ Save to Database
            </button>
            <div className="tooltip">Only Malacca locations will be saved to the database (Coming soon)</div>
          </div>
          <button id="process-new-btn" className="btn btn-primary" onClick={onReset}>
            ➕ New Video
          </button>
        </div>
      </div>

      {/* Raw JSON (collapsible) */}
      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', userSelect: 'none', padding: '8px 0' }}>
          🔍 View raw JSON
        </summary>
        <pre style={{
          marginTop: 10,
          padding: 16,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--text-secondary)',
          overflow: 'auto',
          maxHeight: 300,
          fontFamily: 'monospace',
        }}>
          {JSON.stringify(mergedRecord, null, 2)}
        </pre>
      </details>
    </div>
  );
}
