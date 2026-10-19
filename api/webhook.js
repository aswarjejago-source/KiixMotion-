// ========================================================
// ENDPOINT WEBHOOK IPAYMU (PASTI MASUK TANPA SYARAT DATABASE)
// File: api/notify.js
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    const payload = req.body || {};
    const status = payload.status; 
    const trxId = payload.trx_id || payload.transactionId;
    const amount = Number(payload.amount || payload.total || 0);
    
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail;
    if (rawEmail && rawEmail.includes('===')) {
        buyerEmail = rawEmail.split('===')[0];
    }
    buyerEmail = (buyerEmail || '').toLowerCase().trim();

    console.log('Webhook iPaymu Masuk:', { status, trxId, amount, buyerEmail });

    const isSuccess = (status === 'berhasil' || status === '1' || status === 1 || status === 'paid');
    if (isSuccess && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const now = new Date();

      // 1. Ambil data user dari tabel public.users
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (!targetUser) {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: buyerEmail, is_vip: false })
        });
        const insertData = await insertRes.json();
        targetUser = insertData && insertData.length > 0 ? insertData[0] : null;
      }

      const finalUserId = targetUser ? targetUser.id : null;
      if (!finalUserId) {
        return res.status(200).json({ success: false, message: 'User ID tidak ditemukan' });
      }

      // 2. Deteksi nominal paket
      const isPaket4   = (amount >= 2000 && amount < 4500);   // Rp 2.800 -> 4 Kredit
      const isPaket10  = (amount >= 4500 && amount <= 8000);  // Rp 5.800 -> 10 Kredit
      const isPaket20  = (amount > 8000 && amount <= 18000);  // Rp 10.800 -> 20 Kredit
      const isPaketVIP = (amount > 18000);                    // Rp 35.850 -> VIP Pro

      // 3. Eksekusi penambahan kredit (Logika PATCH / POST Murni)
      if (isPaket4 || isPaket10 || isPaket20) {
        const jumlahKreditTambah = isPaket4 ? 4 : (isPaket10 ? 10 : 20);
        const exp24Jam = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

        // Cek data kredit saat ini
        const credCheck = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${encodeURIComponent(finalUserId)}&select=*`, { headers });
        const credRows = await credCheck.json();

        if (Array.isArray(credRows) && credRows.length > 0) {
          // JIKA SUDAH ADA: LAKUKAN PATCH (UPDATE)
          let currentExp = new Date(credRows[0].expires_at || 0);
          let newExp = currentExp > now ? new Date(currentExp.getTime() + 24 * 60 * 60 * 1000).toISOString() : exp24Jam;
          let newBalance = (credRows[0].credits_balance || 0) + jumlahKreditTambah;

          await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${encodeURIComponent(finalUserId)}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              credits_balance: newBalance,
              expires_at: newExp,
              updated_at: now.toISOString()
            })
          });
          console.log(`Berhasil PATCH ${jumlahKreditTambah} kredit ke user_id: ${finalUserId}`);
        } else {
          // JIKA BELUM ADA: LAKUKAN POST (INSERT BARU)
          await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: String(finalUserId),
              credits_balance: jumlahKreditTambah,
              expires_at: exp24Jam,
              updated_at: now.toISOString()
            })
          });
          console.log(`Berhasil POST baris baru ${jumlahKreditTambah} kredit ke user_id: ${finalUserId}`);
        }
      }

      // 4. Eksekusi VIP Pro
      if (isPaketVIP && targetUser) {
        const currentExp = targetUser.vip_expires_at && new Date(targetUser.vip_expires_at) > now
          ? new Date(targetUser.vip_expires_at)
          : now;
        const newExp = new Date(currentExp.getTime() + 25 * 24 * 60 * 60 * 1000);

        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${targetUser.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ is_vip: true, vip_expires_at: newExp.toISOString() })
        });
      }

      // 5. Catat riwayat transaksi
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: String(finalUserId),
          trx_id: String(trxId || Date.now()),
          amount: amount,
          status: 'BERHASIL'
        })
      });

      return res.status(200).json({ success: true, message: 'Kredit berhasil masuk otomatis' });
    }

    return res.status(200).json({ success: true, message: 'Status belum berhasil' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
