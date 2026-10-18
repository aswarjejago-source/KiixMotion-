// ========================================================
// ENDPOINT WEBHOOK IPAYMU (KREDIT 24 JAM & VIP PRO TERPADU)
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

      // 2. Ambil data pembeli dari tabel users
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      // Deteksi ID pengguna di Supabase Auth (UUID)
      let authUserId = null;
      try {
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const authJson = await authRes.json();
        const foundAuth = authJson?.users?.find(u => u.email?.toLowerCase() === buyerEmail);
        if (foundAuth && foundAuth.id) {
          authUserId = foundAuth.id;
        }
      } catch (eAuth) {}

      // Jika user belum ada di tabel public.users, buatkan barisnya
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

      const finalUserId = authUserId || (targetUser ? targetUser.id : null);

      // 3. IDENTIFIKASI PAKET BERDASARKAN NOMINAL PEMBAYARAN
      const isPaket13 = (amount >= 4500 && amount <= 8000);   // Tagihan Rp 5.800
      const isPaket25 = (amount > 8000 && amount <= 18000);    // Tagihan Rp 10.800
      const isPaketVIP = (amount > 18000) || (!isPaket13 && !isPaket25); // Tagihan Rp 35.850 (Pro VIP)

      // ======================================================
      // EKSEKUSI A: JIKA PEMBELIAN PAKET KREDIT 24 JAM (13 / 25)
      // ======================================================
      if ((isPaket13 || isPaket25) && finalUserId) {
        const jumlahKreditTambah = isPaket13 ? 13 : 25;
        const exp24Jam = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

        // Panggil fungsi database tambah_kredit_member
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/rpc/tambah_kredit_member`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              target_user_id: finalUserId,
              jumlah_kredit: jumlahKreditTambah
            })
          });
        } catch (eRpc) {}

        // Fallback langsung upsert ke tabel user_credits agar 100% masuk
        try {
          const credCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}&select=*`, { headers });
          const credRows = await credCheckRes.json();
          let currentBalance = (credRows && credRows.length > 0) ? (credRows[0].credits_balance || 0) : 0;
          let newBalance = currentBalance + jumlahKreditTambah;

          await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              user_id: finalUserId,
              credits_balance: newBalance,
              expires_at: exp24Jam,
              updated_at: now.toISOString()
            })
          });
          console.log(`Berhasil menambahkan ${jumlahKreditTambah} kredit ke user: ${buyerEmail}`);
        } catch (eCred) {
          console.error('Gagal upsert user_credits:', eCred);
        }
      }

      // ======================================================
      // EKSEKUSI B: JIKA PEMBELIAN PAKET PRO VIP (25 HARI)
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
        console.log(`VIP Pro 25 hari aktif untuk user: ${buyerEmail}`);
      }

      // 4. Catat riwayat ke tabel transactions
      if (targetUser && targetUser.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: targetUser.id,
            trx_id: String(trxId || Date.now()),
            amount: amount,
            status: 'BERHASIL'
          })
        });
      }

      // 5. Tambah bonus +7 hari ke pemilik referral jika ada
      if (targetUser && targetUser.referred_by) {
        try {
          const inviterRes = await fetch(`${SUPABASE_URL}/rest/v1/users?referral_code=eq.${encodeURIComponent(targetUser.referred_by)}&select=*`, { headers });
          const inviters = await inviterRes.json();
          const inviter = inviters && inviters.length > 0 ? inviters[0] : null;

          if (inviter) {
            const invCurrentExp = inviter.vip_expires_at && new Date(inviter.vip_expires_at) > now
              ? new Date(inviter.vip_expires_at)
              : now;
            const invNewExp = new Date(invCurrentExp.getTime() + 7 * 24 * 60 * 60 * 1000);

            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${inviter.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                is_vip: true,
                vip_expires_at: invNewExp.toISOString()
              })
            });
            console.log(`Bonus +7 hari masuk ke referral: ${inviter.email}`);
          }
        } catch (refErr) {
          console.error('Error proses bonus referral:', refErr);
        }
      }

      return res.status(200).json({ success: true, message: 'Pembayaran berhasil diproses otomatis' });
    }

    return res.status(200).json({ success: true, message: 'Status pembayaran belum berhasil' });
  } catch (err) {
    console.error('Error webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
