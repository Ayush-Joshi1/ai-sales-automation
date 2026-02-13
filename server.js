const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// N8N Webhook URLs
const N8N_WEBHOOK_URL = 'https://amit19.app.n8n.cloud/webhook/generate-invoice';

// Simple in-memory OTP store: { email -> { otp, expiresAt } }
const otps = new Map();

// Nodemailer transporter (configure via environment variables)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running', webhook: N8N_WEBHOOK_URL });
});

// Order submission endpoint
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Received order:', req.body);
    
    // Forward to N8N webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('N8N Response Status:', response.status);
    
    // Always return success to frontend (N8N received it)
    res.json({ 
      success: true, 
      message: 'Order submitted successfully',
      n8nStatus: response.status
    });
    
  } catch (error) {
    console.error('Error forwarding to N8N:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Quotation submission endpoint
app.post('/api/quotations', async (req, res) => {
  try {
    console.log('Received quotation:', req.body);
    
    // Forward to N8N webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('N8N Response Status:', response.status);
    
    // Always return success to frontend (N8N received it)
    res.json({ 
      success: true, 
      message: 'Quotation submitted successfully',
      n8nStatus: response.status
    });
    
  } catch (error) {
    console.error('Error forwarding to N8N:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint: send OTP to email
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otps.set(email.toLowerCase(), { otp, expiresAt });

    const subject = 'Your verification code';
    const text = `Your verification code is ${otp}. It expires in 5 minutes.`;

    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@example.com',
        to: email,
        subject,
        text
      });
      console.log(`OTP sent to ${email}`);
      return res.json({ success: true, message: 'OTP sent' });
    }

    // If transporter not configured, log OTP to console for development
    console.log(`No SMTP configured. OTP for ${email}: ${otp}`);
    return res.json({ success: true, message: 'OTP generated (not emailed in dev). Check server logs.' });
  } catch (err) {
    console.error('Error in /send-otp', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: verify OTP
app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });

    const record = otps.get(email.toLowerCase());
    if (!record) return res.status(400).json({ success: false, error: 'No OTP found for this email' });

    if (Date.now() > record.expiresAt) {
      otps.delete(email.toLowerCase());
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    // OTP valid - delete and respond success
    otps.delete(email.toLowerCase());
    return res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('Error in /verify-otp', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📦 N8N Webhook: ${N8N_WEBHOOK_URL}`);
});
