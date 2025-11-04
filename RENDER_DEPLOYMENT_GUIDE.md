# 🚀 Complete Render Deployment Guide - PeerConnect

**Last Updated:** November 5, 2025  
**Repository:** Monu2310/Peer-Connect-V1  
**Branch:** master

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Deploy Backend (Node.js API)](#part-1-deploy-backend-nodejs-api)
3. [Part 2: Deploy Frontend (React App)](#part-2-deploy-frontend-react-app)
4. [Part 3: Configure MongoDB Atlas](#part-3-configure-mongodb-atlas)
5. [Part 4: Environment Variables](#part-4-environment-variables)
6. [Part 5: Verify Deployment](#part-5-verify-deployment)
7. [Part 6: Redis Setup (Optional)](#part-6-redis-setup-optional)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### ✅ What You Need Before Starting

1. **GitHub Account** with your repository pushed
   - Repository: `https://github.com/Monu2310/Peer-Connect-V1`
   - Branch: `master`
   - Status: All changes committed and pushed

2. **Render Account** (Free)
   - Sign up at: https://render.com
   - Connect your GitHub account

3. **MongoDB Atlas Account** (Free)
   - Sign up at: https://cloud.mongodb.com
   - Cluster already created with connection string

---

## Part 1: Deploy Backend (Node.js API)

### Step 1: Create Web Service on Render

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com
   - Click the blue **"New +"** button (top right)
   - Select **"Web Service"**

2. **Connect Your Repository**
   - You'll see a list of your GitHub repositories
   - Find: **"Peer-Connect-V1"** (owned by Monu2310)
   - Click **"Connect"** button next to it

### Step 2: Configure Service Settings

Fill in these **EXACT** values:

| Field | Value | Why |
|-------|-------|-----|
| **Name** | `peerconnect-backend` | Can be anything, but this is clear |
| **Region** | `Ohio (US East)` | Closest to most users |
| **Branch** | `master` | Your default branch |
| **Root Directory** | `server` | ⚠️ CRITICAL - where server code lives |
| **Runtime** | `Node` | Auto-detected, but verify |
| **Build Command** | `npm install` | Installs dependencies |
| **Start Command** | `npm start` | ⚠️ Use `npm start` NOT `npm run dev` - Runs `node server.js` |

**Important:** On Render, use `npm start` (production). Locally, you use `npm run dev` (development with nodemon).

### Step 3: Choose Instance Type

**For Testing/Development:**
- Select: **"Free"** 
- Cost: $0/month
- ⚠️ Sleeps after 15 min of inactivity
- First request after sleep = 30-60 seconds

**For Production:**
- Select: **"Starter"**
- Cost: $7/month
- ✅ Always on, no sleeping
- Better performance

### Step 4: Add Environment Variables

Click **"Advanced"** (below Instance Type)

Click **"Add Environment Variable"** and add these **ONE BY ONE**:

#### Variable 1: NODE_ENV
```
Key:   NODE_ENV
Value: production
```

#### Variable 2: MONGODB_URI
```
Key:   MONGODB_URI
Value: mongodb+srv://monu:mehta2310@cluster1.ofyyuwa.mongodb.net/peerconnect?retryWrites=true&w=majority&appName=Cluster1
```
⚠️ **IMPORTANT:** Use YOUR actual MongoDB connection string if different!

#### Variable 3: JWT_SECRET
```
Key:   JWT_SECRET
Value: [GENERATE A NEW ONE - SEE BELOW]
```

**To Generate JWT_SECRET:**
```powershell
# Run this in PowerShell:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output (long random string) and paste as the value.

#### Variable 4: CLIENT_URL (Add Later)
```
Key:   CLIENT_URL
Value: [LEAVE EMPTY FOR NOW]
```
We'll add this after deploying the frontend.

#### Variable 5: REDIS_URL (Optional - See Part 6)
```
Key:   REDIS_URL
Value: [LEAVE EMPTY FOR NOW]
```
**Optional:** Add this if you want Redis caching. See [Part 6: Redis Setup](#part-6-redis-setup-optional) for:
- **Free Option:** Upstash Redis (10K commands/day free)
- **Paid Option:** Render Redis ($7/month)
- **No Redis:** App works with in-memory cache fallback (default)

If you skip Redis, your app will automatically use in-memory caching via `node-cache`.

#### Variable 6: RENDER (Optional but Helpful)
```
Key:   RENDER
Value: true
```
This tells your server it's running on Render.

### Step 5: Create the Service

1. Scroll down and click **"Create Web Service"** (blue button)
2. Wait for deployment (5-10 minutes first time)
3. You'll see logs scrolling - watch for:
   ```
   ✓ MongoDB connected successfully
   Server running on port XXXX
   ```

### Step 6: Note Your Backend URL

Once deployed, you'll see a URL at the top:
```
https://peerconnect-backend.onrender.com
```

**⚠️ SAVE THIS URL - YOU'LL NEED IT FOR FRONTEND!**

### Step 7: Test Backend

Click on the URL and add `/api/health`:
```
https://peerconnect-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T...",
  "uptime": 123.45
}
```

✅ **Backend deployment complete!**

---

## Part 2: Deploy Frontend (React App)

### Step 1: Create Static Site on Render

1. **Go to Render Dashboard**
   - Click **"New +"** again
   - Select **"Static Site"** (not Web Service!)

2. **Connect Repository**
   - Find: **"Peer-Connect-V1"**
   - Click **"Connect"**

### Step 2: Configure Static Site Settings

Fill in these **EXACT** values:

| Field | Value | Why |
|-------|-------|-----|
| **Name** | `peerconnect-frontend` | Or use `peer-connect-v1-cl` to match existing |
| **Region** | `Ohio (US East)` | Same as backend for speed |
| **Branch** | `master` | Your default branch |
| **Root Directory** | `client` | ⚠️ CRITICAL - where React app lives |
| **Build Command** | `npm install && npm run build` | Installs deps and builds production |
| **Publish Directory** | `build` | Where React outputs compiled files |

### Step 3: Add Environment Variable

Click **"Advanced"**

Click **"Add Environment Variable"**:

```
Key:   REACT_APP_API_URL
Value: https://peerconnect-backend.onrender.com
```

⚠️ **Replace with YOUR actual backend URL from Part 1, Step 6!**

### Step 4: Create the Static Site

1. Click **"Create Static Site"** (blue button)
2. Wait for build (3-5 minutes)
3. Watch logs for:
   ```
   Compiled successfully!
   File sizes after gzip:
     432.5 kB  build/static/js/main.xxxxx.js
   ```

### Step 5: Note Your Frontend URL

Once deployed, you'll see:
```
https://peerconnect-frontend.onrender.com
```

**⚠️ SAVE THIS URL!**

### Step 6: Update Backend with Frontend URL

Now go back to **Backend Service**:

1. Go to Render Dashboard
2. Click on **"peerconnect-backend"** service
3. Click **"Environment"** (left sidebar)
4. Find `CLIENT_URL` variable
5. Edit it and set value to:
   ```
   https://peerconnect-frontend.onrender.com
   ```
6. Click **"Save Changes"**
7. Render will automatically redeploy backend (2-3 minutes)

✅ **Frontend deployment complete!**

---

## Part 3: Configure MongoDB Atlas

### ⚠️ CRITICAL: Allow Render to Access Database

Without this step, your backend CANNOT connect to MongoDB!

### Step 1: Login to MongoDB Atlas

1. Go to: https://cloud.mongodb.com
2. Login with your credentials
3. Select your project (the one with Cluster1)

### Step 2: Configure Network Access

1. Click **"Network Access"** in left sidebar (under Security)
2. Click **"IP Access List"** tab
3. Click green **"Add IP Address"** button

### Step 3: Allow All IPs (Easiest)

In the popup:
1. Click **"Allow Access from Anywhere"**
2. IP Address will auto-fill: `0.0.0.0/0`
3. Comment: `Render.com deployment`
4. Click **"Confirm"**

⚠️ **Note:** This allows connections from any IP. More secure option is to add specific Render IPs, but that's more complex.

### Step 4: Verify Database User

1. Click **"Database Access"** (left sidebar, under Security)
2. Verify user `monu` exists with password `mehta2310`
3. User should have "Read and write to any database" role

✅ **MongoDB Atlas configured!**

---

## Part 4: Environment Variables

### Complete Reference

#### Backend Environment Variables (on Render)

| Variable | Value | Required? | Notes |
|----------|-------|-----------|-------|
| `NODE_ENV` | `production` | ✅ Yes | Sets environment to production |
| `MONGODB_URI` | `mongodb+srv://monu:mehta2310@cluster1.ofyyuwa.mongodb.net/peerconnect?retryWrites=true&w=majority&appName=Cluster1` | ✅ Yes | Your MongoDB connection string |
| `JWT_SECRET` | `[64-char random hex string]` | ✅ Yes | Generate with crypto (see Part 1) |
| `CLIENT_URL` | `https://peerconnect-frontend.onrender.com` | ✅ Yes | Your frontend URL for CORS |
| `RENDER` | `true` | ℹ️ Optional | Auto-detects Render environment |
| `PORT` | **DO NOT SET** | ⚠️ Never set | Render auto-assigns this |
| `REDIS_URL` | `redis://...` | ℹ️ Optional | For caching (see Part 6). App works without it! |

#### Frontend Environment Variables (on Render)

| Variable | Value | Required? |
|----------|-------|-----------|
| `REACT_APP_API_URL` | `https://peerconnect-backend.onrender.com` | ✅ Yes |

### Local Development (.env files)

**Backend** (`server/.env`):
```env
NODE_ENV=development
PORT=5111
MONGODB_URI=mongodb+srv://monu:mehta2310@cluster1.ofyyuwa.mongodb.net/peerconnect?retryWrites=true&w=majority&appName=Cluster1
JWT_SECRET=local-dev-secret-change-in-production
CLIENT_URL=http://localhost:3000
```

**To run locally:**
```powershell
cd server
npm run dev   # Uses nodemon for auto-restart on file changes
```

**Frontend** (`client/.env`):
```env
REACT_APP_API_URL=http://localhost:5111
```

**To run locally:**
```powershell
cd client
npm start   # Starts React development server
```

⚠️ **NEVER commit .env files to Git!** They're already in `.gitignore`.

---

### Development vs Production Commands

| Environment | Backend Command | Frontend Command | Auto-Restart? |
|-------------|----------------|------------------|---------------|
| **Local Dev** | `npm run dev` | `npm start` | ✅ Yes (nodemon) |
| **Production (Render)** | `npm start` | `npm run build` | ❌ No |

---

## Part 5: Verify Deployment

### Test 1: Backend Health Check

Visit:
```
https://peerconnect-backend.onrender.com/api/health
```

✅ **Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T12:34:56.789Z",
  "uptime": 45.123
}
```

❌ **If you get an error:**
- Check MongoDB Network Access (Part 3)
- Check backend logs in Render Dashboard
- Verify MONGODB_URI environment variable

### Test 2: Frontend Loading

Visit:
```
https://peerconnect-frontend.onrender.com
```

✅ **Expected:** Landing page loads with PeerConnect branding

❌ **If blank page:**
- Open browser console (F12)
- Check for errors
- Verify REACT_APP_API_URL is set correctly

### Test 3: CORS Check

1. Open frontend in browser
2. Open Developer Console (F12)
3. Go to Console tab
4. Look for: `Using API URL: https://peerconnect-backend.onrender.com`
5. Try to register a new user
6. Check Network tab for API calls

✅ **Expected:** No CORS errors, API calls succeed

❌ **If CORS errors:**
- Verify `CLIENT_URL` in backend matches frontend URL exactly
- Check backend CORS configuration includes your frontend domain
- Manually redeploy backend

### Test 4: User Registration

1. Click "Get Started" or "Register"
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test1234!`
3. Submit form

✅ **Expected:** 
- Registration succeeds
- Redirects to dashboard
- User is logged in

❌ **If fails:**
- Check browser console for errors
- Check backend logs
- Verify MongoDB connection

### Test 5: Real-Time Features

1. Login with your account
2. Go to Messages
3. Send a message
4. Open another browser/incognito window
5. Login as different user
6. Check if message appears

✅ **Expected:** Real-time updates via Socket.io

❌ **If no real-time:**
- Check backend logs for Socket.io connections
- Verify WebSocket isn't blocked
- Check browser console for connection errors

---

## Part 6: Redis Setup (Optional)

### Option A: No Redis (Current Setup - FREE)

✅ **Your app already works without Redis!**

- Uses in-memory cache (`node-cache`) as fallback
- Perfect for testing and low traffic
- No configuration needed
- Check backend logs for: `⚠ Redis unavailable, using in-memory cache`

**Limitations:**
- Cache clears on server restart (free tier restarts after 15 min inactivity)
- Can't share cache across multiple instances

### Option B: Upstash Redis (FREE TIER)

Best free option for production caching.

#### Step 1: Create Upstash Account

1. Go to: https://upstash.com
2. Sign up with GitHub
3. Click "Create Database"

#### Step 2: Configure Database

1. Name: `peerconnect-cache`
2. Type: **Regional**
3. Region: **US-East-1** (same as Render backend)
4. Click "Create"

#### Step 3: Get Connection URL

1. Click on your database
2. Scroll to "REST API" section
3. Copy the **"Redis Connect"** URL
4. Format: `redis://default:password@endpoint.upstash.io:6379`

#### Step 4: Add to Render Backend

1. Go to Render Dashboard → peerconnect-backend
2. Click "Environment"
3. Add new variable:
   ```
   Key:   REDIS_URL
   Value: redis://default:AbC123...@us1-xxxx.upstash.io:6379
   ```
4. Save (backend will auto-redeploy)

#### Step 5: Verify Redis Connection

Check backend logs for:
```
✓ Redis connected successfully
✓ Redis client ready
```

**Upstash Free Tier:**
- 10,000 commands/day
- 256 MB storage
- Perfect for testing!

### Option C: Render Redis ($7/month)

For production with higher traffic.

1. Render Dashboard → "New +" → "Redis"
2. Name: `peerconnect-redis`
3. Plan: Starter ($7/month)
4. Region: Same as backend
5. Click "Create Redis"
6. Copy "Internal Redis URL": `redis://red-xxxxx:6379`
7. Add to backend environment as `REDIS_URL`

---

## Troubleshooting

### ❌ Backend Deployment Failed

**Error:** Build fails with "Cannot find module 'express'"

**Solution:**
- Verify "Root Directory" is set to `server`
- Check "Build Command" is `npm install`
- Ensure `package.json` exists in `server/` directory

---

### ❌ MongoDB Connection Timeout

**Error in logs:**
```
MongooseServerSelectionError: connect ETIMEDOUT
```

**Solutions:**

1. **Check MongoDB Network Access:**
   - MongoDB Atlas → Network Access
   - Verify `0.0.0.0/0` is in IP Access List
   - May take 1-2 minutes to apply

2. **Verify Connection String:**
   - Check `MONGODB_URI` has no typos
   - Ensure username/password are correct
   - Verify database name is `peerconnect`

3. **Test Connection Locally:**
   ```powershell
   cd server
   node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(err => console.error('Error:', err));"
   ```

---

### ❌ Frontend Shows Blank Page

**Open Browser Console (F12):**

**Error:** `Uncaught ReferenceError: process is not defined`

**Solution:**
- This is a build issue
- Clear Render build cache:
  - Dashboard → Frontend Service → Settings
  - Scroll to "Build & Deploy"
  - Click "Clear Build Cache & Deploy"

**Error:** `Failed to fetch` or `Network Error`

**Solution:**
- `REACT_APP_API_URL` is wrong or missing
- Go to Render → Frontend → Environment
- Verify value is `https://peerconnect-backend.onrender.com` (your actual backend URL)
- Redeploy

---

### ❌ CORS Errors in Browser Console

**Error:**
```
Access to XMLHttpRequest at 'https://backend...' from origin 'https://frontend...' has been blocked by CORS policy
```

**Solutions:**

1. **Check CLIENT_URL in Backend:**
   - Render → Backend Service → Environment
   - `CLIENT_URL` must EXACTLY match your frontend URL
   - Include `https://`, no trailing slash
   - Example: `https://peerconnect-frontend.onrender.com`

2. **Verify CORS Origins in Code:**
   - Your `server/server.js` has these origins:
     ```javascript
     origin: [
       'http://localhost:3111',
       'http://localhost:5111',
       'https://peer-connect-v1-cl.onrender.com',
       'https://peerconnect-v1.onrender.com',
       'https://peer-connect-1-0.onrender.com'
     ]
     ```
   - If your frontend URL is different, you need to add it
   - Commit and push changes

3. **Force Redeploy Backend:**
   - After changing environment variables
   - Dashboard → Backend → Manual Deploy → "Deploy latest commit"

---

### ❌ Socket.io Connection Failed

**Error in console:**
```
WebSocket connection to 'wss://...' failed
```

**Solutions:**

1. **Verify Backend URL:**
   - Check `REACT_APP_API_URL` doesn't have trailing slash
   - Should be: `https://peerconnect-backend.onrender.com`
   - NOT: `https://peerconnect-backend.onrender.com/`

2. **Check Backend Port:**
   - Ensure backend is NOT setting PORT manually
   - Remove PORT from environment variables
   - Render sets this automatically

3. **Verify Server Code:**
   - `server/server.js` should have:
     ```javascript
     const PORT = process.env.PORT || 5111;
     server.listen(PORT, '0.0.0.0', () => {
       console.log(`Server running on port ${PORT}`);
     });
     ```

---

### ❌ Login/Register Not Working

**Check these in order:**

1. **MongoDB Connected?**
   - Backend logs should show: `✓ MongoDB connected successfully`
   - If not, see MongoDB Connection Timeout section

2. **JWT_SECRET Set?**
   - Backend logs will show error if missing
   - Generate new one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Add to environment variables

3. **API Calls Reaching Backend?**
   - Browser → F12 → Network tab
   - Try to register
   - See if POST request is made
   - Check response status and body

4. **Check Backend Logs:**
   - Render Dashboard → Backend Service → Logs
   - Look for error messages during registration

---

### ❌ Free Tier Service Sleeping

**Symptom:** First request after inactivity takes 30-60 seconds

**This is NORMAL on free tier!**

**Solutions:**

1. **Upgrade to Starter ($7/month):**
   - Dashboard → Service → Settings
   - Change Instance Type to "Starter"
   - Save

2. **Accept for Development:**
   - Free tier is perfect for testing
   - Warn users about initial delay
   - Subsequent requests are fast

3. **DO NOT use ping services:**
   - Against Render Terms of Service
   - Account can be suspended

---

### ❌ Build Takes Too Long

**Error:** Build exceeds 15 minute limit

**Solutions:**

1. **Clear Build Cache:**
   - Dashboard → Service → Settings
   - "Clear Build Cache & Deploy"

2. **Check Dependencies:**
   - Remove unused packages from `package.json`
   - Run `npm prune` locally

3. **Verify Build Command:**
   - Use `npm install` (faster than `npm ci`)

---

## 🎉 Deployment Checklist

### Before Deployment
- [x] Code pushed to GitHub (master branch)
- [x] `.env` files NOT committed
- [x] MongoDB Atlas cluster running
- [x] Render account created and GitHub connected

### Backend Deployment
- [ ] Web Service created
- [ ] Root Directory: `server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI` (your connection string)
  - [ ] `JWT_SECRET` (64-char random hex)
  - [ ] `CLIENT_URL` (frontend URL)
- [ ] Service deployed successfully
- [ ] Health check passes: `/api/health`
- [ ] No errors in logs

### Frontend Deployment
- [ ] Static Site created
- [ ] Root Directory: `client`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `build`
- [ ] Environment variable set:
  - [ ] `REACT_APP_API_URL` (backend URL)
- [ ] Site deployed successfully
- [ ] Page loads in browser
- [ ] No console errors

### MongoDB Configuration
- [ ] Network Access configured
- [ ] IP `0.0.0.0/0` in Access List
- [ ] Database user verified

### Post-Deployment
- [ ] Updated `CLIENT_URL` in backend
- [ ] Backend redeployed
- [ ] Tested user registration
- [ ] Tested user login
- [ ] Tested creating activity
- [ ] Tested real-time messaging
- [ ] No CORS errors in browser
- [ ] No errors in backend logs

### Optional
- [ ] Redis configured (Upstash or Render)
- [ ] Custom domain added
- [ ] Monitoring set up

---

## 📊 Cost Summary

### Free Tier (Testing)
```
Backend:   $0 (with sleep after 15 min)
Frontend:  $0 (always on)
Redis:     $0 (in-memory fallback or Upstash free)
MongoDB:   $0 (Atlas 512MB free tier)
Total:     $0/month
```

### Production Tier
```
Backend:   $7 (Starter - always on)
Frontend:  $0 (static site free)
Redis:     $0 (Upstash) or $7 (Render Redis)
MongoDB:   $0 (Atlas free) or $57 (M10 Dedicated)
Total:     $7-$71/month
```

---

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Upstash Docs:** https://docs.upstash.com

---

## 🚀 Next Steps After Deployment

1. **Test All Features**
   - User registration/login
   - Activity creation
   - Messaging
   - Friend requests

2. **Monitor Logs**
   - Check daily for errors
   - Watch for performance issues

3. **Set Up Error Tracking** (Optional)
   - Sentry for error monitoring
   - LogRocket for session replay

4. **Plan for Scale**
   - Upgrade to Starter when needed
   - Add Redis for better caching
   - Consider MongoDB Atlas M10 for production

---

**✅ Your PeerConnect app is now live!**

**Frontend:** https://peerconnect-frontend.onrender.com  
**Backend API:** https://peerconnect-backend.onrender.com

Share with users and start building your community! 🎊

---

**Last Updated:** November 5, 2025  
**Maintained by:** Monu2310  
**Guide Version:** 1.0
