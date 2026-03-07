# 🏋️ LOYD'S FITNESS GYM — Deployment Guide
### Supabase (Database) + Vercel (Backend + Frontend) — FREE PLAN

---

## 📁 Final Folder Structure

```
gym-deploy/
├── backend/                   ← Deploy to Vercel (Python API)
│   ├── app.py                 ← Updated Flask app (PostgreSQL)
│   ├── requirements.txt
│   └── vercel.json
│
├── frontend/                  ← Deploy to Vercel (React app)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       ├── api/
│       │   └── config.js      ← Central API URL config
│       ├── components/
│       │   └── Layout.js
│       └── pages/
│           ├── Login.js
│           ├── Dashboard.js
│           ├── Members.js
│           ├── Attendance.js
│           ├── Walkins.js
│           ├── Alerts.js
│           └── Reports.js
│
└── supabase_schema.sql        ← Run this in Supabase SQL Editor
```

---

## STEP 1 — Set Up Supabase (Database)

1. Go to **https://supabase.com** → Sign up free
2. Click **"New Project"**
   - Name: `loyds-gym`
   - Set a **strong database password** (save it!)
   - Region: pick closest to Philippines (Singapore)
3. Wait for project to provision (~2 minutes)
4. Go to **SQL Editor** (left sidebar)
5. Click **"New Query"**
6. Paste the entire contents of `supabase_schema.sql`
7. Click **"Run"** ✅

### Get your connection string:
- Go to **Settings → Database**
- Find **"Connection string"** → choose **URI** tab
- Copy the string that looks like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
  ```
- Replace `[YOUR-PASSWORD]` with the password you set
- **Save this — you need it in Step 2**

---

## STEP 2 — Deploy Backend to Vercel

1. Push the `backend/` folder to a **GitHub repo**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend"
   git remote add origin https://github.com/YOUR_USERNAME/gym-backend.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** → Sign up free with GitHub

3. Click **"Add New Project"** → Import your `gym-backend` repo

4. Vercel will auto-detect Python. Before deploying, add **Environment Variable**:
   - **Key:** `DATABASE_URL`
   - **Value:** the PostgreSQL URI you copied from Supabase

5. Click **Deploy** ✅

6. Copy your backend URL — it looks like:
   ```
   https://gym-backend-xxxxxxxxx.vercel.app
   ```

---

## STEP 3 — Deploy Frontend to Vercel

1. Push the `frontend/` folder to a **second GitHub repo**:
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial frontend"
   git remote add origin https://github.com/YOUR_USERNAME/gym-frontend.git
   git push -u origin main
   ```

2. In Vercel → **"Add New Project"** → Import `gym-frontend` repo

3. Framework Preset: **Create React App** (Vercel detects this)

4. Add **Environment Variable**:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** your backend URL from Step 2
     ```
     https://gym-backend-xxxxxxxxx.vercel.app
     ```

5. Click **Deploy** ✅

6. Your gym app is live at:
   ```
   https://gym-frontend-xxxxxxxxx.vercel.app
   ```

---

## STEP 4 — Test All Features

Open your frontend URL and test:

| Feature | How to test |
|---|---|
| ✅ Login | Username: `admin` / Password: `admin123` |
| ✅ Register | Click "Create an Account", make a new admin |
| ✅ Dashboard | Should show stats (all zeros initially) |
| ✅ Add Member | Members → + Add Member |
| ✅ Edit Member | Members → Edit button |
| ✅ Delete Member | Members → Del button |
| ✅ CSV Export | Members → ⬇ Export CSV |
| ✅ Attendance Time-In | Attendance → search a member → Time In |
| ✅ Attendance Time-Out | Attendance → click "Out" on member inside |
| ✅ Walk-in Record | Walk-ins → fill form → Record Walk-in |
| ✅ Alerts | Alerts → check expiring/expired lists |
| ✅ Excel Report | Reports → select month → Download |

---

## ⚠️ Free Plan Limits — What to Know

| Service | Free Limit | Impact |
|---|---|---|
| Supabase DB | 500MB storage | Holds ~millions of records — no issue |
| Supabase | Pauses after 7 days inactivity | Visit the app weekly to keep it awake |
| Vercel Functions | 100GB bandwidth/mo | More than enough for a gym |
| Vercel | Serverless cold starts | First request after idle may take ~2s |

### ⚡ Fix Supabase pausing (free plan):
Set up a free uptime cron at **https://cron-job.org** to ping your backend URL every 5 days:
- URL to ping: `https://gym-backend-xxxxxxxxx.vercel.app/stats`
- Schedule: every 5 days

---

## 🔒 Default Login Credentials

| Username | Password |
|---|---|
| admin | admin123 |

**Change this immediately after first login** using the Register page!

---

## 🆘 Troubleshooting

**"Could not load dashboard data"**
→ Backend isn't running or DATABASE_URL is wrong. Check Vercel → Functions logs.

**CORS errors in browser console**
→ Make sure REACT_APP_API_URL has NO trailing slash:
  ✅ `https://gym-backend.vercel.app`
  ❌ `https://gym-backend.vercel.app/`

**Supabase connection refused**
→ Check Settings → Database → make sure your IP isn't blocked. On free plan, set to "Allow all IPs" (0.0.0.0/0) under Network restrictions.

**Excel report fails**
→ `openpyxl` is in requirements.txt — Vercel installs it automatically.
