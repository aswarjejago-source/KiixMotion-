// ========================================================
// ENDPOINT WEBHOOK IPAYMU (OTOMATIS PENUH SAAT RESEND / CHECKOUT)
// File: api/webhook.js
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

    console.log('Memproses Webhook Otomatis:', { status, trxId, amount, buyerEmail });

    const isSuccess = (status === 'berhasil' || status === '1' || status === 1 || status === 'paid');
    if (isSuccess && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const now = new Date();

      // 1. Ambil atau daftarkan ID user di tabel public.users
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=id`, { headers });
      const userJson = await userRes.json();
      let targetUserId = (userJson && userJson.length > 0) ? userJson[0].id : null;

      if (!targetUserId) {
        const createRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: buyerEmail, is_vip: false })
        });
        const createJson = await createRes.json();
        if (createJson && createJson.length > 0) targetUserId = createJson[0].id;
      }

      if (!targetUserId) {
        return res.status(500).json({ success: false, message: 'Gagal menemukan atau membuat user di database' });
      }

      // 2. Baca nominal paket
      const isPaket4   = (amount >= 2000 && amount < 4500);   // Rp 2.800 -> 4 Kredit
      const isPaket10  = (amount >= 4500 && amount <= 8000);  // Rp 5.800 -> 10 Kredit
      const isPaket20  = (amount > 8000 && amount <= 18000);  // Rp 10.800 -> 20 Kredit
      const isPaketVIP = (amount > 18000);                    // Rp 35.850 -> VIP Pro

      // 3. Tulis kredit langsung ke user_credits
      if (isPaket4 || isPaket10 || isPaket20) {
        const kreditTambah = isPaket4 ? 4 : (isPaket10 ? 10 : 20);
        const exp24Jam = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Periksa apakah baris user sudah ada
        const credRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${targetUserId}&select=*`, { headers });
        const credRows = await credRes.json();

        let dbRes;
        if (Array.isArray(credRows) && credRows.length > 0) {
          const saldoLama = Number(credRows[0].credits_balance) || 0;
          dbRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${targetUserId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              credits_balance: saldoLama + kreditTambah,
              expires_at: exp24Jam
            })
          });
        } else {
          dbRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: targetUserId,
              credits_balance: kreditTambah,
              expires_at: exp24Jam
            })
          });
        }

        const dbResText = await dbRes.text();
        if (!dbRes.ok) {
          console.error('Database menolak penulisan kredit:', dbResText);
          return res.status(500).json({ success: false, db_error: dbResText });
        }
      }

      // 4. Update VIP jika paket VIP
      if (isPaketVIP) {
        const expVIP = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${targetUserId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ is_vip: true, vip_expires_at: expVIP })
        });
      }

      // 5. Catat riwayat transaksi
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: String(targetUserId),
          trx_id: String(trxId || Date.now()),
          amount: amount,
          status: 'BERHASIL'
        })
      });

      return res.status(200).json({ 
        success: true, 
        message: `Kredit otomatis masuk ke user_id: ${targetUserId}` 
      });
    }

    return res.status(200).json({ success: true, message: 'Status belum berhasil' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
