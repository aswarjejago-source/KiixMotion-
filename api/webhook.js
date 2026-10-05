// Endpoint Webhook iPaymu (Safe Two-Step Logic: Check -> Insert/Update)
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

      // 1. Cek profil dulu untuk ambil referensi nama/UUID jika ada
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const profiles = await profileRes.json();
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      const bonusDays = 25;
      const now = new Date();

      // 2. CEK APAKAH USER SUDAH ADA DI TABEL USERS
      const userCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const existingUsers = await userCheckRes.json();
      let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      if (!targetUser) {
        // JIKA BELUM ADA: Lakukan INSERT data baru ke users
        const newExpiry = new Date(now.getTime() + bonusDays * 24 * 60 * 60 * 1000);
        
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: buyerEmail,
            uuid: profile ? profile.uuid : null,
            full_name: profile ? profile.full_name : 'Member KiiXMotion',
            is_vip: true,
            vip_expires_at: newExpiry.toISOString()
          })
        });
        
        const insertData = await insertRes.json();
        if (!insertRes.ok) {
          console.error('GAGAL INSERT KE USERS:', insertData);
          return res.status(500).json({ success: false, error: insertData });
        }
        targetUser = insertData && insertData.length > 0 ? insertData[0] : null;
      } else {
        // JIKA SUDAH ADA: Lakukan UPDATE perpanjangan masa aktif
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
          console.error('GAGAL UPDATE KE USERS:', updateData);
          return res.status(500).json({ success: false, error: updateData });
        }
      }

      // 3. Catat riwayat transaksi ke tabel transactions
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

      return res.status(200).json({ success: true, message: 'VIP Activated Successfully via Two-Step Logic' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received, status not success' });
  } catch (err) {
    console.error('Error fatal di webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
