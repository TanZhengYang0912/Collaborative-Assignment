# 🍜 Food Influencer Content Analyzer

A web application that automatically downloads, transcribes, and summarizes food influencer videos from TikTok and YouTube using AI. Built for Malaysian food content analysis.

## ✨ Features

- 🎬 **Download** videos from TikTok and YouTube
- 🎙️ **Transcribe** audio using OpenAI Whisper (supports Malay, English, Chinese)
- 🤖 **Summarize** content using Groq AI (llama-3.1-8b-instant) — free & fast
- 📊 **Extract** structured info: eatery name, location, rating, price, must-try dishes
- 📦 **Batch processing** — scrape a creator's profile and process up to 50 videos at once
- 🗺️ **Malacca filter** — flags eateries located in Malacca/Melaka

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Speech-to-Text | OpenAI Whisper (runs locally) |
| AI Summarization | Groq API — llama-3.1-8b-instant (cloud, free) |
| Video Download | yt-dlp |

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **ffmpeg** (required by Whisper for audio processing)
- **Groq API Key** (free) — get it at [console.groq.com](https://console.groq.com)

---

## 🚀 Installation

### Step 1 — Install ffmpeg

ffmpeg is required for audio processing.

#### macOS
```bash
# Using Homebrew (recommended)
brew install ffmpeg

# Verify installation
ffmpeg -version
```

> If you don't have Homebrew, install it first:
> ```bash
> /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
> ```

#### Windows
1. Download ffmpeg from [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extract the zip file (e.g., to `C:\ffmpeg`)
3. Add to PATH:
   - Open **Start** → search **"Environment Variables"**
   - Click **"Edit the system environment variables"**
   - Click **"Environment Variables"**
   - Under **System Variables**, find **Path** → click **Edit**
   - Click **New** → add `C:\ffmpeg\bin`
   - Click **OK** on all dialogs
4. Verify in a new terminal:
   ```cmd
   ffmpeg -version
   ```

---

### Step 2 — Get a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / log in (Google account works)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Copy the key — you will need it in Step 4

---

### Step 3 — Set Up the Backend

#### macOS
```bash
cd aiContent/backend

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Windows
```cmd
cd aiContent\backend

# Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

### Step 4 — Configure Environment Variables

#### macOS
```bash
cp .env.example .env
nano .env
```

#### Windows
```cmd
copy .env.example .env
notepad .env
```

Add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
```

---

### Step 5 — Set Up the Frontend

#### macOS & Windows
```bash
cd aiContent/frontend
npm install
```

---

## Running the Application

You need **two terminals** running simultaneously.

### Terminal 1 — Backend

#### macOS
```bash
cd aiContent/backend
source venv/bin/activate
python main.py
```

#### Windows
```cmd
cd aiContent\backend
venv\Scripts\activate
python main.py
```

Backend: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

> **Auto-reload is built in** — the server will automatically restart whenever you save any `.py` file. No need to manually restart.

### Terminal 2 — Frontend

#### macOS & Windows
```bash
cd aiContent/frontend
npm run dev
```

Open: **`http://localhost:5173`**

---

## 📖 Usage

1. Open `http://localhost:5173` in your browser
2. **Single video**: Paste a TikTok or YouTube video URL → click **Process**
3. **Batch mode**: Paste a TikTok/YouTube profile URL → select videos → click **Batch Process**
4. Wait for processing (download → transcribe → summarize → extract)
5. View transcript, AI summary, and structured extraction results

---

## 📁 Project Structure

```
aiContent/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables (not committed)
│   ├── .env.example          # Environment template
│   ├── routes/
│   │   └── process.py        # API endpoints
│   ├── services/
│   │   ├── downloader.py     # yt-dlp video/audio downloader
│   │   ├── transcriber.py    # OpenAI Whisper transcription
│   │   ├── summarizer.py     # Groq AI summarization
│   │   └── extractor.py      # Structured info extraction
│   └── outputs/              # Job results stored here
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main app component
    │   ├── components/        # UI components
    │   └── index.css          # Global styles
    └── package.json
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/validate-url | Validate a TikTok/YouTube URL |
| POST | /api/process | Start processing a single video |
| GET | /api/status/{job_id} | Poll job status |
| GET | /api/results/{job_id} | Get completed job results |
| POST | /api/scrape-profile | Scrape video list from a profile |
| POST | /api/batch-process | Start batch processing (up to 50 videos) |
| GET | /api/batch-status/{batch_id} | Poll batch status |

---

## Notes

- **First run**: Whisper will auto-download the model (~150MB) on first use.
- **TikTok limitations**: Some TikTok videos may be restricted by privacy settings.
- **Groq free tier**: 14,400 requests/day and 30 requests/minute — sufficient for normal use.
- **Auto-reload**: The backend (`python main.py`) watches for file changes and reloads automatically during development.
- **AI Model**: Uses `llama-3.1-8b-instant` on Groq — lightweight, fast, and free.
- **Keep `.env` private**: Never commit your `.env` file or share your API key publicly.

---

## 🐛 Troubleshooting

### ffmpeg not found
Make sure ffmpeg is installed and in your system PATH. Re-open your terminal after installing.

### GROQ_API_KEY not working
- Confirm the `.env` file is inside the `backend/` folder
- Confirm no extra spaces around the `=` sign
- Regenerate a new key at [console.groq.com](https://console.groq.com)

### Port already in use

macOS:
```bash
lsof -ti:8000 | xargs kill
```

Windows:
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### Python ModuleNotFoundError
Make sure your virtual environment is activated before running uvicorn.
