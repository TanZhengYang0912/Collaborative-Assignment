import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../ai-module.css';
import StepIndicator       from '../components/ai/StepIndicator';
import URLSubmissionStep   from '../components/ai/URLSubmissionStep';
import TranscriptStep      from '../components/ai/TranscriptStep';
import SummaryStep         from '../components/ai/SummaryStep';
import ExtractionStep      from '../components/ai/ExtractionStep';
import BatchProgressStep   from '../components/ai/BatchProgressStep';
import BatchResultsStep    from '../components/ai/BatchResultsStep';

const API_BASE = 'http://localhost:8000/api';
const POLL_MS  = 2000;

const PAGE_TO_STEP = {
  submit:         1,
  processing:     2,
  summary:        3,
  extraction:     4,
  batch_progress: 2,
  batch_results:  4,
};

export default function AIPage() {
  const [page,      setPage]     = useState('submit');
  const [jobId,     setJobId]    = useState(null);
  const [jobData,   setJobData]  = useState({});
  const [batchId,   setBatchId]  = useState(null);
  const [batchData, setBatchData] = useState({});
  const [loggingOut, setLoggingOut] = useState(false);
  const pollerRef      = useRef(null);
  const batchPollerRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/map', { replace: true });
  };

  useEffect(() => {
    if (!jobId || page === 'submit') return;
    pollerRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJobData(data);
        if (data.status === 'completed' || data.status === 'error')
          clearInterval(pollerRef.current);
      } catch { /* ignore */ }
    }, POLL_MS);
    return () => clearInterval(pollerRef.current);
  }, [jobId, page]);

  useEffect(() => {
    if (!batchId || page === 'submit') return;
    batchPollerRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/batch-status/${batchId}`);
        if (!res.ok) return;
        const data = await res.json();
        setBatchData(data);
        if (data.in_progress === 0) clearInterval(batchPollerRef.current);
      } catch { /* ignore */ }
    }, POLL_MS);
    return () => clearInterval(batchPollerRef.current);
  }, [batchId, page]);

  const handleJobStarted = (newJobId, url, platform) => {
    setJobId(newJobId);
    setJobData({ status: 'queued', progress: 0, step: 0, step_label: 'Starting…', url, platform });
    setPage('processing');
  };

  const handleBatchStarted = (newBatchId, total) => {
    setBatchId(newBatchId);
    setBatchData({ total, in_progress: total, completed: 0, failed: 0, jobs: [] });
    setPage('batch_progress');
  };

  const handleReset = () => {
    clearInterval(pollerRef.current);
    clearInterval(batchPollerRef.current);
    setJobId(null);   setJobData({});
    setBatchId(null); setBatchData({});
    setPage('submit');
  };

  const completedSteps = [];
  if (page === 'processing' && jobData.status === 'completed') completedSteps.push(1, 2);
  if (page === 'summary')    completedSteps.push(1, 2);
  if (page === 'extraction') completedSteps.push(1, 2, 3);
  if (page === 'batch_progress' && batchData.in_progress === 0) completedSteps.push(1, 2, 3);
  if (page === 'batch_results') completedSteps.push(1, 2, 3, 4);

  const currentStep = PAGE_TO_STEP[page] || 1;

  return (
    <div className="app-bg">
      <button className="logout-btn" onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? 'Logging out…' : 'Logout'}
      </button>
      <div className="app-container">
        <header className="app-header">
          <div className="badge"><span>🤖</span> AI Content Processing Module</div>
          <h1>Food Influencer<br />Content Analyzer</h1>
          <p>Powered by OpenAI Whisper + Groq llama3.1:8b — extract, transcribe and summarize food recommendations from TikTok &amp; YouTube.</p>
        </header>

        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

        {page === 'submit' && (
          <URLSubmissionStep onJobStarted={handleJobStarted} onBatchStarted={handleBatchStarted} />
        )}
        {page === 'processing' && (
          <TranscriptStep jobData={jobData} onTranscriptReady={() => setPage('summary')} />
        )}
        {page === 'summary' && (
          <SummaryStep jobData={jobData} onNext={() => setPage('extraction')} onBack={() => setPage('processing')} />
        )}
        {page === 'extraction' && (
          <ExtractionStep jobData={jobData} onBack={() => setPage('summary')} onReset={handleReset} />
        )}
        {page === 'batch_progress' && (
          <BatchProgressStep batchData={batchData} onResultsReady={() => setPage('batch_results')} />
        )}
        {page === 'batch_results' && (
          <BatchResultsStep batchData={batchData} onReset={handleReset} />
        )}

        <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ marginBottom: 6 }}>🎙️ Whisper (small) &nbsp;·&nbsp; ⚡ Groq llama3.1:8b &nbsp;·&nbsp; 📥 yt-dlp</div>
          <div>AI Content Processing Module — Malaysia Food Influencer Analytics</div>
        </div>
      </div>
    </div>
  );
}
