# 🪵 LumberCRM — Deployment Guide

Follow these steps to get your app live on your phone in ~15 minutes.

---

## Step 1 — Create a GitHub account
1. Go to **github.com**
2. Click **Sign up** and create a free account
3. Verify your email

---

## Step 2 — Upload your code to GitHub
1. Once logged in, click the **+** icon (top right) → **New repository**
2. Name it: `lumber-crm`
3. Set it to **Private**
4. Click **Create repository**
5. On the next page, click **uploading an existing file**
6. Drag and drop ALL the files from this folder into the window
   - Make sure to keep the folder structure: `src/` and `public/` folders
7. Click **Commit changes**

---

## Step 3 — Create a Vercel account
1. Go to **vercel.com**
2. Click **Sign Up** → choose **Continue with GitHub**
3. Authorize Vercel to access your GitHub

---

## Step 4 — Deploy your app
1. In Vercel, click **Add New Project**
2. Find your `lumber-crm` repository and click **Import**
3. Vercel will auto-detect it as a React app
4. Click **Deploy** — wait about 2 minutes
5. Vercel gives you a live URL like: `https://lumber-crm-xyz.vercel.app`

---

## Step 5 — Install on your iPhone
1. Open the Vercel URL in **Safari** on your iPhone
2. Tap the **Share button** (box with arrow at bottom of screen)
3. Scroll down and tap **Add to Home Screen**
4. Name it **LumberCRM** and tap **Add**
5. The app icon now appears on your home screen — tap it and it opens like a real app!

---

## ✅ You're done!
Your app works offline, saves your data locally, and runs just like a native app.
