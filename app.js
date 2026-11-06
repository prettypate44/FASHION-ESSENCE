const API = 'https://fashion-essence1.onrender.com';
const WHATSAPP_NUMBER = '2348033457117';
let dresses = [];

async function fetchDresses() {
  const res = await fetch(`${API}/dresses`);
  dresses = await res.json();
  renderShop();
}

function showTab(tab) {
  ['shop','admin','dashboard','detail'].forEach(t => document.getElementById('view-'+t).classList.add('hidden'));
  document.getElementById('view-'+tab).classList.remove('hidden');
  if(tab==='shop') renderShop();
  if(tab==='dashboard') renderDashboard();
}

function renderShop() {
  let q = (document.getElementById('search').value||'').toLowerCase();
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
  let name = document.getElementById('dressName').value;
  let price = document.getElementById('dressPrice').value;
  let photo = document.getElementById('dressPhoto').value;
  let sizes = [];
  document.querySelectorAll('.sizeInput').forEach((inp,i)=>{
    let sz = inp.value; let qty = document.querySelectorAll('.qtyInput')[i].value;
    if(sz && qty) sizes.push({size:sz, total:Number(qty)});
  });
  await fetch(`${API}/dresses`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,price,photo,sizes})});
  alert('Dress added!');
  fetchDresses(); showTab('shop');
}

async function openDetail(id) {
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
}

function orderWhatsApp(id) {
  let d = dresses.find(x=>x.id===id);
  let size = document.getElementById('selectedSize-'+id).value;
  let msg = `Hello FASHION ESSENCE BY ENAMARA, I want to order ${d.name}, Size ${size}, ₦${d.price.toLocaleString()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

async function markSold(id) {
  let size = document.getElementById('selectedSize-'+id).value;
  const res = await fetch(`${API}/dresses/${id}/sell`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({size})});
  const data = await res.json();
  if(data.error) return alert(data.error);
  alert('Sold!'); fetchDresses(); openDetail(id);
}

async function restock(id) {
  let size = document.getElementById('selectedSize-'+id).value;
  await fetch(`${API}/dresses/${id}/restock`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({size, qty:1})});
  alert('Restocked!'); fetchDresses(); openDetail(id);
}

async function renderDashboard() {
  const res = await fetch(`${API}/dashboard`);
  const s = await res.json();
  document.getElementById('dashStats').innerHTML = `<h3>Dashboard</h3><p>Total Dresses: ${s.totalDresses}</p><p>In Stock: ${s.totalInStock}</p><p>Sold: ${s.totalSold}</p><p>Revenue: ₦${s.revenue.toLocaleString()}</p><p>Sales: ${s.sales.map(x=>`${x.dressName} Size ${x.size} - ₦${x.price}<br>`).join('') || 'No sales yet'}</p>`;
}

fetchDresses();