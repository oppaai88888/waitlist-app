require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const EMAILS = ['alice@example.com', 'bob@example.com', 'carol@example.com'];
const PRODUCTS = ['Pro Plan', 'Starter Plan', 'Enterprise Plan'];
const STATUSES = ['pending', 'completed', 'cancelled'];
const ORDER_COUNT = 20;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount() {
  return Math.round((49 + Math.random() * (499 - 49)) * 100) / 100;
}

function randomCreatedAt() {
  return new Date(Date.now() - Math.random() * THIRTY_DAYS_MS).toISOString();
}

function buildOrders() {
  return Array.from({ length: ORDER_COUNT }, () => ({
    customer_email: randomFrom(EMAILS),
    product: randomFrom(PRODUCTS),
    amount: randomAmount(),
    status: randomFrom(STATUSES),
    created_at: randomCreatedAt()
  }));
}

async function main() {
  const orders = buildOrders();

  const { data, error } = await supabase.from('orders').insert(orders).select();

  if (error) {
    console.error('Failed to seed orders:', error);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} orders`);
}

main();
