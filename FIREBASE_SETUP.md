# Firebase Setup Guide

This application now uses **Firebase Authentication** for user registration and login.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter your project name (e.g., "AI Order System")
4. Click "Create Project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get Started"**
3. Enable the sign-in providers you need. For this project we use **Google** OAuth:
  - Click **Sign-in method**
  - Click **Google** and toggle it ON
  - Save the changes
4. Add authorized domains (required for OAuth):
  - Still in **Authentication → Sign-in method**, scroll to **Authorized domains**
  - Add `localhost` (for local testing) and any hosting domains (e.g., `your-app.vercel.app`)
  - Save changes

## Step 3: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **"Your apps"** section
3. Click **"Web"** (or create a new web app if needed)
4. Copy the Firebase config object

## Step 4: Update firebase-config.js

Replace the placeholder values in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // from Firebase config
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Test Locally

```bash
npm start
# or
node server.js
```

Then:
1. Open `http://localhost:8080` (frontend)
2. Click "Login/Register"
3. Create a new account
4. Check Firebase Console → Authentication → Users to see your registered users

## Step 6: Deploy to Vercel

1. Push your code to GitHub (including updated `firebase-config.js`)
2. In Vercel Dashboard, create a new project from your GitHub repo
3. No environment variables needed (Firebase SDK is public)
4. Deploy!

## Important Notes

⚠️ **Keep your API Key safe:**
- The `apiKey` in `firebase-config.js` is public and OK to share
- It's different from your Firebase Admin SDK key (which should stay private)
- Restrict API key in Firebase Console under **APIs & Services** if needed

## Features Available

✅ User Registration
✅ User Login/Logout  
✅ User Profile (Display Name)
✅ Password validation
✅ Email verification support (optional - not configured)
✅ Password reset support (optional - not configured)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find Firebase" error | Ensure `firebase-auth.js` is loaded before `script.js` in HTML |
| Login/Register not working | Check `firebase-config.js` has correct values |
| "Project not found" error | Verify `projectId` matches your Firebase project |
| Users not appearing in Firebase Console | Check Authentication is enabled for Email/Password method |
| "This domain is not authorized for OAuth operations" | Add the domain shown in the browser address bar (for example `127.0.0.1` or `localhost`) to **Authentication → Sign-in method → Authorized domains** in the Firebase Console. If you're using Live Server (which uses `127.0.0.1:5500`), add `127.0.0.1`. |

## Local webhook proxy (CORS workaround)

If your webhook requests fail locally due to CORS, you can run a simple local proxy that forwards POSTs to your external n8n webhooks. A proxy file `proxy-server.js` is included in the project root. To run it:

```powershell
# From the project folder
node proxy-server.js
# Server listens on http://localhost:5000
```

The client can be configured to forward requests to the proxy (the code contains `USE_LOCAL_PROXY` toggle). The proxy forwards:
- `POST /webhook/order` -> your configured ORDER webhook
- `POST /webhook/quotation` -> your configured QUOTATION webhook

This avoids CORS issues during local testing.

## Next Steps

- Add email verification (optional)
- Add password reset flow (optional)
- Store user profile data in Firestore (optional)
- Add Google/GitHub authentication (optional)

