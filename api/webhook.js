// Endpoint Webhook iPaymu (Versi Final & Pasti)
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

    console.log('Webhook iPaymu Masuk:', { status, trxId, buyerEmail });

    // 1. Validasi status sukses standar iPaymu
    if ((status === 'berhasil' || status === '1' || status === 1 || status === 'paid') && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const now = new Date();

      // 2. Tambah / Perpanjang 25 hari ke pembeli di tabel users
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (!targetUser) {
        const newExpiry = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
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

      // 3. Catat riwayat ke tabel transactions
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

      // 4. Tambah bonus +7 hari ke pemilik kode referral di tabel users
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

            console.log(`Bonus +7 hari masuk ke: ${inviter.email}`);
          }
        } catch (refErr) {
          console.error('Error proses bonus referral:', refErr);
        }
      }

      return res.status(200).json({ success: true, message: 'VIP Aktif & Referral Berhasil' });
    }

    return res.status(200).json({ success: true, message: 'Status belum berhasil' });
  } catch (err) {
    console.error('Error webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
