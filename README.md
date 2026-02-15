# 🚀 AI Order Automation System

An enterprise-grade order management platform with real-time inventory tracking, email OTP authentication, order history, and quotation requests.

## ✨ Features

- **Email OTP Authentication** - Sign in with one-time verification codes
- **Firebase Email/Password Auth** - Traditional registration & login
- **Product Catalog** - Browse & search products with real-time pricing
- **Order Management** - Place orders with shipping address & special instructions
- **Quotation System** - Request quotes for bulk orders
- **Order History** - Track all submitted orders per user
- **N8N Integration** - Automated webhook processing for orders
- **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js 16+** (Download from [nodejs.org](https://nodejs.org))
- **Firebase Project** (Free tier) - [Setup Guide](FIREBASE_SETUP.md)

### 1. Firebase Setup (Required)

Before starting, enable Email/Password authentication in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `ai-sales-automation-8bef3`
3. **Build** → **Authentication** → **Sign-in method**
4. Enable **Email/Password**
5. Click **Save**

✅ Done! Firebase credentials are already in `firebase-config.js`

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Backend Server

```bash
npm run dev
```

Backend will start on `http://localhost:5000`

You should see:
```
✅ Backend server running on http://localhost:5000
```

### 4. Start Frontend Server (New Terminal)

```bash
node frontend-server.js
```

Frontend will start on `http://localhost:8080`

### 5. Open Website

Open your browser and go to: **http://localhost:8080**

---

## 🔐 Authentication Methods

### Email OTP (One-Time Password)
1. Click **Login/Register** → "Sign in with Email OTP"
2. Enter your email
3. Click **Send OTP**
   - In development: OTP appears in terminal console
   - In production: OTP sent via email
4. Enter the code and click **Verify & Sign In**

### Email/Password (Firebase)
1. Click **Login/Register**
2. Click "Create Account" to register or enter existing credentials
3. Sign in with email & password

### OTP Testing (Development)
By default, SMTP is not configured. OTP codes are logged to the backend terminal:
```
⚠️ SMTP not configured. OTP for user@example.com: 123456
```

---

## 📧 Email Configuration (Optional - Production Only)

For real email delivery, set SMTP environment variables before starting the server:

```bash
# .env file (create in project root)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Create an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the App Password in `SMTP_PASS` (not your regular password)

### Start with SMTP:
```bash
# Windows PowerShell
$env:SMTP_HOST="smtp.gmail.com"; $env:SMTP_PORT="587"; npm run dev

# Linux/Mac
export SMTP_HOST=smtp.gmail.com SMTP_PORT=587 && npm run dev
```

---

## 📁 File Structure

```
vstry/
├── index.html              # Main website
├── script.js               # Frontend logic & forms
├── style.css               # Styling
├── server.js               # Backend API (Node.js/Express)
├── frontend-server.js      # Static file server for local testing
├── firebase-config.js      # Firebase configuration
├── firebase-auth.js        # Firebase auth module
├── products.json           # Product catalog
├── package.json            # Dependencies
└── README.md              # This file
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Submit an order |
| POST | `/api/quotations` | Request a quotation |
| POST | `/api/send-otp` | Send OTP to email |
| POST | `/api/verify-otp` | Verify OTP code |
| GET | `/` | Health check |

---

## 🧪 Testing Checklist

- [ ] **Backend starts** without errors
- [ ] **Frontend loads** at localhost:8080
- [ ] **Firebase Login** - Create account & login
- [ ] **Email OTP** - Send OTP → Verify code (check terminal)
- [ ] **Product Search** - Search products by name
- [ ] **Place Order** - Submit order form
- [ ] **Order History** - View submitted orders
- [ ] **Logout** - Sign out works correctly

---

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment to:
- **Frontend**: GitHub Pages
- **Backend**: Vercel
- **Auth**: Firebase (cloud-hosted)

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check Node.js version
node --version  # Should be 16+

# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

### "nodemailer not found"
```bash
npm install nodemailer@6.9.3
```

### Firebase not initializing
- Check `firebase-config.js` has correct credentials
- Ensure Firebase SDK CDN scripts load in `index.html`
- Check browser console for errors

### OTP not appearing
- Check backend terminal for OTP code
- Make sure backend is running on port 5000
- Verify BACKEND_URL in `script.js` points to correct port

### Products not loading
- Check `products.json` is valid JSON
- Verify file path in `script.js` is correct
- Check browser console for fetch errors

---

## 📞 Support

For issues or questions:
1. Check browser **Console** (F12) for errors
2. Check backend **Terminal** for logs
3. Review [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Firebase issues
4. Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help

---

## 📄 License

MIT - Feel free to use and modify for your projects

---

**Ready to launch?** Start the servers and visit **http://localhost:8080** 🎉
