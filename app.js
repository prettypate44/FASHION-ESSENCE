const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://fashionessence1.onrender.com';

const WHATSAPP_NUMBER = "2348033457117";

let dresses = [];
let sales = [];

function showTab(tab) {
  document.getElementById('view-shop').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-detail').classList.add('hidden');
  document.getElementById('tabShop').classList.remove('active');
  document.getElementById('tabAdmin').classList.remove('active');
  document.getElementById('tabDashboard').classList.remove('active');

  if (tab === 'shop') {
    document.getElementById('view-shop').classList.remove('hidden');
    document.getElementById('tabShop').classList.add('active');
    renderShop();
  }
  if (tab === 'admin') {
    document.getElementById('view-admin').classList.remove('hidden');
    document.getElementById('tabAdmin').classList.add('active');
  }
  if (tab === 'dashboard') {
    document.getElementById('view-dashboard').classList.remove('hidden');
    document.getElementById('tabDashboard').classList.add('active');
    renderDashboard();
  }
}

async function loadDresses() {
  try {
    let res = await fetch(API + '/dresses');
    dresses = await res.json();
    renderShop();
  } catch (e) {
    document.getElementById('shopList').innerHTML = "<p>Cannot connect to backend. Is <b>node server.js</b> running?</p>";
  }
}

function getRemaining(s) { return s.total - s.sold; }

function renderShop() {
  let q = (document.getElementById('search').value || "").toLowerCase();
  let html = "";
  dresses.filter(d => d.name.toLowerCase().includes(q)).forEach(d => {
    let totalRem = d.sizes.reduce((a, s) => a + getRemaining(s), 0);
    let img = d.photo || "https://via.placeholder.com/400x220?text=" + encodeURIComponent(d.name);
    html += `<div class="card">
      <img src="${img}" style="width:100%;border-radius:10px;height:220px;object-fit:cover">
      <h3>${d.name}</h3>
      <p><b>₦${d.price.toLocaleString()}</b> | Remaining: ${totalRem}</p>
      <p>${d.sizes.map(s => `Size ${s.size}: ${getRemaining(s)} left`).join(' | ')}</p>
      <button onclick="openDetail(${d.id})">View / Sell</button>
    </div>`;
  });
  if (!html) html = "<p>No dresses found.</p>";
  document.getElementById('shopList').innerHTML = html;
}

async function addDress() {
  let name = document.getElementById('dressName').value.trim();
  let price = parseInt(document.getElementById('dressPrice').value);
  let photo = document.getElementById('dressPhoto').value.trim();
  if (!name || !price) { alert("Enter Name and Price"); return; }
  let sizes = [];
  document.querySelectorAll('.sizeInput').forEach((inp, i) => {
    let sz = inp.value.trim();
    let qty = parseInt(document.querySelectorAll('.qtyInput')[i].value);
    if (sz && qty) sizes.push({ size: sz, total: qty });
  });
  if (!sizes.length) { alert("Enter at least one size"); return; }

  let res = await fetch(API + '/dresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price, photo, sizes })
  });
  let data = await res.json();
  if (data.success) {
    alert("Dress added!");
    document.getElementById('dressName').value = "";
    document.getElementById('dressPrice').value = "";
    document.getElementById('dressPhoto').value = "";
    document.querySelectorAll('.sizeInput').forEach(e => e.value = "");
    document.querySelectorAll('.qtyInput').forEach(e => e.value = "");
    await loadDresses();
    showTab('shop');
  } else {
    alert("Failed: " + (data.error || "Unknown"));
  }
}

async function renderDashboard() {
  try {
    let res = await fetch(API + '/dashboard');
    let d = await res.json();
    document.getElementById('dashStats').innerHTML = `
      <h3>Dashboard</h3>
      <p>Total Dresses: <b>${d.totalDresses}</b></p>
      <p>Total In Stock: <b>${d.totalInStock}</b></p>
      <p>Total Sold: <b>${d.totalSold}</b></p>
      <p>Total Revenue: <b>₦${d.revenue.toLocaleString()}</b></p>
      <h4>Sales History</h4>
      <p>${d.sales && d.sales.length ? d.sales.map(s => `${s.dressName} Size ${s.size} - ₦${s.price}<br>`).join('') : 'No sales yet'}</p>`;
  } catch (e) {
    document.getElementById('dashStats').innerHTML = "Cannot load dashboard - is server running?";
  }
}

function openDetail(id) {
  let d = dresses.find(x => x.id == id);
  if (!d) return;
  document.getElementById('view-shop').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');
  document.getElementById('view-dashboard').classList.add('hidden');
  let detail = document.getElementById('view-detail');
  detail.classList.remove('hidden');
  let img = d.photo || "https://via.placeholder.com/400x220?text=" + encodeURIComponent(d.name);
  detail.innerHTML = `
    <button onclick="showTab('shop')">← Back</button>
    <div class="card">
      <img src="${img}" style="width:100%;border-radius:10px;height:220px;object-fit:cover">
      <h2>${d.name}</h2>
      <p><b>Price: ₦${d.price.toLocaleString()}</b></p>
      <p>${d.sizes.map(s => `Size ${s.size}: Total ${s.total} | Sold ${s.sold} | Remaining ${getRemaining(s)}<br>`).join('')}</p>
      <select id="selectedSize-${d.id}">${d.sizes.map(s => `<option value="${s.size}">Size ${s.size} - ${getRemaining(s)} remaining</option>`).join('')}</select>
      <button onclick="markSold(${d.id})">Mark As Sold</button>
      <button onclick="restock(${d.id})">Restock +1</button>
      <button style="background:#25D366" onclick="orderWhatsApp(${d.id})">Order on WhatsApp</button>
    </div>`;
}

function orderWhatsApp(id) {
  let d = dresses.find(x => x.id == id);
  let size = document.getElementById('selectedSize-' + id).value;
  let msg = `Hello FASHION ESSENCE BY ENAMARA, I want to order ${d.name}, Size ${size}, ₦${d.price.toLocaleString()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

async function markSold(id) {
  let size = document.getElementById('selectedSize-' + id).value;
  await fetch(API + '/dresses/' + id + '/sell', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size })
  });
  await loadDresses();
  openDetail(id);
}

async function restock(id) {
  let size = document.getElementById('selectedSize-' + id).value;
  await fetch(API + '/dresses/' + id + '/restock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size, qty: 1 })
  });
  await loadDresses();
  openDetail(id);
}

loadDresses();