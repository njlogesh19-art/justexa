# 🚀 Simple 3-Step Deployment Guide

Follow these simple steps to put Justexa online for free.

## 1. Get Code Online
- Create a new repository on **GitHub**.
- Upload your `server` and `client` folders there.

## 2. Set Up Database
- Create a free cluster at **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**.
- Copy your "Connection String" (URI).
- In the Atlas dashboard, go to **Network Access** and select "Allow access from anywhere" (0.0.0.0/0).

## 3. Host Backend & Frontend
We recommend **Render** for backend and **Vercel** for frontend.

### A. Backend (Render)
1. Link your GitHub.
2. Root Directory: `server`.
3. Add these **Environment Variables** (from your `.env`):
   - `MONGODB_URI` (from Step 2)
   - `JWT_SECRET` (any random string)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_API_KEY`
   - `GROQ_API_KEY`

### B. Frontend (Vercel)
1. Link your GitHub.
2. Root Directory: `client`.
3. Add this **Environment Variable**:
   - `REACT_APP_API_URL` = (Your Backend URL from Render).

## 4. Final Touch (Google Sign-In)
- Go to **[Google Cloud Console](https://console.cloud.google.com)**.
- Add your new Vercel website URL (e.g., `https://justexa.vercel.app`) to "Authorized JavaScript origins".
