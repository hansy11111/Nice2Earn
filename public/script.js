const BACKEND_URL = "https://nice2earn-production.up.railway.app";

const tg = window.Telegram.WebApp;
tg.expand();

document.getElementById('connectBtn').onclick = connectTONWallet;

async function connectTONWallet() {
  if (!window.ton) {
    alert("TON Wallet tidak ditemukan");
    return;
  }

  const provider = window.ton;
  await provider.connect();
  const address = provider.account.address;

  document.getElementById("walletAddress").innerText = address;
}

async function initApp() {
  const user = tg.initDataUnsafe?.user;
  if (!user) return alert("Telegram tidak mengirim data user");

  const userId = user.id;

  try {
    const res = await fetch(`${BACKEND_URL}/api/user/${userId}`);
    const data = await res.json();

    // Mandatory belum selesai
    if (!data.mandatoryDone) {
      document.getElementById("mandatoryTask").classList.remove("hidden");
      return;
    }

    loadTasks();
  } catch (err) {
    console.error(err);
    alert("Gagal mengambil data user dari backend");
  }
}

document.getElementById("confirmMandatory").onclick = async () => {
  const user = tg.initDataUnsafe.user;
  const userId = user.id;

  try {
    await fetch(`${BACKEND_URL}/api/mandatory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: userId })
    });

    document.getElementById("mandatoryTask").classList.add("hidden");
    loadTasks();
  } catch (err) {
    console.error(err);
    alert("Gagal set mandatory task");
  }
};

async function loadTasks() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tasks`);
    const tasks = await res.json();

    const list = document.getElementById("tasks");
    list.innerHTML = "";

    tasks.forEach(t => {
      const el = document.createElement("div");
      el.classList.add("card");
      el.innerHTML = `
        <p>${t.title}</p>
        <a class="btn" href="${t.url}" target="_blank">Open</a>
        <button class="btn success" onclick="claimTask('${t.id}')">Saya Sudah Selesai</button>
      `;
      list.appendChild(el);
    });

    document.getElementById("taskList").classList.remove("hidden");

  } catch (err) {
    console.error(err);
    alert("Gagal mengambil tasks");
  }
}

async function claimTask(taskId) {
  const user = tg.initDataUnsafe.user;
  const userId = user.id;

  try {
    const res = await fetch(`${BACKEND_URL}/api/earn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: userId, taskId })
    });

    const data = await res.json();
    updateBalance(data.balance);
  } catch (err) {
    console.error(err);
    alert("Gagal klaim task");
  }
}

function updateBalance(bal) {
  document.getElementById("balance").innerText = bal;
}

initApp();
