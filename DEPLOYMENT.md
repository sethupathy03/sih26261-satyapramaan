# SatyaPramaan AI — Cloud & Production Deployment Guide
### Smart India Hackathon (SIH26261)

This guide walks you through deploying the SatyaPramaan AI document verification prototype to public cloud providers for free.

---

## Deployment Options Summary

| Method | Recommended For | Free Tier? | Setup Time |
| :--- | :--- | :--- | :--- |
| **Option 1: Render (1-Click Blueprint)** | Full-Stack (Backend API + Frontend UI) | Yes (100% Free) | ~3 minutes |
| **Option 2: Vercel + Render** | Split Architecture (Vercel CDN for UI + Render for Python) | Yes (100% Free) | ~4 minutes |
| **Option 3: Railway.app** | Instant GitHub auto-deploy with Nixpacks | Yes (Trial credit) | ~2 minutes |
| **Option 4: Cloudflare Tunnel** | Instant live public HTTPS link for hackathon judges | Yes (100% Free) | ~1 minute |
| **Option 5: Docker Container** | Any VPS (AWS EC2, DigitalOcean, GCP Cloud Run) | Yes | ~2 minutes |

---

## Option 1: Render Blueprint (Recommended — 1-Click Full Stack)

Render automatically detects the [`render.yaml`](./render.yaml) file in the repository root and sets up both the Python FastAPI backend and the React static UI.

### Steps:
1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for SIH26261 prototype"
   git remote add origin https://github.com/<your-username>/sih26261-satyapramaan.git
   git branch -M main
   git push -u origin main
   ```
2. **Log in to [Render.com](https://render.com).**
3. Click **New +** $\to$ **Blueprint**.
4. Select your GitHub repository.
5. Render reads `render.yaml` and provisions:
   - `satyapramaan-api` (FastAPI Web Service)
   - `satyapramaan-ui` (React Static Site with auto-configured API URL)
6. Click **Apply**.
7. Once built, Render will provide two live URLs:
   - Backend API: `https://satyapramaan-api.onrender.com/docs`
   - Frontend UI: `https://satyapramaan-ui.onrender.com`

---

## Option 2: Vercel (Frontend) + Render (Backend)

### Part A: Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python seed_data.py`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Click **Create Web Service**. Note your backend URL (e.g. `https://satyapramaan-api.onrender.com`).

### Part B: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New** $\to$ **Project**.
2. Select your repository.
3. Configure the project:
   - **Root Directory:** Click Edit and select `frontend`.
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://satyapramaan-api.onrender.com` (your Render backend URL from Part A).
5. Click **Deploy**. Vercel will output a live URL (e.g., `https://satyapramaan.vercel.app`).

---

## Option 3: Railway.app (1-Click Auto-Deploy)

Railway utilizes [`railway.json`](./railway.json) to automatically detect Python and Node.

1. Go to [Railway.app](https://railway.app).
2. Click **New Project** $\to$ **Deploy from GitHub repo**.
3. Select this repository.
4. Railway builds the backend and seeds the database automatically.
5. In **Settings** $\to$ **Networking**, click **Generate Domain** to get a public URL.

---

## Option 4: Instant Public HTTPS Link (Live Hackathon Judging)

If you are running the system locally and need an immediate, publicly shareable HTTPS link to let hackathon judges test from their own mobile phones or laptops:

### Using Cloudflare Quick Tunnels (Zero install / Zero signup)
Run in PowerShell:
```powershell
# Download standalone cloudflared binary (if not already installed)
winget install --id Cloudflare.cloudflared

# Expose the local React frontend (which proxies to the backend)
cloudflared tunnel --url http://localhost:5173
```
Cloudflare will print an instant public URL:
```
https://random-subdomain.trycloudflare.com
```
Anyone in the world can now open this link and test document verification live!

---

## Option 5: Containerized Docker Deployment

For self-hosting on AWS EC2, DigitalOcean Droplet, or Google Cloud Run:

```bash
# Clone repository
git clone https://github.com/<your-username>/sih26261-satyapramaan.git
cd sih26261-satyapramaan

# Build and run with Docker Compose
docker compose up -d --build
```
Access the application at `http://<your-server-ip>:8000`.

---

## Pre-Loaded Verification Test Scenarios in Production

When deployed, the seeder automatically initializes 3 benchmark applications for evaluators:
1. **Aarav Sharma:** Clean Anna University B.Tech Marksheet $\to$ **Score: 98.86/100 (LOW RISK, Auto-Approved)**
2. **Rohan Varma:** Delhi University Provisional Certificate $\to$ **Score: 78.50/100 (MEDIUM RISK, Manual Review Required)**
3. **Vikram Malhotra:** Forged IIT Bombay Marksheet with Photoshop metadata and spliced CGPA $\to$ **Score: 38.00/100 (HIGH RISK, Tamper Detected & Rejected)**
