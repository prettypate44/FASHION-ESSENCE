const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://fashionessence1.onrender.com';
const WHATSAPP_NUMBER = "2348033457117";
const CLOUD_NAME = "yjrwajmb";
const UPLOAD_PRESET = "fashionessence";
let dresses = [];
let currentPage = 1;
const PAGE_SIZE = 20;

function showTab(tab) {
  // Hide all views
  ['view-shop','view-admin','view-dashboard','view-detail','view-scan'].forEach(id=>{
    let el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  // Remove active from all tabs
  ['tabShop','tabScan','tabAdmin','tabDashboard'].forEach(id=>{
    let el = document.getElementById(id);
    if(el) el.classList.remove('active');
  });
  // Stop scanner when leaving scan tab
  if(tab !== 'scan') stopScan();

  if (tab === 'shop') { document.getElementById('view-shop').classList.remove('hidden'); document.getElementById('tabShop').classList.add('active'); renderShop(); }
  if (tab === 'scan') { document.getElementById('view-scan').classList.remove('hidden'); document.getElementById('tabScan').classList.add('active'); }
  if (tab === 'admin') { document.getElementById('view-admin').classList.remove('hidden'); document.getElementById('tabAdmin').classList.add('active'); }
  if (tab === 'dashboard') { document.getElementById('view-dashboard').classList.remove('hidden'); document.getElementById('tabDashboard').classList.add('active'); renderDashboard(); }
}

async function loadDresses() {
  try {
    document.getElementById('shop').innerHTML = "<p>Loading dresses... please wait, waking up server (up to 50s)...</p>";
    let res = await fetch(API + '/dresses');
    dresses = await res.json();
    renderShop();
  } catch (e) {
    document.getElementById('shop').innerHTML = "<p>Server is waking up... <b>Wait 50 seconds and refresh.</b></p><button onclick='loadDresses()'>Try Again</button>";
  }
}

function getRemaining(s) { return s.total - s.sold; }

// --- BEST SELLERS ---
function renderBestSellers(){
  let el = document.getElementById('bestSellers');
  if(!el) return;
  let sorted = [...dresses].sort((a,b)=>{
    let getSold = (d)=> d.sizes ? d.sizes.reduce((s,x)=>s+(x.sold||0),0) : 0;
    return getSold(b) - getSold(a);
  }).slice(0,8);
  if(!sorted.length){ el.innerHTML="<p>No best sellers yet</p>"; return; }
  el.innerHTML = sorted.map(d=>{
    let img = d.photo || "https://via.placeholder.com/300x300?text="+encodeURIComponent(d.name);
    let sold = d.sizes ? d.sizes.reduce((s,x)=>s+(x.sold||0),0) : 0;
    return `<div class="best-card" onclick="openDetail(${d.id})"><img src="${img}"><h4>${d.name}</h4><p>₦${d.price.toLocaleString()}</p><small>⭐ 4.8 • ${sold} sold</small></div>`;
  }).join('');
}

function renderShop() {
  renderBestSellers();
  let q = (document.getElementById('search').value || "").toLowerCase();
  let filtered = dresses.filter(d => d.name.toLowerCase().includes(q));
  let totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  let start = (currentPage - 1) * PAGE_SIZE;
  let pageDresses = filtered.slice(start, start + PAGE_SIZE);
  let html = `<p><b>Showing ${start+1} - ${Math.min(start+PAGE_SIZE, filtered.length)} of ${filtered.length} dresses | Page ${currentPage} of ${totalPages}</b></p>`;
  pageDresses.forEach(d => {
    let totalRem = d.sizes.reduce((a, s) => a + getRemaining(s), 0);
    let img = d.photo || "https://via.placeholder.com/400x220?text=" + encodeURIComponent(d.name);
    html += `<div class="card"><img src="${img}" onerror="this.src='https://via.placeholder.com/400x220?text=${encodeURIComponent(d.name)}'" style="width:100%;border-radius:10px;height:220px;object-fit:cover"><h3>${d.name}</h3><p><b>₦${d.price.toLocaleString()}</b> | Remaining: ${totalRem}</p><p>${d.sizes.map(s => `Size ${s.size}: ${getRemaining(s)} left`).join(' | ')}</p><button onclick="openDetail(${d.id})">View / Sell</button></div>`;
  });
  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:20px;"><button onclick="changePage(-1)" ${currentPage===1?'disabled':''}>← Prev</button><span style="padding:10px;">Page ${currentPage} / ${totalPages}</span><button onclick="changePage(1)" ${currentPage===totalPages?'disabled':''}>Next →</button></div>`;
  document.getElementById('shop').innerHTML = html;
}
function changePage(dir) { currentPage += dir; renderShop(); window.scrollTo(0,0); }

function openDetail(id) {
  let d = dresses.find(x => x.id == id);
  if (!d) { alert("Dress not found - ID: "+id); return; }
  // Hide all, show detail
  ['view-shop','view-admin','view-dashboard','view-scan'].forEach(v=>{
    let el=document.getElementById(v); if(el) el.classList.add('hidden');
  });
  stopScan();
  let detail = document.getElementById('view-detail');
  detail.classList.remove('hidden');
  let img = d.photo || "https://via.placeholder.com/400x220?text=" + encodeURIComponent(d.name);
  // QR that scanner can read - just the ID, simple and reliable
  let qrLink = window.location.origin + window.location.pathname + "#dress-" + d.id;
  let qrImg = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(qrLink);
  detail.innerHTML = `<button onclick="showTab('shop')">← Back</button><div class="card"><img src="${img}" style="width:100%;border-radius:10px;height:220px;object-fit:cover"><h2>${d.name}</h2><p><b>Price: ₦${d.price.toLocaleString()}</b></p><p>${d.sizes.map(s => `Size ${s.size}: Total ${s.total} | Sold ${s.sold} | Remaining ${getRemaining(s)}<br>`).join('')}</p><div style="text-align:center;"><p><b>QR For Tag - Print This</b></p><img src="${qrImg}" style="width:150px;height:150px;"><p style="font-size:11px;color:#888;">ID: ${d.id}</p></div><select id="selectedSize-${d.id}">${d.sizes.map(s => `<option value="${s.size}">Size ${s.size} - ${getRemaining(s)} remaining</option>`).join('')}</select><button onclick="markSold(${d.id})">Mark As Sold</button><button onclick="restock(${d.id})">Restock +1</button><button style="background:#25D366" onclick="orderWhatsApp(${d.id})">Order on WhatsApp</button></div>`;
}

function orderWhatsApp(id) {
  let d = dresses.find(x => x.id == id);
  let size = document.getElementById('selectedSize-' + id).value;
  let msg = `Hello FASHION ESSENCE BY ENAMARA, I want to order ${d.name}, Size ${size}, ₦${d.price.toLocaleString()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}
async function markSold(id) {
  let size = document.getElementById('selectedSize-' + id).value;
  await fetch(API + '/dresses/' + id + '/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ size }) });
  await loadDresses(); openDetail(id);
}
async function restock(id) {
  let size = document.getElementById('selectedSize-' + id).value;
  await fetch(API + '/dresses/' + id + '/restock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ size, qty: 1 }) });
  await loadDresses(); openDetail(id);
}
function addSizeRow() {
  let div = document.createElement('div');
  div.innerHTML = `<input placeholder="Size e.g 10" class="sizeInput"> <input placeholder="Qty" type="number" class="qtyInput">`;
  document.getElementById('sizeList').appendChild(div);
}
async function uploadToCloudinary(file) {
  let formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  let res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
  let data = await res.json();
  return data.secure_url;
}
async function addDress() {
  let name = document.getElementById('dressName').value;
  let price = Number(document.getElementById('dressPrice').value);
  let photo = "";
  let fileInput = document.getElementById('dressPhotoFile');
  if (fileInput && fileInput.files[0]) { alert("Uploading photo..."); photo = await uploadToCloudinary(fileInput.files[0]); }
  else { let linkInput = document.getElementById('dressPhoto'); if (linkInput && linkInput.value) photo = linkInput.value; }
  let sizeEls = document.querySelectorAll('.sizeInput');
  let qtyEls = document.querySelectorAll('.qtyInput');
  let sizes = [];
  for (let i = 0; i < sizeEls.length; i++) { if (sizeEls[i].value) sizes.push({ size: sizeEls[i].value, total: Number(qtyEls[i].value || 0), sold: 0 }); }
  if (!name || !price || sizes.length === 0) { alert('Enter at least one size'); return; }
  await fetch(API + '/dresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, price, photo, sizes }) });
  alert('Dress added!'); await loadDresses(); showTab('shop');
}
function renderDashboard() {
  let totalDresses = dresses.length;
  let totalSold = dresses.reduce((a, d) => a + d.sizes.reduce((b, s) => b + s.sold, 0), 0);
  let totalRevenue = dresses.reduce((a, d) => a + d.sizes.reduce((b, s) => b + (s.sold * d.price), 0), 0);
  let el = document.getElementById('dashboardContent');
  if (el) el.innerHTML = `<p><b>Total Dresses:</b> ${totalDresses}</p><p><b>Total Sold:</b> ${totalSold}</p><p><b>Total Revenue:</b> ₦${totalRevenue.toLocaleString()}</p><p><b>Total Pages (20 per page):</b> ${Math.ceil(totalDresses/20)}</p>`;
}

// --- POS SCANNER ---
let html5QrCode = null;
let isScanning = false;
function startScan(){
  if(isScanning) return;
  let resultEl = document.getElementById('scanResult');
  resultEl.innerText = "Starting camera... allow permission";
  html5QrCode = new Html5Qrcode("reader");
  isScanning = true;
  html5QrCode.start(
    {facingMode:"environment"},
    {fps:10, qrbox:{width:250, height:250}},
    (decodedText)=>{
      resultEl.innerText = "Found! Opening dress...";
      stopScan();
      // Handle: https://site/#dress-123  OR  dress-123  OR  123
      let id = null;
      if(decodedText.includes('dress-')) id = decodedText.split('dress-')[1].split(/[^0-9]/)[0];
      else if(/^\d+$/.test(decodedText.trim())) id = decodedText.trim();
      if(id) openDetail(parseInt(id));
      else alert("Scanned but no dress ID: "+decodedText);
    },
    (error)=>{ /* ignore scan errors */ }
  ).catch(err=>{
    isScanning = false;
    alert("Camera error: "+err+"\n\n1. Use HTTPS link\n2. Allow camera\n3. Try Chrome on phone");
  });
}
function stopScan(){
  if(html5QrCode && isScanning){
    isScanning = false;
    html5QrCode.stop().then(()=>{ try{html5QrCode.clear();}catch(e){} }).catch(()=>{});
  }
}

loadDresses();