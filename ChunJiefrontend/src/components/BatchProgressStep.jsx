import React from 'react';

const STATUS_ICONS = {
  queued: '⏳',
  downloading: '📥',
  transcribing: '🎙️',
  summarizing: '🤖',
  extracting: '📋',
  completed: '✅',
  error: '⚠️',
};

export default function BatchProgressStep({ batchData, onResultsReady }) {
  const isDone = batchData.in_progress === 0;

  return (
    <div className="card">
      <div className="card-title">
        <span>🔄</span> Batch Processing
      </div>
      <div className="card-subtitle">
        Processing {batchData.total} videos from {batchData.profile_url}
      </div>

      <div className="batch-summary-bar">
        <div className="batch-stat">
          <div className="batch-stat-value text-success">{batchData.completed || 0}</div>
          <div className="batch-stat-label">Completed</div>
        </div>
        <div className="batch-stat">
          <div className="batch-stat-value text-muted">{batchData.in_progress || 0}</div>
          <div className="batch-stat-label">In Progress</div>
        </div>
        <div className="batch-stat">
          <div className="batch-stat-value text-error">{batchData.failed || 0}</div>
          <div className="batch-stat-label">Failed</div>
        </div>
      </div>

      <div className="batch-job-list">
        {batchData.jobs && batchData.jobs.map((job) => {
          const isActive = job.status !== 'completed' && job.status !== 'error' && job.status !== 'queued';
          const isError = job.status === 'error';
          const isCompleted = job.status === 'completed';

          return (
            <div key={job.job_id} className={`batch-job-row ${isActive ? 'active' : ''} ${isCompleted ? 'done' : ''} ${isError ? 'warning' : ''}`}>
              <div className="batch-status-icon" title={job.step_label || job.status}>
                {isActive ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : (STATUS_ICONS[job.status] || '⏳')}
              </div>
              
              {job.thumbnail ? (
                <img src={job.thumbnail} alt={job.title} className="batch-job-thumb" />
              ) : (
                <div className="batch-job-thumb-placeholder">🎵</div>
              )}

              <div className="batch-job-info">
                <div className="batch-job-title" title={job.title || job.url}>
                  {job.title || job.url}
                </div>
                {isError ? (
                  <div style={{ fontSize: 11, color: 'var(--warning)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {job.error}
                  </div>
                ) : (
                  <div className="batch-job-progress-bar">
                    <div className="batch-job-progress-fill" style={{ width: `${job.progress || 0}%` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="action-bar">
        {!isDone ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            ⏳ Processing... ({batchData.completed || 0} / {batchData.total || 0})
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--success)' }}>
            ✅ Batch complete!
          </span>
        )}
        <button className="btn btn-primary" onClick={onResultsReady}>
          {isDone ? 'View Results Table →' : 'Force View Results →'}
        </button>
      </div>
    </div>
  );
}
