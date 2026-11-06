// FASHION ESSENCE - FIXED app.js
const API = 'https://fashion-essence.onrender.com/api/dresses';
const WHATSAPP_NUMBER = '23408033457117'; // CHANGE TO YOUR NUMBER
let dresses = [];

function showBackendError(){
  document.getElementById('shopList').innerHTML = `
    <div class="card" style="border:2px solid red">
      <h3 style="color:red">Backend is OFF</h3>
      <p>Frontend cannot connect to backend.</p>
      <p><b>Fix in 2 steps:</b></p>
      <p>1. Open new terminal in VS Code<br>2. Run: <b>node server.js</b></p>
      <p>You should see: Backend running on http://localhost:5000</p>
      <p>Then refresh this page.</p>
      <button onclick="fetchDresses()">Try Again</button>
    </div>`;
}

async function fetchDresses() {
  try {
    const res = await fetch(`${API}/dresses`);
    if(!res.ok) throw new Error('Backend returned error: ' + res.status);
    dresses = await res.json();
    renderShop();
  } catch(err) {
    console.log('fetchDresses failed:', err);
    showBackendError();
  }
}

function getToken(){ return localStorage.getItem('admin_token') || ''; }
function checkLogin(){
  if(!getToken()){
    alert('Please login as Admin/Staff first');
    window.location.href='login.html';
    return false;
  }
  return true;
}

function showTab(tab) {
  ['shop','admin','dashboard','detail'].forEach(t => {
    let el = document.getElementById('view-'+t);
    if(el) el.classList.add('hidden');
  });
  document.getElementById('view-'+tab).classList.remove('hidden');
  if(tab==='shop') renderShop();
  if(tab==='dashboard') renderDashboard();
}

function renderShop() {
  let searchEl = document.getElementById('search');
  let q = searchEl ? (searchEl.value||'').toLowerCase() : '';
  let html = '';
  dresses.filter(d=>d.name.toLowerCase().includes(q)).forEach(d=>{
    let totalRem = d.sizes.reduce((a,s)=>a+(s.total-s.sold),0);
    let badges = d.sizes.map(s=>`<span class="badge">Size ${s.size}: ${s.total-s.sold} left</span>`).join(' ');
    let img = d.photo || `https://via.placeholder.com/400x220?text=${encodeURIComponent(d.name)}`;
    html += `<div class="card"><img src="${img}"><h3>${d.name}</h3><p><b>₦${d.price.toLocaleString()}</b> | Remaining: ${totalRem}</p><div>${badges}</div><button onclick="openDetail(${d.id})">View / Scan / Sell</button></div>`;
  });
  document.getElementById('shopList').innerHTML = html || 'No dresses yet';
}

async function addDress() {
  if(!checkLogin()) return;
  let name = document.getElementById('dressName').value;
  let price = document.getElementById('dressPrice').value;
  let photo = document.getElementById('dressPhoto').value;
  let sizes = [];
  document.querySelectorAll('.sizeInput').forEach((inp,i)=>{
    let sz = inp.value; let qty = document.querySelectorAll('.qtyInput')[i].value;
    if(sz && qty) sizes.push({size:sz, total:Number(qty)});
  });
  try {
    const res = await fetch(`${API}/dresses`, {method:'POST', headers:{'Content-Type':'application/json', 'Authorization': getToken()}, body:JSON.stringify({name,price,photo,sizes})});
    const data = await res.json();
    if(data.error) return alert(data.error);
    alert('Dress added!');
    fetchDresses(); showTab('shop');
  } catch(err){ alert('Backend is OFF. Run: node server.js'); }
}

async function openDetail(id) {
  try {
    const res = await fetch(`${API}/dresses/${id}`);
    const d = await res.json();
    ['shop','admin','dashboard'].forEach(t=>document.getElementById('view-'+t).classList.add('hidden'));
    const detail = document.getElementById('view-detail');
    detail.classList.remove('hidden');
    let qrLink = `${location.origin}/dress.html?id=${d.id}`;
    let qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrLink)}`;
    let sizeOptions = d.sizes.map(s=>`<option value="${s.size}">Size ${s.size} - ${s.total-s.sold} left</option>`).join('');
    let img = d.photo || `https://via.placeholder.com/400x220?text=${encodeURIComponent(d.name)}`;
    detail.innerHTML = `<button onclick="showTab('shop')">← Back</button><div class="card"><img src="${img}"><h2>${d.name}</h2><p>Price: ₦${d.price.toLocaleString()}</p><p>${d.sizes.map(s=>`Size ${s.size}: Total ${s.total} | Sold ${s.sold} | Remaining ${s.total-s.sold}<br>`).join('')}</p><div class="center"><p><b>QR Code - Print & Attach</b></p><img class="qr" src="${qrImg}"></div><select id="selectedSize-${d.id}">${sizeOptions}</select><button class="green" onclick="orderWhatsApp(${d.id})">Order on WhatsApp</button><button onclick="markSold(${d.id})">Staff: Mark As Sold</button><button onclick="restock(${d.id})">Staff: Restock +1</button></div>`;
  } catch(err){ alert('Cannot load dress. Backend is OFF?'); }
}

function orderWhatsApp(id) {
  let d = dresses.find(x=>x.id===id);
  let size = document.getElementById('selectedSize-'+id).value;
  let msg = `Hello FASHION ESSENCE BY ENAMARA, I want to order ${d.name}, Size ${size}, ₦${d.price.toLocaleString()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

async function markSold(id) {
  if(!checkLogin()) return;
  let size = document.getElementById('selectedSize-'+id).value;
  try {
    const res = await fetch(`${API}/dresses/${id}/sell`, {method:'POST', headers:{'Content-Type':'application/json', 'Authorization': getToken()}, body:JSON.stringify({size})});
    const data = await res.json();
    if(data.error) return alert(data.error);
    alert('Sold!'); fetchDresses(); openDetail(id);
  } catch(err){ alert('Backend is OFF'); }
}

async function restock(id) {
  if(!checkLogin()) return;
  let size = document.getElementById('selectedSize-'+id).value;
  try {
    await fetch(`${API}/dresses/${id}/restock`, {method:'POST', headers:{'Content-Type':'application/json', 'Authorization': getToken()}, body:JSON.stringify({size, qty:1})});
    alert('Restocked!'); fetchDresses(); openDetail(id);
  } catch(err){ alert('Backend is OFF'); }
}

async function renderDashboard() {
  try {
    const res = await fetch(`${API}/dashboard`);
    const s = await res.json();
    document.getElementById('dashStats').innerHTML = `<h3>Dashboard</h3><p>Total Dresses: ${s.totalDresses}</p><p>In Stock: ${s.totalInStock}</p><p>Sold: ${s.totalSold}</p><p>Revenue: ₦${s.revenue.toLocaleString()}</p><p>Sales: ${s.sales.map(x=>`${x.dressName} Size ${x.size} - ₦${x.price}<br>`).join('') || 'No sales yet'}</p>`;
  } catch(err) {
    document.getElementById('dashStats').innerHTML = `<p style="color:red"><b>Backend is OFF.</b><br>Run: node server.js in terminal</p><button onclick="renderDashboard()">Try Again</button>`;
  }
}

fetchDresses();