const BACKEND_URL = "https://nice2earn-production.up.railway.app";
const tg = window.Telegram.WebApp;

// TON CONNECT UI
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://nice2earn-production.up.railway.app/tonconnect-manifest.json",
  buttonRootId: "ton-connect"
});

// Global user data
let userId = tg.initDataUnsafe.user?.id || tg.initDataUnsafe.user?.id || 0;
let walletAddress = null;

// When wallet connected
tonConnectUI.onStatusChange(async (wallet) => {
  if (!wallet) return;
  walletAddress = wallet.account.address;
  console.log("Wallet connected:", walletAddress);
});

// Load user & tasks
async function loadUser() {
  const res = await fetch(`${BACKEND_URL}/api/user/${userId}`);
  const data = await res.json();

  if (!data.mandatoryDone) {
    document.getElementById("mandatory-box").classList.remove("hidden");
  } else {
    loadTasks();
  }

  updateBalance(data.balance || 0);
}

async function loadTasks() {
  const res = await fetch(`${BACKEND_URL}/api/tasks`);
  const tasks = await res.json();

  const box = document.getElementById("tasks");
  box.innerHTML = "";

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card";

    card.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <a class="btn" href="${task.link}" target="_blank">Go</a>
      <button class="btn-outline" onclick="completeTask('${task.id}')">Complete</button>
    `;

    box.appendChild(card);
  });
}

async function completeTask(taskId) {
  const res = await fetch(`${BACKEND_URL}/api/earn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: userId,
      taskId
    })
  });

  const data = await res.json();
  updateBalance(data.balance);
}

document.getElementById("mandatory-done").addEventListener("click", async () => {
  await fetch(`${BACKEND_URL}/api/user/${userId}/mandatory`, { method: "POST" });
  document.getElementById("mandatory-box").classList.add("hidden");
  loadTasks();
});

function updateBalance(val) {
  document.getElementById("balance").innerText = val;
}

loadUser();
