# Nice2Earn (backend + static frontend)

Repo: hansy11111/Nice2Earn

Deskripsi singkat:
- Express + MongoDB backend untuk task/earn/withdraw.
- Telegram bot listener (opsional) untuk /start dan notifikasi withdraw.
- Static frontend di `public/` (index.html + app.js) sebagai Telegram Web App.

Environment variables (set di Railway / hosting):
- MONGODB_URI - connection string MongoDB
- FRONTEND_URL - URL front-end (untuk tombol web_app di bot)
- TOKEN - Telegram bot token (opsional)
- PROMO_CODE - kode promo (default NICEARY)
- NICEGRAM_REF_LINK - link referral Nicegram (dipakai di seed)
- OWNER_CHAT_ID - chat id menerima notifikasi withdraw (opsional)
- REFERRAL_COMMISSION_PERCENT - persen komisI, default 10
- PORT - optional

Cara menjalankan (lokal):
1. npm install
2. Buat file .env dan isi MONGODB_URI (dll sesuai di atas)
3. npm run seed
4. npm start
