# Deployment Guide

## Backend — Render

### 1. Prepare repository
Push the `backend/` folder to a separate Git repo (or use a monorepo with root directory set to `backend`).

### 2. Create Render Web Service
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your Git repo
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`

### 3. Environment Variables (Render Dashboard → Environment)
| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `ALLOWED_ORIGINS` | `https://your-project.web.app,https://your-project.firebaseapp.com` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Paste the **entire JSON** content of your Firebase service account key |
| `RESEND_API_KEY` | Your Resend API key (`re_...`) |
| `EMAIL_FROM` | `Zynalixx <contact@yourdomain.com>` |
| `EMAIL_TO` | `zynalixx@gmail.com` |

> ⚠️ **Never commit** `serviceAccountKey.json` to Git. Use the `FIREBASE_SERVICE_ACCOUNT_KEY` env var on Render.

### 4. Deploy
Render auto-deploys on push. Verify: `https://your-backend.onrender.com/health`

---

## Frontend — Firebase Hosting

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase Hosting
```bash
firebase init hosting
# Select your project
# Public directory: dist
# Single-page app: Yes
# Auto builds: No
```

### 3. Set environment variable
Create `.env.production` in project root:
```
VITE_API_URL=https://your-backend.onrender.com
```

### 4. Build & Deploy
```bash
npm run build
firebase deploy --only hosting
```

### 5. Update CORS
Add your Firebase Hosting URL to `ALLOWED_ORIGINS` on Render.

---

## Test Checklist

- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] `POST /api/contacts` with valid data → 201 + Firestore document created
- [ ] `POST /api/contacts` with missing fields → 400 + error messages
- [ ] Email received at `EMAIL_TO` address after submission
- [ ] If email fails, API still returns 201 (non-blocking)
- [ ] Rate limiting works (6th request within 15 min → 429)
- [ ] CORS blocks requests from unauthorized origins
- [ ] Frontend form shows success/error messages correctly
- [ ] No secrets in Git history
