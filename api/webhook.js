// Endpoint Webhook iPaymu (Safe Minimal Insert + Referral Bonus 7 Hari)
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
    
    // Ambil data email dari iPaymu secara dinamis
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail;
    if (rawEmail && rawEmail.includes('===')) {
        buyerEmail = rawEmail.split('===')[0];
    }

    console.log('Webhook diterima dari iPaymu:', { status, trxId, buyerEmail });

    // Hanya proses jika pembayaran sukses
    if ((status === 'berhasil' || status === '1' || status === 1 || status === 'paid') && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const bonusDays = 25; // Pembeli tetap dapat 25 hari standar
      const now = new Date();

      // 1. CEK DATA PEMBELI DI TABEL USERS
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (!targetUser) {
        // JIKA BELUM ADA: INSERT pembeli baru
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
        if (!insertRes.ok) {
          console.error('DETAIL ERROR SUPABASE INSERT:', JSON.stringify(insertData));
          return res.status(500).json({ success: false, error: insertData });
        }
        targetUser = insertData && insertData.length > 0 ? insertData[0] : null;
      } else {
        // JIKA SUDAH ADA: Perpanjang masa aktif pembeli (+25 hari)
        const currentExpiry = targetUser.vip_expires_at && new Date(targetUser.vip_expires_at) > now
          ? new Date(targetUser.vip_expires_at)
          : now;
        const updatedExpiry = new Date(currentExpiry.getTime() + bonusDays * 24 * 60 * 60 * 1000);

        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${targetUser.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            is_vip: true,
            vip_expires_at: updatedExpiry.toISOString()
          })
        });

        const updateData = await updateRes.json();
        if (!updateRes.ok) {
          console.error('DETAIL ERROR SUPABASE UPDATE:', JSON.stringify(updateData));
          return res.status(500).json({ success: false, error: updateData });
        }
      }

      // 2. CATAT TRANSAKSI KE TABEL TRANSACTIONS
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

      // 3. BONUS REFERRAL: CEK DAN BERIKAN +7 HARI HANYA KEPADA PENGUNDANG
      if (targetUser && targetUser.referred_by) {
        try {
          const inviterRes = await fetch(`${SUPABASE_URL}/rest/v1/users?referral_code=eq.${encodeURIComponent(targetUser.referred_by)}&select=*`, { headers });
          const inviters = await inviterRes.json();
          const inviter = inviters && inviters.length > 0 ? inviters[0] : null;

          if (inviter) {
            // Hitung masa aktif pengundang (+7 hari)
            const inviterCurrentExpiry = inviter.vip_expires_at && new Date(inviter.vip_expires_at) > now
              ? new Date(inviter.vip_expires_at)
              : now;
            const inviterNewExpiry = new Date(inviterCurrentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);

            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${inviter.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                is_vip: true,
                vip_expires_at: inviterNewExpiry.toISOString()
              })
            });

            console.log(`Bonus referral 7 hari berhasil diberikan ke pengundang (${inviter.email})!`);
          }
        } catch (refErr) {
          console.error('Gagal memproses bonus referral pengundang:', refErr);
        }
      }

      return res.status(200).json({ success: true, message: 'VIP Activated Successfully & Referral Processed' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received, status not success' });
  } catch (err) {
    console.error('Error fatal di webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
