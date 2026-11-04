// ========================================================
// ENDPOINT WEBHOOK IPAYMU (PURE CREDIT PASS SYSTEM + TELEGRAM NOTIF)
// File: api/webhook.js
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9252779286:AAHx2vJDriBFObHfUSzEowhnW8d4hLkn1qw';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1004418697839';
  const TELEGRAM_THREAD_ID = process.env.TELEGRAM_THREAD_ID || '1404';

  if (!SUPABASE_KEY) {
    console.error('❌ Service Role Key Supabase belum disetel di Environment Variables Vercel!');
    return res.status(500).json({ success: false, message: 'Service Role Key Supabase belum disetel.' });
  }

  try {
    const payload = req.body || {};
    console.log('--- RAW PAYLOAD IPAYMU MASUK ---', JSON.stringify(payload));
    
    const statusText = (payload.status || '').toString().toLowerCase();
    const statusCode = String(payload.status_code || payload.statusCode || '');
    const trxId = String(payload.trx_id || payload.transactionId || payload.sid || '').trim();
    
    // Ambil nominal dari berbagai kemungkinan parameter iPaymu
    let amount = Number(payload.amount || payload.total || payload.sub_total || 0);
    
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail.includes('===') ? rawEmail.split('===')[0] : rawEmail;
    buyerEmail = (buyerEmail || '').toLowerCase().trim();

    const isSuccess = (
      statusText === 'berhasil' || 
      statusText === 'sukses' || 
      statusText === 'paid' || 
      statusCode === '1'
    );
    
    if (!isSuccess) {
      return res.status(200).json({ success: true, message: 'Menunggu status berhasil.' });
    }

    if (!buyerEmail) {
      console.error('❌ Identifier email/reference_id kosong dari payload iPaymu');
      return res.status(400).json({ success: false, message: 'Email atau Reference ID tidak ditemukan.' });
    }

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 1. CARI USER ID DI SUPABASE
    let finalUserId = null;

    // Cari via profiles
    try {
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(buyerEmail)}&select=id`, { headers });
      const profileJson = await profileRes.json();
      if (Array.isArray(profileJson) && profileJson.length > 0 && profileJson[0]?.id) {
        finalUserId = profileJson[0].id;
      }
    } catch (e) {}

    // Fallback: Cari langsung di auth.users
    if (!finalUserId) {
      try {
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
        const authJson = await authRes.json();
        const foundAuth = authJson?.users?.find(u => u.email?.toLowerCase() === buyerEmail);
        if (foundAuth && foundAuth.id) {
          finalUserId = foundAuth.id;
        }
      } catch (e) {}
    }

    if (!finalUserId) {
      console.error(`❌ User ${buyerEmail} tidak ditemukan di auth maupun profiles!`);
      return res.status(404).json({ success: false, message: `User ${buyerEmail} tidak ditemukan.` });
    }

    // 2. TENTUKAN PENAMBAHAN KREDIT
    let kreditTambah = 0;

    if (amount >= 2000 && amount < 4500) {
      kreditTambah = 4;
    } else if (amount >= 4500 && amount <= 8000) {
      kreditTambah = 10;
    } else if (amount > 8000 && amount <= 18000) {
      kreditTambah = 20;
    } else if (amount > 18000) {
      kreditTambah = 75;
    } else {
      // Jaring pengaman: Jika amount terbaca 0, cek deskripsi teks pembelian
      const itemDesc = (payload.buyer_name || payload.name || payload.description || '').toLowerCase();
      if (itemDesc.includes('4')) kreditTambah = 4;
      else if (itemDesc.includes('10')) kreditTambah = 10;
      else if (itemDesc.includes('20')) kreditTambah = 20;
      else kreditTambah = 4; // Default minimal transaksi berhasil
    }

    // 3. INJEKSI SALDO KE TABEL user_credits (DENGAN MASA AKTIF)
    const exp24Jam = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    try {
      const credRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}&select=*`, { headers });
      const credRows = await credRes.json();

      if (Array.isArray(credRows) && credRows.length > 0) {
        const saldoLama = Number(credRows[0].credits_balance) || 0;
        await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ 
            credits_balance: saldoLama + kreditTambah, 
            expires_at: exp24Jam 
          })
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            user_id: finalUserId, 
            credits_balance: kreditTambah, 
            expires_at: exp24Jam 
          })
        });
      }
    } catch (errCredit) {
      console.error('Gagal update user_credits:', errCredit.message);
    }

    // 4. SINKRONISASI KE TABEL profiles (AGAR FRONTEND LANGSUNG TAMPIL SALDO BARU)
    try {
      const getProf = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${finalUserId}&select=credits`, { headers });
      const profData = await getProf.json();
      if (Array.isArray(profData) && profData.length > 0 && profData[0].credits !== undefined) {
        const saldoProfileLama = Number(profData[0].credits) || 0;
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${finalUserId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ credits: saldoProfileLama + kreditTambah })
        });
      }
    } catch (e) {}

    // 5. CATAT LOG TRANSAKSI
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: String(finalUserId),
          trx_id: String(trxId || Date.now()),
          amount: amount || 2800,
          status: 'BERHASIL'
        })
      });
    } catch (e) {}

    // 6. KIRIM NOTIFIKASI TELEGRAM
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const waktuWita = new Date().toLocaleString('id-ID', { 
          timeZone: 'Asia/Makassar',
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        const pesanNotif = 
`🔔 <b>PEMBAYARAN DITERIMA</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Member:</b> <code>${buyerEmail}</code>
⚡ <b>Topup:</b> +${kreditTambah} Kredit Video (Aktif 24 Jam)
💰 <b>Total Bayar:</b> Rp ${Number(amount || 2800).toLocaleString('id-ID')}
🆔 <b>Trx ID:</b> <code>${trxId || '-'}</code>
⏱ <b>Waktu:</b> ${waktuWita} WITA
━━━━━━━━━━━━━━━━━━━━
✅ <i>Kredit telah otomatis aktif di akun member.</i>`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            message_thread_id: Number(TELEGRAM_THREAD_ID),
            text: pesanNotif,
            parse_mode: 'HTML'
          })
        });
      } catch (tgErr) {}
    }

    return res.status(200).json({ 
      success: true, 
      message: `Berhasil menambahkan +${kreditTambah} kredit ke user ${buyerEmail}` 
    });

  } catch (err) {
    console.error('❌ Webhook Crash:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
