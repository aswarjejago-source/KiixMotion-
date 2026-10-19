// ========================================================
// ENDPOINT WEBHOOK IPAYMU (4, 10 & 20 KREDIT 24 JAM + VIP PRO)
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

    // 1. Validasi status pembayaran sukses dari iPaymu
    const isSuccess = (status === 'berhasil' || status === '1' || status === 1 || status === 'paid');
    if (isSuccess && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const now = new Date();

      // 2. Ambil data pembeli dari tabel public.users
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (!targetUser) {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: buyerEmail,
            is_vip: false
          })
        });
        const insertData = await insertRes.json();
        targetUser = insertData && insertData.length > 0 ? insertData[0] : null;
      }

      const finalUserId = targetUser ? targetUser.id : null;

      if (!finalUserId) {
        return res.status(200).json({ success: false, message: 'User ID tidak ditemukan' });
      }

      // 3. IDENTIFIKASI PAKET SECARA KETAT & TEPAT
      const isPaket4   = (amount >= 2000 && amount < 4500);   // Tagihan Rp 2.800 (4 Kredit)
      const isPaket10  = (amount >= 4500 && amount <= 8000);  // Tagihan Rp 5.800 (10 Kredit)
      const isPaket20  = (amount > 8000 && amount <= 18000);  // Tagihan Rp 10.800 (20 Kredit)
      const isPaketVIP = (amount > 18000);                    // Tagihan Rp 35.850 (VIP Pro)

      // ======================================================
      // EKSEKUSI A: PAKET KREDIT 24 JAM (4, 10, atau 20)
      // ======================================================
      if (isPaket4 || isPaket10 || isPaket20) {
        const jumlahKreditTambah = isPaket4 ? 4 : (isPaket10 ? 10 : 20);
        const exp24Jam = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        let rpcSukses = false;

        // Coba jalur utama via fungsi database RPC
        try {
          const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/tambah_kredit_member`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              target_user_id: String(finalUserId),
              jumlah_kredit: jumlahKreditTambah
            })
          });
          if (rpcRes.ok) {
            rpcSukses = true;
          }
        } catch (eRpc) {}

        // Fallback langsung tulis ke tabel user_credits jika RPC belum terpasang
        if (!rpcSukses) {
          try {
            const credCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}&select=*`, { headers });
            const credRows = await credCheckRes.json();
            let currentBalance = (credRows && credRows.length > 0) ? (credRows[0].credits_balance || 0) : 0;
            let newBalance = currentBalance + jumlahKreditTambah;

            await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                user_id: String(finalUserId),
                credits_balance: newBalance,
                expires_at: exp24Jam,
                updated_at: now.toISOString()
              })
            });
          } catch (eCred) {}
        }
      }

      // ======================================================
      // EKSEKUSI B: PAKET PRO VIP (25 HARI)
      // ======================================================
      if (isPaketVIP && targetUser) {
        const currentExpiry = targetUser.vip_expires_at && new Date(targetUser.vip_expires_at) > now
          ? new Date(targetUser.vip_expires_at)
          : now;
        const updatedExpiry = new Date(currentExpiry.getTime() + 25 * 24 * 60 * 60 * 1000);

        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${targetUser.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            is_vip: true,
            vip_expires_at: updatedExpiry.toISOString()
          })
        });
      }

      // 4. Catat riwayat ke tabel transactions
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

      return res.status(200).json({ success: true, message: 'Pembayaran berhasil diproses otomatis' });
    }

    return res.status(200).json({ success: true, message: 'Status pembayaran belum berhasil' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
