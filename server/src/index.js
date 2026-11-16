require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { createClient } = require('@supabase/supabase-js');

const upload = multer({ dest: 'uploads/' });
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

const supabase = createClient(
  'https://ccmqhkesiqangiavcqmd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Auth Middleware to extract user from Supabase token
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized user' });
  }

  req.user = user;
  next();
};

// Receipt Scan & Save Endpoint (Protected)
app.post('/api/expenses/scan', requireAuth, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let items = [];
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    const priceRegex = /(\d+\.\d{2})$/;

    for (const line of lines) {
      const match = line.match(priceRegex);
      const lowerLine = line.toLowerCase();

      if (match) {
        const price = parseFloat(match[1]);
        const name = line.replace(priceRegex, '').trim();

        if (lowerLine.includes('total') && !lowerLine.includes('sub')) {
          total = price;
        } else if (lowerLine.includes('subtotal')) {
          subtotal = price;
        } else if (lowerLine.includes('tax')) {
          tax = price;
        } else if (name.length > 2) {
          items.push({ name, price, quantity: 1 });
        }
      }
    }

    if (subtotal === 0 && items.length > 0) {
      subtotal = items.reduce((sum, item) => sum + item.price, 0);
    }
    if (total === 0) total = subtotal + tax;

    const merchantName = lines[0] || 'Unknown Merchant';

    // Save to Supabase with user_id attached
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert([{
        user_id: req.user.id,
        merchant_name: merchantName,
        subtotal,
        tax_amount: tax,
        tip_amount: 0,
        total_amount: total
      }])
      .select()
      .single();

    if (receiptError) throw receiptError;

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        receipt_id: receiptData.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    res.json({
      id: receiptData.id,
      merchantName,
      items,
      subtotal,
      taxAmount: tax,
      tipAmount: 0,
      totalAmount: total
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process and save receipt.' });
  }
});

// Fetch past receipts for logged-in user only (Protected)
app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        id,
        merchant_name,
        subtotal,
        tax_amount,
        tip_amount,
        total_amount,
        created_at,
        receipt_items (
          id,
          name,
          price
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching receipt history:', err);
    res.status(500).json({ error: 'Failed to load receipt history' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));