// ========================================================
// ENDPOINT WEBHOOK IPAYMU (REVISI FINAL - AUTO UPDATE VIP)
// File: api/webhook.js
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // URL dan Key Supabase
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  
  // 🚨 SANGAT PENTING: Webhook WAJIB pakai SERVICE_ROLE_KEY agar bisa bypass RLS Database!
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    const payload = req.body || {};
    
    // Nangkep format status iPaymu (bisa status text atau status_code angka)
    const statusText = (payload.status || '').toString().toLowerCase();
    const statusCode = payload.status_code || payload.statusCode; 
    const trxId = payload.trx_id || payload.transactionId || payload.sid;
    const amount = Number(payload.amount || payload.total || 0);
    
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail;
    if (rawEmail && rawEmail.includes('===')) {
        buyerEmail = rawEmail.split('===')[0];
    }
    buyerEmail = (buyerEmail || '').toLowerCase().trim();

    console.log('--- IPAYMU WEBHOOK MASUK ---');
    console.log('Data:', { statusText, statusCode, trxId, amount, buyerEmail });

    // Cek apakah pembayaran benar-benar sukses/lunas
    const isSuccess = (statusText === 'berhasil' || statusText === 'sukses' || statusText === 'paid' || statusCode === '1' || statusCode === 1);
    
    if (isSuccess && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      let finalUserId = null;

      // Cari ID User di tabel public.users berdasarkan email
      try {
        const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=id`, { headers });
        const userJson = await userRes.json();
        if (Array.isArray(userJson) && userJson.length > 0) {
            finalUserId = userJson[0].id;
            console.log('✅ User ditemukan di tabel public.users dengan ID:', finalUserId);
        }
      } catch (e) {
          console.error('❌ Gagal mencari user:', e.message);
      }

      if (!finalUserId) {
        console.error(`❌ Gagal: User dengan email ${buyerEmail} tidak ditemukan di database.`);
        return res.status(500).json({ success: false, message: 'ID User tidak ditemukan' });
      }

      // Deteksi Paket Berdasarkan Nominal
      const isPaket4   = (amount >= 2000 && amount < 4500);   
      const isPaket10  = (amount >= 4500 && amount <= 8000);  
      const isPaket20  = (amount > 8000 && amount <= 18000);  
      const isPaketVIP = (amount > 18000);                    

      // EKSEKUSI 1: UPDATE KOIN RENDER (PAKET KREDIT)
      if (isPaket4 || isPaket10 || isPaket20) {
        const kreditTambah = isPaket4 ? 4 : (isPaket10 ? 10 : 20);
        const exp24Jam = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const credRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}&select=*`, { headers });
        const credRows = await credRes.json();

        if (Array.isArray(credRows) && credRows.length > 0) {
          const saldoLama = Number(credRows[0].credits_balance) || 0;
          await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ credits_balance: saldoLama + kreditTambah, expires_at: exp24Jam })
          });
          console.log(`✅ Saldo koin diupdate: +${kreditTambah} kredit.`);
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
            method: 'POST', headers,
            body: JSON.stringify({ user_id: finalUserId, credits_balance: kreditTambah, expires_at: exp24Jam })
          });
          console.log(`✅ Saldo koin baru dibuat: ${kreditTambah} kredit.`);
        }
      }

      // EKSEKUSI 2: UPDATE MEMBER PRO VIP
      if (isPaketVIP) {
        const expVIP = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
        
        const updateVipRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${finalUserId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ is_vip: true, vip_expires_at: expVIP })
        });

        if (!updateVipRes.ok) {
            const errText = await updateVipRes.text();
            console.error('❌ Gagal Update VIP ke Supabase (Kemungkinan kena blokir RLS):', errText);
        } else {
            console.log(`✅ SUKSES! User ${buyerEmail} resmi menjadi VIP Pro.`);
        }
      }

      // EKSEKUSI 3: CATAT RIWAYAT TRANSAKSI
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

      return res.status(200).json({ success: true, message: `Webhook sukses dieksekusi untuk ID: ${finalUserId}` });
    }

    console.log('⚠️ Webhook ditangkap, tapi status belum LUNAS / email kosong.');
    return res.status(200).json({ success: true, message: 'Status belum berhasil atau email kosong.' });

  } catch (err) {
    console.error('❌ Webhook Error Crash:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
