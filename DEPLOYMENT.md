# 🚀 Deployment Guide: GitHub Pages + Vercel Backend + Firebase Auth

This app consists of three parts:
1. **Frontend**: Static HTML/CSS/JS → Deploy to GitHub Pages
2. **Backend**: Node.js API Server → Deploy to Vercel
3. **Auth**: Firebase Authentication (Cloud-based)

---

## **Step 0: Setup Firebase (REQUIRED)**

Before deploying, you MUST set up Firebase for authentication:

1. Follow the [Firebase Setup Guide](FIREBASE_SETUP.md)
2. Update `firebase-config.js` with your Firebase credentials
3. Test locally to ensure authentication works

---

## **Step 1: Prepare GitHub Repository**

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: AI Order Automation System"

# Create a repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## **Step 2: Deploy Backend to Vercel**

### Option A: Using Vercel CLI (Quickest)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from your project directory**:
   ```bash
   vercel
   ```
   - Sign in with GitHub
   - Approve connecting to your repo
   - Follow prompts
   - Your backend URL will be: `https://your-project-name.vercel.app`

### Option B: Using Vercel Dashboard (Web UI)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. Select "Node.js" as framework
5. Click "Deploy"

---

## **Step 3: Update Frontend Backend URL**

Once you have your Vercel backend URL:

1. Open [script.js](script.js) 
2. Find line ~24 with `BACKEND_URL`
3. Replace `'https://your-backend-url.vercel.app'` with your actual Vercel URL

Example:
```javascript
return 'https://ai-order-backend.vercel.app';
```

4. Commit and push:
   ```bash
   git add script.js
   git commit -m "Update backend URL for production"
   git push
   ```

---

## **Step 4: Deploy Frontend to GitHub Pages**

GitHub Pages should auto-deploy from your `main` branch. If not enabled:

1. Go to repo **Settings** → **Pages**
2. Set "Source" to: `Deploy from a branch`
3. Set branch to: `main` and folder to `/(root)`
4. Click **Save**

Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

---

## **Step 5: Test Everything**

1. Open your GitHub Pages URL in browser
2. Click "Login/Register"
3. Fill in the registration form and create an account

---

## **Environment Variables (Optional)**

No additional environment variables are required for basic operation.

---

## **Troubleshooting**

| Problem | Solution |
|---------|----------|
| Registration fails | Check that the backend server is running on the correct URL |
| CORS errors | Vercel handles this automatically |
| GitHub Pages shows 404 | Enable GitHub Pages in repo Settings |
| Backend shows 503 | Vercel free tier sleeps after 15 min - just request again |

---

## **Tech Stack**

- **Frontend**: HTML, CSS, JavaScript (Static)
- **Backend**: Node.js + Express (Serverless on Vercel)
- **Auth**: LocalStorage-based user registration
- **Database**: In-memory (resets on server restart)
- **Webhooks**: N8N (for order processing)

---

**Questions?** Check the GitHub Issues or edit this guide! 🎉
