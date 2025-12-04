const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  type: String, // install|miniapp|ads|join|game
  reward: { type: Number, default: 0 },
  target: String,
  promoCode: String,
  mandatory: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Task', taskSchema);