# Visual 🍀 Hobby Market — Powered by Qloo Taste AI™

A cozy full-stack web application and CLI built for the **Qloo Hackathon** that transforms passive visual inspiration (1–4 screenshots, Pinterest boards, outfit/room photos) into active lifestyle hobbies and cross-domain cultural recommendations powered by Qloo (`https://hackathon.api.qloo.com`).

---

## ✨ Key Features

- **🧺 Clothesline Visual Scrapbook (`01. Your Clothesline Scrapbook`)**: Drag & drop 1 to 4 images onto a cozy clothesline with wooden clothespins. Extracts dominant RGB/Hex **Color DNA Swatches** and visual aesthetic tags (`botanical`, `anime`, `kawaii pop`, `y2k retro`, `analog photography`, `lo-fi jazz`, `cyberpunk`, `dark academia`, `indie sleaze`, plus custom user tags).
- **🍀 Progressive Cozy Reveal**: Starts with a clean, focused scrapbook card and progressively unlocks:
  - **`02. Your Cozy Vibe Check`**: Aesthetic persona archetype, personalized summary, and one-click **"📋 Copy My Market Card Summary"** to share.
  - **`03. Your Qloo Mixtape & Top Picks`**: Cross-domain cultural picks (`🎵 Music`, `🎬 Movies`, `📖 Books`, `📍 Places`) with category filter pills.
  - **`04. Unlocked Hobbies & Trinkets Powered by Qloo`**: Actionable hobby cards with match scores, **Starter Kits**, and **Qloo Cultural Picks**.
- **💌 Market Guestbook (`02. Market Guestbook`)**: Community board where users pin the hobbies they are starting and give likes (`♥`) to fellow explorers.
- **🔍 Discreet Hackathon Judge Mode**: Collapsible bottom inspector showing the live two-step Qloo API request log (`/v2/tags` + `/search` → `/v2/insights`).

---

## 🏗️ Architecture (Mermaid Diagram)

```mermaid
graph TD
    A["User"] -->|"1. Hangs 1-4 photos on Clothesline or uses CLI"| B["Next.js 14 Frontend / Python CLI"]
    B -->|"2. Extracts Color DNA (Hex Swatches) + Aesthetic Tags"| B
    B -->|"3. POST /api/recommendations"| C["FastAPI Backend (backend/main.py)"]
    
    subgraph QlooService ["backend/services/qloo.py"]
        C -->|"4a. Resolves Tags to URNs & Entity IDs"| D1["Qloo API: GET /v2/tags & /search"]
        D1 -->|"Returns tag_urns & entity_ids"| C
        C -->|"4b. Queries X-Api-Key + filter.type"| D2["Qloo API: GET /v2/insights"]
        D2 -->|"Returns cross-domain Music, Movies, Books & Places"| C
        C -->|"5. Synthesizes Active Hobbies + Starter Kits + Qloo Picks"| C
    end

    C -->|"6. Structured JSON (Hobbies + Qloo Mixtape + Logs)"| B
    B -->|"7. Unlocks Sections 02, 03 & 04"| A
    A -->|"8. Pins hobby note (POST /api/feed)"| E["Market Guestbook (Community Board)"]
```

---

## 🚀 Quick Start

### 1. Environment Variables (`.env`)
Copy `.env.example` to `.env` in the root folder (`qloo-y2k-app/.env` is protected by `.gitignore`) and add your Qloo Hackathon API Key:

```env
QLOO_API_KEY=your_qloo_hackathon_api_key_here
QLOO_BASE_URL=https://hackathon.api.qloo.com
FRONTEND_URL=http://localhost:3000
```

### 2. Start Backend (FastAPI + CLI)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Run FastAPI server on http://localhost:8000
uvicorn main:app --reload --port 8000

# Or test via the Terminal CLI:
python cli.py --tags "botanical,anime,y2k retro"
```

### 3. Start Frontend (Next.js 14 + Tailwind CSS)
```powershell
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
