import React from 'react';

export default function SummaryStep({ jobData, onNext, onBack }) {
  const copySummary = () => {
    if (jobData.summary) navigator.clipboard.writeText(jobData.summary);
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>✨</span> AI Content Summarization
      </div>
      <div className="card-subtitle">
        Groq (llama3.1:8b) has analyzed the transcript and produced a concise food content summary.
      </div>

      {/* Model badge */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="language-badge">🤖 llama3.1:8b</div>
        {jobData.detected_language && (
          <div className="language-badge" style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.25)', color: '#a78bfa' }}>
            🌐 {jobData.detected_language === 'ms' ? 'Malay' : jobData.detected_language === 'en' ? 'English' : jobData.detected_language.toUpperCase()}
          </div>
        )}
        {jobData.title && (
          <div className="language-badge" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: 'var(--success)' }}>
            🎬 {jobData.title}
          </div>
        )}
      </div>

      {/* Summary body */}
      {jobData.summary ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
            Summary
          </div>
          <div className="summary-card">{jobData.summary}</div>

          <div className="action-bar">
            <button id="back-to-transcript-btn" className="btn btn-ghost" onClick={onBack}>
              ← Transcript
            </button>
            <div className="action-bar-right">
              <button id="copy-summary-btn" className="btn btn-ghost" onClick={copySummary}>
                📋 Copy
              </button>
              <button id="next-to-extraction-btn" className="btn btn-primary" onClick={onNext}>
                View Extraction →
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Summary is being generated…</p>
        </div>
      )}
    </div>
  );
}
