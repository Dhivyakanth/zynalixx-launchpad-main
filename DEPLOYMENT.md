# Deployment Guide (Render)

This project can be deployed fully on Render using the root `render.yaml` file.

## Option A: One-click Blueprint (Recommended)

### 1. Push your repository
Commit and push your current project to GitHub/GitLab.

### 2. Create Blueprint on Render
1. Go to [render.com](https://render.com) → **New +** → **Blueprint**
2. Connect your repository
3. Render will detect `render.yaml` and create:
   - `zynalixx-backend` (Node Web Service)
   - `zynalixx-frontend` (Static Site)

### 3. Set environment variables
In Render dashboard, set the following values for `zynalixx-backend`:

| Variable | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://your-frontend.onrender.com` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Paste the full Firebase service-account JSON string |
| `RESEND_API_KEY` | Your Resend API key (`re_...`) |
| `EMAIL_FROM` | `Zynalixx <contact@yourdomain.com>` |
| `EMAIL_TO` | `zynalixx@gmail.com` |

Set this variable for `zynalixx-frontend`:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` |

### 4. Redeploy after env vars
After saving env vars, redeploy both services from Render dashboard.

### 5. Verify
- Backend health: `https://your-backend.onrender.com/health`
- Frontend opens and form submissions succeed

## Option B: Manual Services

If you do not want Blueprint, create two services manually:

1. Backend Web Service
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`

2. Frontend Static Site
   - Root Directory: project root
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Rewrite all routes to `/index.html` for SPA behavior
   - Set `VITE_API_URL` to your backend Render URL

## Important Security Notes

- Never commit service-account JSON files to git.
- Use only Render environment variables for secrets.
- Keep `ALLOWED_ORIGINS` limited to your frontend domain(s).

## Test Checklist

- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] `POST /api/contacts` with valid data returns 201 and creates Firestore document
- [ ] `POST /api/book-calls` with valid data returns 201 and creates Firestore document
- [ ] Email is received at `EMAIL_TO`
- [ ] If email fails, API still returns 201 (non-blocking)
- [ ] Rate limit triggers on repeated requests
- [ ] CORS blocks unauthorized origins
- [ ] Frontend form shows success/error state correctly
