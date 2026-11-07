const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://fashionessence1.onrender.com';

const WHATSAPP_NUMBER = "2348033457117";
const CLOUD_NAME = "yjrwajmb";
const UPLOAD_PRESET = "fashionessence";

let dresses = [];

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
    document.getElementById('shop').innerHTML = "<p>Loading dresses... please wait, waking up server (up to 50s)...</p>";
    let res = await fetch(API + '/dresses');
    dresses = await res.json();
    renderShop();
  } catch (e) {
    document.getElementById('shop').innerHTML = "<p>Server is waking up... <b>Wait 50 seconds and refresh this page.</b></p><button onclick='loadDresses()'>Try Again</button>";
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
      <img src="${img}" onerror="this.src='https://via.placeholder.com/400x220?text=${encodeURIComponent(d.name)}'" style="width:100%;border-radius:10px;height:220px;object-fit:cover">
      <h3>${d.name}</h3>
      <p><b>₦${d.price.toLocaleString()}</b> | Remaining: ${totalRem}</p>
      <p>${d.sizes.map(s => `Size ${s.size}: ${getRemaining(s)} left`).join(' | ')}</p>
      <button onclick="openDetail(${d.id})">View / Sell</button>
    </div>`;
  });
  document.getElementById('shop').innerHTML = html;
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

// ===== ADMIN - ADD DRESS WITH CLOUDINARY =====

function addSizeRow() {
  let div = document.createElement('div');
  div.innerHTML = `<input placeholder="Size e.g 10" class="sizeInput"> <input placeholder="Qty" type="number" class="qtyInput">`;
  document.getElementById('sizeList').appendChild(div);
}

async function uploadToCloudinary(file) {
  let formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  let res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  let data = await res.json();
  return data.secure_url;
}

async function addDress() {
  let name = document.getElementById('dressName').value;
  let price = Number(document.getElementById('dressPrice').value);

  // Photo - try both input IDs, use Cloudinary
  let photo = "";
  let fileInput = document.getElementById('dressPhotoFile') || document.getElementById('photoFile');
  if (fileInput && fileInput.files[0]) {
    alert("Uploading photo to Cloudinary... please wait");
    photo = await uploadToCloudinary(fileInput.files[0]);
  } else {
    let linkInput = document.getElementById('dressPhoto');
    if (linkInput && linkInput.value) photo = linkInput.value;
  }

  let sizeEls = document.querySelectorAll('.sizeInput');
  let qtyEls = document.querySelectorAll('.qtyInput');
  let sizes = [];
  for (let i = 0; i < sizeEls.length; i++) {
    if (sizeEls[i].value) sizes.push({ size: sizeEls[i].value, total: Number(qtyEls[i].value || 0), sold: 0 });
  }

  if (!name || !price || sizes.length === 0) {
    alert('Enter at least one size');
    return;
  }

  await fetch(API + '/dresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price, photo, sizes })
  });

  alert('Dress added with Cloudinary!');
  document.getElementById('dressName').value = '';
  document.getElementById('dressPrice').value = '';
  if (document.getElementById('dressPhoto')) document.getElementById('dressPhoto').value = '';
  if (fileInput) fileInput.value = '';
  await loadDresses();
  showTab('shop');
}

// Connect Admin Form ONCE - not inside addDress
let adminForm = document.getElementById('adminForm');
if (adminForm) {
  adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addDress();
  });
}

// ===== DASHBOARD =====
function renderDashboard() {
  let totalDresses = dresses.length;
  let totalSold = dresses.reduce((a, d) => a + d.sizes.reduce((b, s) => b + s.sold, 0), 0);
  let totalRevenue = dresses.reduce((a, d) => a + d.sizes.reduce((b, s) => b + (s.sold * d.price), 0), 0);
  let el = document.getElementById('dashboardContent');
  if (el) el.innerHTML = `<p><b>Total Dresses:</b> ${totalDresses}</p><p><b>Total Sold:</b> ${totalSold}</p><p><b>Total Revenue:</b> ₦${totalRevenue.toLocaleString()}</p>`;
}

loadDresses();