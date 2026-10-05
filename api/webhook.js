// Endpoint Webhook iPaymu untuk KiiXMotion (Profile Link & Auto-Insert VIP)
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
    
    // Ambil data email dari iPaymu
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

      // 1. Cek dulu ke tabel PROFILES (untuk ambil data dasar/UUID user jika ada)
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const profiles = await profileRes.json();
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      // 2. Cek apakah user sudah terdaftar di tabel USERS (tabel VIP/subscriber)
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const users = await userRes.json();
      let user = users && users.length > 0 ? users[0] : null;

      const bonusDays = 25; // Durasi standar VIP
      const now = new Date();

      if (!user) {
        // JIKA BELUM ADA DI USERS: Otomatis daftarkan ke tabel USERS sebagai VIP baru!
        console.log('User belum ada di public.users, membuat data VIP baru secara otomatis untuk:', buyerEmail);
        
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
        const insertedUsers = await insertRes.json();
        user = insertedUsers && insertedUsers.length > 0 ? insertedUsers[0] : null;
      } else {
        // JIKA SUDAH ADA DI USERS: Perpanjang masa aktif VIP-nya
        const hasReferral = Boolean(user.referred_by);
        const actualBonus = hasReferral ? 32 : bonusDays;

        const currentExpiry = user.vip_expires_at && new Date(user.vip_expires_at) > now
          ? new Date(user.vip_expires_at)
          : now;
        
        const newExpiry = new Date(currentExpiry.getTime() + actualBonus * 24 * 60 * 60 * 1000);

        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            is_vip: true,
            vip_expires_at: newExpiry.toISOString()
          })
        });

        // 3. Reward Referral (Upline) jika ada
        if (hasReferral) {
          const refRes = await fetch(`${SUPABASE_URL}/rest/v1/users?referral_code=eq.${encodeURIComponent(user.referred_by)}&select=*`, { headers });
          const refUsers = await refRes.json();
          const referrer = refUsers && refUsers.length > 0 ? refUsers[0] : null;

          if (referrer) {
            const refExpiry = referrer.vip_expires_at && new Date(referrer.vip_expires_at) > now
              ? new Date(referrer.vip_expires_at)
              : now;
            const newRefExpiry = new Date(refExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);

            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${referrer.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                is_vip: true,
                vip_expires_at: newRefExpiry.toISOString()
              })
            });
          }
        }
      }

      // 4. Catat riwayat transaksi ke tabel transactions
      if (user && user.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: user.id,
            trx_id: String(trxId || Date.now()),
            amount: amount,
            status: 'BERHASIL'
          })
        });
      }

      return res.status(200).json({ success: true, message: 'VIP Activated & Profile Linked Successfully' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received, status not success' });
  } catch (err) {
    console.error('Error fatal di webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
