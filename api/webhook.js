// ========================================================
// ENDPOINT WEBHOOK IPAYMU (ARSITEKTUR PROFILES -> USERS)
// File: api/webhook.js
// ========================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fybyupwcburndxulqqnn.supabase.co';
  // WAJIB pakai SERVICE ROLE KEY buat bypass RLS
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

  try {
    const payload = req.body || {};
    
    const statusText = (payload.status || '').toString().toLowerCase();
    const statusCode = payload.status_code || payload.statusCode; 
    const trxId = payload.trx_id || payload.transactionId || payload.sid;
    const amount = Number(payload.amount || payload.total || 0);
    
    let rawEmail = payload.buyer_email || payload.email || payload.referenceId || payload.reference_id || '';
    let buyerEmail = rawEmail.includes('===') ? rawEmail.split('===')[0] : rawEmail;
    buyerEmail = (buyerEmail || '').toLowerCase().trim();

    console.log('--- IPAYMU WEBHOOK MASUK ---');
    console.log('Data Transaksi:', { statusText, statusCode, trxId, amount, buyerEmail });

    // Deteksi lunas (bisa dari text atau code 1)
    const isSuccess = (statusText === 'berhasil' || statusText === 'sukses' || statusText === 'paid' || statusCode === '1' || statusCode === 1);
    
    if (isSuccess && buyerEmail) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      let finalUserId = null;

      // 1. CARI UUID ASLI USER DI TABEL `public.profiles`
      try {
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(buyerEmail)}&select=id`, { headers });
        const profileJson = await profileRes.json();
        
        if (Array.isArray(profileJson) && profileJson.length > 0) {
            finalUserId = profileJson[0].id;
            console.log('✅ UUID Asli ditemukan di public.profiles:', finalUserId);
        }
      } catch (e) {
          console.error('❌ Gagal cek public.profiles:', e.message);
      }

      // Jika tetap tidak ketemu, coba cari di auth.users (jalur belakang)
      if (!finalUserId) {
          try {
            const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
            const authJson = await authRes.json();
            const foundAuth = authJson?.users?.find(u => u.email?.toLowerCase() === buyerEmail);
            if (foundAuth && foundAuth.id) {
                finalUserId = foundAuth.id;
                console.log('✅ UUID Asli ditemukan di auth.users:', finalUserId);
            }
          } catch (e) {}
      }

      // Jika user beneran belum pernah login (tidak ada di sistem sama sekali)
      if (!finalUserId) {
        console.error(`❌ GAGAL: Email ${buyerEmail} belum pernah daftar/login ke web! Transaksi dihentikan agar tidak nabrak.`);
        return res.status(500).json({ success: false, message: 'User tidak ditemukan di sistem. Harus login dulu.' });
      }

      // --- LOGIKA PAKET ---
      const isPaket4   = (amount >= 2000 && amount < 4500);   
      const isPaket10  = (amount >= 4500 && amount <= 8000);  
      const isPaket20  = (amount > 8000 && amount <= 18000);  
      const isPaketVIP = (amount > 18000);                    

      // 2. EKSEKUSI KREDIT (TABEL user_credits)
      if (isPaket4 || isPaket10 || isPaket20) {
        const kreditTambah = isPaket4 ? 4 : (isPaket10 ? 10 : 20);
        const exp24Jam = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const credRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}&select=*`, { headers });
        const credRows = await credRes.json();

        if (Array.isArray(credRows) && credRows.length > 0) {
          const saldoLama = Number(credRows[0].credits_balance) || 0;
          await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${finalUserId}`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ credits_balance: saldoLama + kreditTambah, expires_at: exp24Jam })
          });
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
            method: 'POST', headers,
            body: JSON.stringify({ user_id: finalUserId, credits_balance: kreditTambah, expires_at: exp24Jam })
          });
        }
      }

      // 3. EKSEKUSI VIP PRO (TABEL public.users)
      if (isPaketVIP) {
        const expVIP = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
        const randomRef = 'KIIX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Kita pakai UPSERT: Jika sudah ada di users, dia diupdate. Jika belum ada, dia di-insert pakai UUID ASLI.
        await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'resolution=merge-duplicates' // Ini perintah UPSERT di Supabase REST API
          },
          body: JSON.stringify({ 
              id: finalUserId, 
              email: buyerEmail, 
              is_vip: true, 
              vip_expires_at: expVIP,
              referral_code: randomRef // Jaga-jaga kalau dia belum punya
          })
        });
        console.log(`✅ SUKSES! User ${buyerEmail} dimasukkan ke tabel users sebagai VIP Pro.`);
      }

      // 4. CATAT TRANSAKSI
      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST', headers,
        body: JSON.stringify({
          user_id: String(finalUserId), trx_id: String(trxId || Date.now()), amount: amount, status: 'BERHASIL'
        })
      });

      return res.status(200).json({ success: true, message: `Webhook sukses untuk ID Asli: ${finalUserId}` });
    }

    return res.status(200).json({ success: true, message: 'Status belum lunas.' });

  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
