const API_BASE = "https://nice2earn-production.up.railway.app";
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let uid = null;
if (tg) {
  uid = String(tg.initDataUnsafe?.user?.id || '');
  document.getElementById('installLink').href = (window.NICEGRAM_LINK || '') || 'https://t.me/NicegramConnectBot?start=ee8c21833f0a475798ccdff9278bfe57bad849154baeb7316a5d31995c94e767';
  // auto register on open
  if (uid) {
    fetch(`${BACKEND}/api/register`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ telegramId: uid, username: tg.initDataUnsafe.user.username, firstName: tg.initDataUnsafe.user.first_name })
    });
    checkMandatory();
  }
} else {
  // fallback for testing in browser: prompt for telegramId
  uid = prompt('Masukkan test telegramId (angka)') || '';
  checkMandatory();
}

async function checkMandatory(){
  if (!uid) return;
  const res = await fetch(`${BACKEND}/api/checkMandatory/${uid}`);
  const j = await res.json();
  if (!j.mandatory) {
    document.getElementById('mandatory-panel').style.display = 'block';
    document.getElementById('main-panel').style.display = 'none';
    // set install link from env if available
    document.getElementById('installLink').href = window.NICEGRAM_LINK || 'https://t.me/NicegramConnectBot?start=ee8c21833f0a475798ccdff9278bfe57bad849154baeb7316a5d31995c94e767';
  } else {
    document.getElementById('mandatory-panel').style.display = 'none';
    document.getElementById('main-panel').style.display = 'block';
    loadTasks();
    loadBalance();
  }
}

async function verifyMandatory(){
  const code = document.getElementById('promoInput').value.trim();
  if (!uid) return alert('No uid');
  const res = await fetch(`${BACKEND}/api/verifyMandatory`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ telegramId: uid, promoCode: code })
  });
  const j = await res.json();
  if (j.success) {
    alert('Verified! You can now access tasks.');
    checkMandatory();
  } else {
    alert('Kode promo salah atau verifikasi gagal.');
  }
}

async function loadTasks(){
  const res = await fetch(`${BACKEND}/api/tasks`);
  const j = await res.json();
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  (j.tasks || []).forEach(t=>{
    const el = document.createElement('div');
    el.className = 'task';
    el.innerHTML = `<b>${t.title}</b><div>Reward: ${t.reward}</div>
      <div><button onclick="openTask('${t._id}','${encodeURIComponent(t.target)}')">Open</button></div>`;
    list.appendChild(el);
  });
}

async function loadBalance(){
  const res = await fetch(`${BACKEND}/api/register`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ telegramId: uid })
  });
  const j = await res.json();
  if (j.user) document.getElementById('balance').innerText = j.user.balance || 0;
}

function openTask(id, encodedUrl){
  const url = decodeURIComponent(encodedUrl);
  // open telegram link
  window.open(url, '_blank');
  // wait and allow user to claim
  setTimeout(()=>claim(id), 2000);
}

async function claim(taskId){
  const res = await fetch(`${BACKEND}/api/earn`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ telegramId: uid, taskId })
  });
  const j = await res.json();
  if (j.success) {
    document.getElementById('balance').innerText = j.balance;
    if (tg) tg.showAlert('Reward credited: ' + (j.balance));
  } else {
    if (tg) tg.showAlert(j.error || 'Claim failed');
    else alert(j.error || 'Claim failed');
  }
}
