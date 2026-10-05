// Endpoint Webhook iPaymu (Robust Upsert & Detailed Error Logging)
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
        'Content-Type': 'application/json'
      };

      // 1. Cek profil dulu untuk ambil referensi jika ada
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(buyerEmail)}&select=*`, { headers });
      const profiles = await profileRes.json();
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      const bonusDays = 25;
      const now = new Date();
      const newExpiry = new Date(now.getTime() + bonusDays * 24 * 60 * 60 * 1000);

      // 2. GUNAKAN UPSERT SUPABASE (Otomatis Insert kalau belum ada, Update kalau email sudah ada)
      const upsertHeaders = {
        ...headers,
        'Prefer': 'resolution=merge-duplicates, return=representation'
      };

      const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=email`, {
        method: 'POST',
        headers: upsertHeaders,
        body: JSON.stringify({
          email: buyerEmail,
          uuid: profile ? profile.uuid : null,
          full_name: profile ? profile.full_name : 'Member KiiXMotion',
          is_vip: true,
          vip_expires_at: newExpiry.toISOString()
        })
      });

      const upsertData = await upsertRes.json();

      // Kalau Supabase nolak, catat error aslinya di log Vercel
      if (!upsertRes.ok) {
        console.error('GAGAL SIMPAN KE SUPABASE:', upsertData);
        return res.status(500).json({ success: false, error: upsertData });
      }

      const user = upsertData && upsertData.length > 0 ? upsertData[0] : null;

      // 3. Catat riwayat transaksi ke tabel transactions
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

      return res.status(200).json({ success: true, message: 'VIP Activated via Upsert Successfully' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received, status not success' });
  } catch (err) {
    console.error('Error fatal di webhook iPaymu:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
