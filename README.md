# CodeGuardian AI — Enterprise AI Code Review Assistant

CodeGuardian AI is a production-ready, enterprise-grade AI Code Review Assistant and Developer Platform similar to GitHub Copilot Code Review, CodeRabbit, and SonarQube. It features a modern dark-mode Glassmorphism UI, real-time code analysis progress, multi-agent AI review engines, Monaco Editor integration, and a unified single Vercel deployment architecture.

---

## Deployment Architecture

CodeGuardian AI is structured for **Single Vercel Project Deployment**:

```text
Next.js 15 Frontend (App Router)
       +
Python FastAPI Serverless Function (/api/index.py)
       +
PostgreSQL Database (or SQLite /tmp fallback)
       +
OpenAI / GitHub OAuth APIs
       ↓
Single Vercel Project Deployment
```

---

## Directory Structure

```text
CodeGuardian/
├── api/
│   └── index.py             # Vercel Python Serverless Function entrypoint
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application setup & middleware
│   ├── config.py            # Environment configuration
│   ├── database.py          # SQLAlchemy PostgreSQL / SQLite fallback engine
│   ├── seed.py              # Initial demo database seeding
│   ├── models/              # SQLAlchemy database models
│   ├── routers/             # API endpoint routers (/api/v1/...)
│   ├── schemas/             # Pydantic data validation schemas
│   └── services/            # Multi-agent AI orchestrator & services
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Glassmorphism React components
│   ├── hooks/               # Custom React hooks (WebSockets + HTTP polling fallback)
│   ├── store/               # Zustand state stores
│   └── utils/               # Production API URL helper
├── public/                  # Static assets
├── package.json             # Root Next.js package config
├── requirements.txt         # Root Python backend dependencies
├── .python-version          # Python version (3.11)
├── .env.example             # Environment variables template
├── next.config.ts           # Next.js config with dev rewrites
└── vercel.json              # Vercel serverless function routing rules
```

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide Icons**
- **Monaco Editor** (via `@monaco-editor/react`)
- **Zustand**
- **Recharts**

### Backend
- **FastAPI**
- **Python 3.11**
- **SQLAlchemy**
- **PostgreSQL** / **SQLite** (automatic serverless fallback)
- **OpenAI API** (gpt-4o / gpt-3.5-turbo with local multi-agent fallback)

---

## Local Development Setup

### 1. Install Backend Dependencies & Start FastAPI

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn backend.main:app --reload --port 8000
```

FastAPI will start on `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

### 2. Install Frontend Dependencies & Start Next.js

```bash
# Install Node dependencies
npm install

# Start Next.js dev server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Next.js automatically proxies `/api/*` calls to `http://localhost:8000/api/*` in development.

---

## Single Vercel Project Deployment

1. **Push your repository to GitHub / GitLab**.
2. **Import the repository into Vercel** as a single project.
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (Project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add Environment Variables in Vercel Dashboard (see template below).
5. Click **Deploy**. Vercel will automatically build the Next.js frontend and mount `api/index.py` as a Python Serverless Function.

---

## Environment Variables (.env.example)

```env
# Database Connection (PostgreSQL in production, SQLite /tmp fallback if empty)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secret
SECRET_KEY=your_production_secret_key_here

# OpenAI API Key (Server-side only)
OPENAI_API_KEY=sk-proj-your-key-here

# Application URLs & CORS
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# GitHub OAuth Integration (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://your-app.vercel.app/api/v1/auth/github/callback

# Next.js Public API Base URL (Leave empty on Vercel for relative origin calls)
NEXT_PUBLIC_API_URL=
```

---

## Authentication & Features

1. **Single-Click Demo Account**:
   - **Email:** `demo@codeguardian.ai`
   - **Password:** `demo1234`
2. **Multi-Agent AI Code Analysis**:
   - Runs 7 concurrent AI agents (Bug Detection, Security, Performance, Clean Code, Documentation, Testing, Architecture).
   - Generates issue severity rankings, inline diff suggestions, and Mermaid architecture diagrams.
3. **Resilient Serverless Design**:
   - Features automatic HTTP polling status fallback when WebSockets are unavailable in serverless environments.
   - Graceful rule-engine fallback when `OPENAI_API_KEY` is omitted.
# quackkk
