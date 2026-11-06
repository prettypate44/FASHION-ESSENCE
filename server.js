// FASHION ESSENCE BY ENAMARA - BACKEND
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const FILE = path.join(__dirname, 'dresses.json');

function readData() {
  try {
    if (!fs.existsSync(FILE)) {
      console.log('dresses.json NOT FOUND');
      return { dresses: [], sales: [] };
    }
    let raw = fs.readFileSync(FILE, 'utf8');
    let data = JSON.parse(raw);
    // Handle both formats: [ ... ] or { dresses: [...] }
    if (Array.isArray(data)) return { dresses: data, sales: [] };
    return data;
  } catch (e) {
    console.log('READ ERROR:', e.message);
    return { dresses: [], sales: [] };
  }
}

function saveData(data) {
  try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch(e) { console.log(e.message); }
}

app.get('/', (req, res) => {
  res.send('Fashion Essence Backend is ON - Go to /dresses to see dresses');
});

app.get('/dresses', (req, res) => {
  let data = readData();
  res.json(data.dresses || []);
});

app.get('/dresses/:id', (req, res) => {
  let data = readData();
  let d = (data.dresses || []).find(x => x.id == req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  res.json(d);
});

app.get('/dashboard', (req, res) => {
  let data = readData();
  let dresses = data.dresses || [];
  let totalDresses = dresses.length;
  let totalInStock = 0;
  let totalSold = 0;
  let revenue = 0;
  dresses.forEach(d => {
    (d.sizes || []).forEach(s => {
      totalInStock += ((s.total || 0) - (s.sold || 0));
      totalSold += (s.sold || 0);
      revenue += (s.sold || 0) * (d.price || 0);
    });
  });
  res.json({ totalDresses, totalInStock, totalSold, revenue, sales: data.sales || [] });
});

app.post('/dresses/:id/sell', (req, res) => {
  let data = readData();
  let d = (data.dresses || []).find(x => x.id == req.params.id);
  if (!d) return res.json({ error: 'Not found' });
  let sizeObj = (d.sizes || []).find(s => s.size == req.body.size);
  if (!sizeObj || sizeObj.total - sizeObj.sold <= 0) return res.json({ error: 'Out of stock' });
  sizeObj.sold += 1;
  data.sales = data.sales || [];
  data.sales.push({ dressName: d.name, size: req.body.size, price: d.price, date: new Date() });
  saveData(data);
  res.json({ success: true });
});

app.post('/dresses/:id/restock', (req, res) => {
  let data = readData();
  let d = (data.dresses || []).find(x => x.id == req.params.id);
  if (!d) return res.json({ error: 'Not found' });
  let sizeObj = (d.sizes || []).find(s => s.size == req.body.size);
  if (sizeObj) sizeObj.total += (req.body.qty || 1);
  saveData(data);
  res.json({ success: true });
});

app.listen(PORT, () => console.log('Backend running on port ' + PORT));