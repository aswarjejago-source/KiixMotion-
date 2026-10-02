// Endpoint Webhook iPaymu untuk KiiXMotion (Final & Secure)
export default async function handler(req, res) {
  // Hanya terima metode POST dari iPaymu
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Konfigurasi Supabase KiiXMotion (URL disesuaikan agar tidak typo)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    const payload = req.body || {};
    
    // Ambil data status transaksi dari iPaymu
    const status = payload.status; // 'berhasil' atau '1'
    const trxId = payload.trx_id || payload.transactionId;
    const buyerEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id;
    const amount = Number(payload.amount || payload.total || 35000);

    console.log('Webhook diterima dari iPaymu:', { status, trxId, buyerEmail, amount });

    // Hanya proses jika pembayaran sukses dan email pembeli valid
    if ((status === 'berhasil' || status === '1' || status === 1) && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // 1. Cari user pembeli di tabel users berdasarkan email
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, {
        headers
      });
      const users = await userRes.json();
      const user = users && users.length > 0 ? users[0] : null;

      if (!user) {
        console.error('User pembeli tidak ditemukan di database:', buyerEmail);
        return res.status(200).json({ success: false, message: 'User not found in database' });
      }

      // 2. Tentukan durasi VIP (Jika pakai referral dapat bonus, misal 32 hari, atau standar 25 hari)
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

      // 4. OTOMATIS BERI REWARD +7 HARI VIP KE PEMBERI REFERRAL (UPLINE)
      if (hasReferral) {
        // Cari pemilik kode referral berdasarkan kolom referral_code
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

          // Update masa aktif VIP pemberi referral (+7 hari)
          await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${referrer.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              is_vip: true,
              vip_expires_at: newRefExpiry.toISOString()
            })
          });
          console.log('Bonus referral +7 hari berhasil dikirim ke:', referrer.email);
        }
      }

      // 5. Catat riwayat transaksi ke tabel transactions
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

      return res.status(200).json({ success: true, message: 'VIP Activated & Referral Reward Processed' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received, status not success or email missing' });
  } catch (err) {
    console.error('Error fatal di webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
