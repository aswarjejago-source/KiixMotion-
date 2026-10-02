// Endpoint Webhook iPaymu untuk KiiXMotion
export default async function handler(req, res) {
  // Hanya terima POST dari iPaymu
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Konfigurasi Supabase KiiXMotion
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybrupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    const payload = req.body || {};
    
    // Ambil data status transaksi dari iPaymu
    const status = payload.status; // 'berhasil'
    const trxId = payload.trx_id;
    const buyerEmail = payload.buyer_email || payload.email || payload.reference_id;
    const amount = Number(payload.amount || payload.total || 35000);

    console.log('Webhook diterima:', { status, trxId, buyerEmail, amount });

    // Hanya proses jika pembayaran sukses dan email pembeli ada
    if (status === 'berhasil' && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // 1. Cari user di tabel users berdasarkan email
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, {
        headers
      });
      const users = await userRes.json();
      const user = users && users.length > 0 ? users[0] : null;

      if (!user) {
        console.error('User tidak ditemukan di database:', buyerEmail);
        return res.status(200).json({ message: 'User not found, but webhook received' });
      }

      // 2. Hitung bonus hari (Referral: 32 hari, Biasa: 25 hari)
      const hasReferral = Boolean(user.referred_by);
      const bonusDays = hasReferral ? 32 : 25;

      const now = new Date();
      const currentExpiry = user.vip_expires_at && new Date(user.vip_expires_at) > now
        ? new Date(user.vip_expires_at)
        : now;
      
      const newExpiry = new Date(currentExpiry.getTime() + bonusDays * 24 * 60 * 60 * 1000);

      // 3. Update status VIP pembeli di Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          is_vip: true,
          vip_expires_at: newExpiry.toISOString()
        })
      });

      // 4. Jika pakai referral, beri bonus +7 hari ke pemilik kode referral
      if (hasReferral) {
        const refRes = await fetch(`${SUPABASE_URL}/rest/v1/users?referral_code=eq.${encodeURIComponent(user.referred_by)}&select=*`, {
          headers
        });
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

      // 5. Catat riwayat transaksi ke tabel transactions
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: user.id,
          trx_id: String(trxId),
          amount: amount,
          status: 'BERHASIL'
        })
      });

      return res.status(200).json({ success: true, message: 'VIP Activated' });
    }

    return res.status(200).json({ message: 'Webhook received but not processed' });
  } catch (err) {
    console.error('Error di webhook:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
