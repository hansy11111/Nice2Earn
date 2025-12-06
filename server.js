require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const User = require('./models/User');
const Task = require('./models/Task');
const Transaction = require('./models/Transaction');

const path = require("path");
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve TON Manifest
app.get('/tonconnect-manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'tonconnect-manifest.json'));
});

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('Mongo connect error', err));

// Telegram Bot (polling ok initially)
let bot = null;
if (process.env.TOKEN) {
  bot = new TelegramBot(process.env.TOKEN, { polling: true });

  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match)=>{
    const chatId = String(msg.chat.id);
    const referral = match && match[1] ? match[1] : null;
    let user = await User.findOne({ telegramId: chatId });
    if (!user) {
      const code = 'U' + Math.floor(10000 + Math.random() * 90000);
      user = new User({
        telegramId: chatId,
        username: msg.from?.username || '',
        firstName: msg.from?.first_name || '',
        referralCode: code,
        referredBy: referral || null
      });
      await user.save();
    } else if (!user.referredBy && referral) {
      user.referredBy = referral;
      await user.save();
    }

    bot.sendMessage(chatId, 'Open Nice2Earn', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Open Nice2Earn', web_app: { url: process.env.FRONTEND_URL } }]
        ]
      }
    });
  });

  // optional: listen for web_app_data
  bot.on('web_app_data', (msg) => {
    console.log('web_app_data', msg.from?.id, msg.web_app_data?.data);
  });
}

// helper get/create
async function getOrCreateUser(tgId, info = {}) {
  tgId = String(tgId);
  let user = await User.findOne({ telegramId: tgId });
  if (!user) {
    const code = 'U' + Math.floor(10000 + Math.random() * 90000);
    user = new User({ telegramId: tgId, referralCode: code, ...info });
    await user.save();
  }
  return user;
}

// routes
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/register', async (req, res) => {
  const { telegramId, username, firstName, ref } = req.body;
  const user = await getOrCreateUser(telegramId, { username, firstName });
  if (ref && !user.referredBy) {
    user.referredBy = ref;
    await user.save();
  }
  res.json({ ok: true, user });
});

app.get('/api/tasks', async (req, res) => {
  const tasks = await Task.find({ active: true }).lean();
  res.json({ ok: true, tasks });
});

app.get('/api/checkMandatory/:telegramId', async (req, res) => {
  const user = await User.findOne({ telegramId: String(req.params.telegramId) });
  res.json({ mandatory: user ? !!user.mandatoryDone : false });
});

app.post('/api/verifyMandatory', async (req, res) => {
  const { telegramId, promoCode } = req.body;
  if (!telegramId) return res.status(400).json({ success: false, error: 'No telegramId' });
  const user = await getOrCreateUser(telegramId);
  const right = (process.env.PROMO_CODE || 'NICEARY').toUpperCase();
  if (promoCode && promoCode.trim().toUpperCase() === right) {
    user.mandatoryDone = true;
    await user.save();
    return res.json({ success: true, mandatory: true });
  }
  return res.json({ success: false, mandatory: false });
});

app.post('/api/earn', async (req, res) => {
  const { telegramId, taskId } = req.body;
  if (!telegramId || !taskId) return res.status(400).json({ error: 'Missing params' });
  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // prevent double claim
  const dup = await Transaction.findOne({ telegramId: String(telegramId), 'meta.taskId': taskId });
  if (dup) return res.status(400).json({ error: 'Already claimed' });

  const user = await getOrCreateUser(telegramId);
  user.balance += (task.reward || 0);
  await user.save();

  await Transaction.create({
    telegramId: String(telegramId),
    type: 'earn',
    amount: task.reward || 0,
    status: 'done',
    meta: { taskId }
  });

  // referral bonus
  if (user.referredBy) {
    const inviter = await User.findOne({ referralCode: user.referredBy });
    if (inviter) {
      const pct = Number(process.env.REFERRAL_COMMISSION_PERCENT || 10);
      const bonus = Math.floor((task.reward || 0) * pct / 100);
      if (bonus > 0) {
        inviter.balance += bonus;
        await inviter.save();
        await Transaction.create({
          telegramId: inviter.telegramId,
          type: 'earn',
          amount: bonus,
          status: 'done',
          meta: { fromReferral: user.telegramId, taskId }
        });
      }
    }
  }

  res.json({ success: true, balance: user.balance });
});

app.post('/api/withdraw', async (req, res) => {
  const { telegramId, amount, wallet } = req.body;
  const user = await getOrCreateUser(telegramId);
  const amt = Number(amount || 0);
  if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (user.balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

  user.balance -= amt;
  await user.save();

  await Transaction.create({
    telegramId: user.telegramId,
    type: 'withdraw',
    amount: amt,
    wallet,
    status: 'pending'
  });

  // notify owner if configured
  if (bot && process.env.OWNER_CHAT_ID) {
    bot.sendMessage(process.env.OWNER_CHAT_ID, `Withdraw requested: ${user.telegramId} amount ${amt} wallet: ${wallet}`);
  }

  res.json({ success: true, balance: user.balance });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on port', PORT));
