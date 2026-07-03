require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/waitlist', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
  }

  const { error } = await supabase.from('waitlist').insert({ email });

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'This email is already registered' });
    }
    console.error('Supabase insert error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }

  return res.status(200).json({ success: true });
});

app.get('/stats', async (req, res) => {
  const { data, error } = await supabase.from('orders').select('amount, status');

  if (error) {
    console.error('Supabase select error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }

  const total_orders = data.length;
  const completed_count = data.filter((o) => o.status === 'completed').length;
  const pending_count = data.filter((o) => o.status === 'pending').length;
  const cancelled_count = data.filter((o) => o.status === 'cancelled').length;
  const total_revenue = data
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.amount), 0);
  const average_order_value = total_orders > 0
    ? data.reduce((sum, o) => sum + Number(o.amount), 0) / total_orders
    : 0;

  return res.status(200).json({
    total_revenue: Math.round(total_revenue * 100) / 100,
    total_orders,
    completed_count,
    pending_count,
    cancelled_count,
    average_order_value: Math.round(average_order_value * 100) / 100
  });
});

app.listen(PORT, () => {
  console.log(`TraceFlow waitlist server running on port ${PORT}`);
});
