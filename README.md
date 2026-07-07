# CodeGuardian AI - Enterprise AI Code Review Assistant

CodeGuardian AI is a production-ready, enterprise-grade AI Code Review Assistant similar to GitHub Copilot Code Review, CodeRabbit, and SonarQube. It features a premium dark theme, Glassmorphism UI, real-time WebSocket analysis updates, and Monaco Editor integration.

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
- **SQLAlchemy**
- **PostgreSQL** / **SQLite** (automatic fallback)
- **Redis**
- **WebSockets**

---

## Setup & Running

You can run the entire application stack using **Docker Compose** or run the frontend and backend services **locally**.

### Option 1: Docker Compose (Recommended)
Make sure you have Docker and Docker Compose installed, then run:
```bash
docker-compose up --build
```
This launches PostgreSQL, Redis, FastAPI backend (port 8000), and Next.js frontend (port 3000).

### Option 2: Local Development

#### Step 1: Run the Backend
1. Create a Python virtual environment and install packages:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
2. Start the FastAPI development server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *Note: On first startup, the database is automatically created as a local SQLite file (if PostgreSQL is not running) and seeded with demo projects and code reviews.*

#### Step 2: Run the Frontend
1. Move to the frontend folder and run the development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Interactive Features

### 1. Authenticate / Login
- Login with the pre-seeded account:
  - **Email:** `demo@codeguardian.ai`
  - **Password:** `demo1234`
- Or use the **Single-Click Demo Login** or OAuth mock options.

### 2. Live WebSocket Code Review
1. Navigate to **New Review**.
2. Select a project workspace, provide a title, and select code parameters.
3. Paste a block of code (containing credentials or vulnerable SQL lines to test rule audits) and click **Start Review**.
4. You will see a real-time progress bar tracking the compilation pipeline (*Parsing files -> Static analysis -> AI reasoning -> Completed*) pushing updates over WebSockets.
5. Click on line-level issues on the right panel to automatically scroll Monaco Editor to the target line.
6. Trigger the floating **AI Assistant** chat to get code fixes or explain specific lines.
