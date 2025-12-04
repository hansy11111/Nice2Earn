require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');

const tasks = [
  { title: 'Install Nicegram (MANDATORY)', type:'install', reward:0, target: process.env.NICEGRAM_REF_LINK, promoCode: process.env.PROMO_CODE, mandatory:true, active:true },
  { title:'GiftFest', type:'miniapp', reward:15, target:'https://t.me/giftfest_bot/app?startapp=UkM9MDAwMDA2eXpwSmkmUlM9aW52aXRlX2ZyaWVuZA%3D%3D', active:true },
  { title:'Panda Fit', type:'miniapp', reward:12, target:'https://t.me/PandaFiT_bot/PandaFiT?startapp=rId6398112426', active:true },
  { title:'Tower', type:'miniapp', reward:10, target:'https://t.me/TowerTon_bot?start=6398112426', active:true },
  { title:'Bounty Hash', type:'miniapp', reward:15, target:'https://t.me/bounty_hash_bot/mining?startapp=5191333608', active:true },
  { title:'TON Station', type:'miniapp', reward:18, target:'https://t.me/tonstationgames_bot/app?startapp=ref_qrvv3dnqhdcxrcwwaq9kzx', active:true },
  { title:'Puparty', type:'miniapp', reward:15, target:'https://t.me/puparty_bot/index?startapp=17720009', active:true }
];

const users = [
  { telegramId: '111111', username:'alice', firstName:'Alice', balance:50, referralCode:'ALICE123' },
  { telegramId: '222222', username:'bob', firstName:'Bob', balance:20, referralCode:'BOB456', referredBy:'ALICE123' }
];

(async()=>{
  try{
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true });
    await Task.deleteMany({});
    await User.deleteMany({});
    await Task.insertMany(tasks);
    await User.insertMany(users);
    console.log('Seed complete');
    process.exit(0);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();