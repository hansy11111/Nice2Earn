const mongoose = require('mongoose');

const trxSchema = new mongoose.Schema({
  telegramId: String,
  type: String, // earn|withdraw
  amount: Number,
  status: { type: String, default: 'pending' }, // pending|done|rejected
  wallet: String,
  meta: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', trxSchema);