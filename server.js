const express = require('express');
const cors = require('cors');
// Use global fetch when available (Node 18+). Otherwise attempt to require node-fetch.
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    const nf = require('node-fetch');
    fetchFn = nf && nf.default ? nf.default : nf;
  } catch (e) {
    console.warn('node-fetch not available and global fetch not found. Install node-fetch or use Node 18+.');
  }
}

const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// N8N Webhook URLs
const N8N_WEBHOOK_URL = 'https://amit19.app.n8n.cloud/webhook/generate-invoice';

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running', webhook: N8N_WEBHOOK_URL });
});

// Order submission endpoint
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Received order:', req.body);
    
    if (!fetchFn) {
      return res.status(500).json({ success: false, error: 'Fetch not available' });
    }
    
    // Forward to N8N webhook
    const response = await fetchFn(N8N_WEBHOOK_URL, {
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
    
    if (!fetchFn) {
      return res.status(500).json({ success: false, error: 'Fetch not available' });
    }
    
    // Forward to N8N webhook
    const response = await fetchFn(N8N_WEBHOOK_URL, {
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


app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📦 N8N Webhook: ${N8N_WEBHOOK_URL}`);
});
