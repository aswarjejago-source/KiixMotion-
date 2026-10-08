// Endpoint Webhook iPaymu (Target: public.users + Anti-Duplikat + Bonus 7 Hari)
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
    const amount = Number(payload.amount || payload.total || 35000);
    
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail;
    if (rawEmail && rawEmail.includes('===')) {
        buyerEmail = rawEmail.split('===')[0];
    }
    buyerEmail = (buyerEmail || '').toLowerCase().trim();

    console.log('Webhook diterima dari iPaymu:', { status, trxId, buyerEmail });

    // Hanya proses jika pembayaran sukses
    if ((status === 'berhasil' || status === '1' || status === 1 || status === 'paid') && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // 1. CEK ANTI-DUPLIKAT TRANSAKSI
      if (trxId) {
        const trxCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?trx_id=eq.${encodeURIComponent(String(trxId))}&status=eq.BERHASIL&select=id`, { headers });
        const existingTrx = await trxCheckRes.json();
        if (existingTrx && existingTrx.length > 0) {
          return res.status(200).json({ success: true, message: 'Transaksi ini sudah selesai diproses.' });
        }
      }

      const bonusDays = 25; // Paket pembeli 25 hari
      const now = new Date();

      // 2. CEK / INSERT PEMBELI DI TABEL USERS
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (!targetUser) {
        const newExpiry = new Date(now.getTime() + bonusDays * 24 * 60 * 60 * 1000);
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: buyerEmail,
            is_vip: true,
            vip_expires_at: newExpiry.toISOString()
          })
        });
        const insertData = await insertRes.json();
        targetUser = insertData && insertData.length > 0 ? insertData[0] : null;
      } else {
        const currentExpiry = targetUser.vip_expires_at && new Date(targetUser.vip_expires_at) > now
          ? new Date(targetUser.vip_expires_at)
          : now;
        const updatedExpiry = new Date(currentExpiry.getTime() + bonusDays * 24 * 60 * 60 * 1000);

        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${targetUser.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            is_vip: true,
            vip_expires_at: updatedExpiry.toISOString()
          })
        });
      }

      // 3. CATAT TRANSAKSI KE TABEL TRANSACTIONS
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

      // 4. EKSEKUSI BONUS REFERRAL 7 HARI (CARI DI TABEL USERS)
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

            console.log(`Bonus +7 hari berhasil masuk ke akun: ${inviter.email}`);
          }
        } catch (refErr) {
          console.error('Gagal memproses bonus referral:', refErr);
        }
      }

      return res.status(200).json({ success: true, message: 'VIP Berhasil Diaktifkan & Referral Sukses Diproses' });
    }

    return res.status(200).json({ success: true, message: 'Status transaksi belum berhasil' });
  } catch (err) {
    console.error('Error fatal di webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
