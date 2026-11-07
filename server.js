// FASHION ESSENCE BY ENAMARA - BACKEND
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

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
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/dresses', (req, res) => {
  let data = readData();
  res.json(data.dresses || []);
});

// *** ADDED - THIS WAS MISSING ***
app.post('/dresses', (req, res) => {
  let data = readData();
  let newDress = {
    id: Date.now(),
    name: req.body.name,
    price: Number(req.body.price) || 0,
    photo: req.body.photo || '',
    image: req.body.photo || '',
    sizes: (req.body.sizes || []).map(s => ({ size: s.size, total: Number(s.total) || 0, sold: 0 }))
  };
  if (!newDress.name) return res.json({ error: 'Name required' });
  data.dresses = data.dresses || [];
  data.dresses.push(newDress);
  saveData(data);
  res.json({ success: true, dress: newDress });
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