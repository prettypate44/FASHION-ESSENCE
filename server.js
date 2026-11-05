// FASHION ESSENCE BY ENAMARA - BACKEND
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'dresses.json');

// --- SIMPLE ADMIN LOGIN ---
const ADMIN_USER = "enamara";
const ADMIN_PASS = "fashion123";
const ADMIN_TOKEN = "enamara-admin-token-2026";

function checkAdmin(req, res, next) {
  const token = req.headers['authorization'];
  if (token === ADMIN_TOKEN) return next();
  return res.status(401).json({ error: 'Not authorized. Please login as admin.' });
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, token: ADMIN_TOKEN, message: 'Login successful' });
  }
  return res.status(401).json({ success: false, error: 'Wrong username or password' });
});

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ dresses: [], sales: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/dresses', (req, res) => {
  const db = readDB();
  res.json(db.dresses);
});

app.get('/api/dresses/:id', (req, res) => {
  const db = readDB();
  const dress = db.dresses.find(d => String(d.id) === String(req.params.id));
  if (!dress) return res.status(404).json({ error: 'Dress not found' });
  res.json(dress);
});

app.post('/api/dresses', checkAdmin, (req, res) => {
  const { name, price, photo, sizes } = req.body;
  if (!name || !price || !sizes) {
    return res.status(400).json({ error: 'Name, price and sizes required' });
  }
  const db = readDB();
  const newDress = {
    id: Date.now(),
    name,
    price: Number(price),
    photo: photo || '',
    sizes: sizes.map(s => ({ size: String(s.size), total: Number(s.total), sold: 0 })),
    createdAt: new Date().toISOString()
  };
  db.dresses.push(newDress);
  saveDB(db);
  res.status(201).json(newDress);
});

app.post('/api/dresses/:id/sell', checkAdmin, (req, res) => {
  const { size } = req.body;
  const db = readDB();
  const dress = db.dresses.find(d => String(d.id) === String(req.params.id));
  if (!dress) return res.status(404).json({ error: 'Dress not found' });
  const sizeObj = dress.sizes.find(s => String(s.size) === String(size));
  if (!sizeObj) return res.status(400).json({ error: 'Size not found' });
  if (sizeObj.total - sizeObj.sold <= 0) {
    return res.status(400).json({ error: 'Out of stock for this size' });
  }
  sizeObj.sold += 1;
  db.sales.push({ dressId: dress.id, dressName: dress.name, size, price: dress.price, channel: 'Store', date: new Date().toISOString() });
  saveDB(db);
  res.json({ message: 'Sold successfully', dress });
});

app.post('/api/dresses/:id/restock', checkAdmin, (req, res) => {
  const { size, qty } = req.body;
  const db = readDB();
  const dress = db.dresses.find(d => String(d.id) === String(req.params.id));
  if (!dress) return res.status(404).json({ error: 'Dress not found' });
  const sizeObj = dress.sizes.find(s => String(s.size) === String(size));
  if (!sizeObj) return res.status(400).json({ error: 'Size not found' });
  sizeObj.total += Number(qty || 1);
  saveDB(db);
  res.json({ message: 'Restocked', dress });
});

app.delete('/api/dresses/:id', checkAdmin, (req, res) => {
  const db = readDB();
  db.dresses = db.dresses.filter(d => String(d.id) !== String(req.params.id));
  saveDB(db);
  res.json({ message: 'Deleted' });
});

app.get('/api/dashboard', (req, res) => {
  const db = readDB();
  const totalDresses = db.dresses.length;
  const totalInStock = db.dresses.reduce((a, d) => a + d.sizes.reduce((b, s) => b + (s.total - s.sold), 0), 0);
  const totalSold = db.dresses.reduce((a, d) => a + d.sizes.reduce((b, s) => b + s.sold, 0), 0);
  const revenue = db.sales.reduce((a, s) => a + s.price, 0);
  res.json({ totalDresses, totalInStock, totalSold, revenue, sales: db.sales });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});