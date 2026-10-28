// ========================================================
// ENDPOINT WEBHOOK IPAYMU (PURE CREDIT PASS SYSTEM)
// File: api/webhook.js
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SUPABASE_KEY) {
    return res.status(500).json({ success: false, message: 'Service Role Key Supabase belum disetel di Vercel.' });
  }

  try {
    const payload = req.body || {};
    
    const statusText = (payload.status || '').toString().toLowerCase();
    const statusCode = payload.status_code || payload.statusCode; 
    const trxId = String(payload.trx_id || payload.transactionId || payload.sid || '').trim();
    const amount = Number(payload.amount || payload.total || 0);
    
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail.includes('===') ? rawEmail.split('===')[0] : rawEmail;
    buyerEmail = (buyerEmail || '').toLowerCase().trim();

    console.log('--- IPAYMU WEBHOOK MASUK ---');
    console.log('Data Transaksi:', { statusText, statusCode, trxId, amount, buyerEmail });

    // Deteksi status lunas dari iPaymu
    const isSuccess = (
      statusText === 'berhasil' || 
      statusText === 'sukses' || 
      statusText === 'paid' || 
      statusCode === '1' || 
      statusCode === 1
    );
    
    if (isSuccess && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // 1. CEK ANTI-DOBEL TRANSAKSI (IDEMPOTENCY SHIELD)
      if (trxId) {
        try {
          const checkTrxRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?trx_id=eq.${encodeURIComponent(trxId)}&status=eq.BERHASIL&select=id`, { headers });
          const checkTrxData = await checkTrxRes.json();
          if (Array.isArray(checkTrxData) && checkTrxData.length > 0) {
            console.log(`⚠️ Transaksi ${trxId} sudah pernah diproses sebelumnya. Dilewati.`);
            return res.status(200).json({ success: true, message: 'Transaksi sudah diproses sebelumnya.' });
          }
        } catch (e) {}
      }

      let finalUserId = null;

      // 2. CARI UUID LANGSUNG DI public.profiles (PINTU UTAMA SATU-SATUNYA)
      try {
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(buyerEmail)}&select=id`, { headers });
        const profileJson = await profileRes.json();
        if (Array.isArray(profileJson) && profileJson.length > 0 && profileJson[0]?.id) {
          finalUserId = profileJson[0].id;
          console.log('✅ UUID ditemukan langsung di public.profiles:', finalUserId);
        }
      } catch (e) {}

      // Fallback: Cek di auth.users Supabase jika entah kenapa belum terdaftar di profiles
      if (!finalUserId) {
        try {
          const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
          const authJson = await authRes.json();
          const foundAuth = authJson?.users?.find(u => u.email?.toLowerCase() === buyerEmail);
          if (foundAuth && foundAuth.id) {
            finalUserId = foundAuth.id;
            console.log('✅ UUID ditemukan di auth.users:', finalUserId);
          }
        } catch (e) {}
      }

      if (!finalUserId) {
        console.error(`❌ User ${buyerEmail} tidak ditemukan di sistem!`);
        return res.status(404).json({ success: false, message: 'User tidak ditemukan di database profiles.' });
      }

      // 3. HITUNG PENAMBAHAN KREDIT BERDASARKAN NOMINAL
      let kreditTambah = 0;

      if (amount >= 2000 && amount < 4500) {
        kreditTambah = 4;   // Paket 2k (Rp 2.800)
      } else if (amount >= 4500 && amount <= 8000) {
        kreditTambah = 10;  // Paket 5k (Rp 5.800)
      } else if (amount > 8000 && amount <= 18000) {
        kreditTambah = 20;  // Paket 10k (Rp 10.800)
      } else if (amount > 18000) {
        kreditTambah = 75;  // Konversi jika nominal di atas paket normal
      }

      // 4. INJEKSI SALDO KE TABEL user_credits (MASA AKTIF 24 JAM)
      if (kreditTambah > 0) {
        const exp24Jam = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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

        console.log(`⚡ SUKSES: Menambahkan ${kreditTambah} kredit ke user ${buyerEmail} (ID: ${finalUserId})`);
      }

      // 5. CATAT LOG TRANSAKSI BERHASIL
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

      return res.status(200).json({ 
        success: true, 
        message: `Webhook sukses diproses. +${kreditTambah} kredit diberikan ke user ${finalUserId}` 
      });
    }

    return res.status(200).json({ success: true, message: 'Menunggu status lunas.' });

  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
