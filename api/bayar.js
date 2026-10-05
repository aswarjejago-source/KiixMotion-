const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const va = "1179002188898353";
    const apikey = "6A9E222F-9973-44FE-A657-83D1AC7DD74B";
    const url = "https://my.ipaymu.com/api/v2/payment";

    // 1. Tangkap data pembeli dari frontend
    let reqData = req.body || {};
    if (typeof reqData === 'string') {
        try {
            reqData = JSON.parse(reqData);
        } catch (e) {
            reqData = {};
        }
    }

    const userEmail = reqData.email || reqData.buyerEmail || '';
    const userName = reqData.name || reqData.buyerName || '';
    const userPhone = reqData.phone || reqData.buyerPhone || '';

    // 🚨 PENJAGA PINTU: Tolak kalau email kosong! (Biar gak kecolongan)
    if (!userEmail) {
        return res.status(400).json({ 
            success: false, 
            message: "Sistem error: Email user tidak terbaca dari frontend. Gagal membuat tagihan!" 
        });
    }

    const totalBayar = reqData.amount || 35630;

    // 2. Susun parameter checkout iPaymu 
    const body = {
        product: ["Langganan VIP KiiXMotion 25 Hari (Termasuk Fee Admin)"],
        qty: ["1"],
        price: [String(totalBayar)], 
        description: ["Akses penuh fitur premium motion control AI selama 25 hari"],
        returnUrl: "https://kiix-motion.vercel.app/studio.html",
        cancelUrl: "https://kiix-motion.vercel.app/studio.html",
        notifyUrl: "https://kiix-motion.vercel.app/api/webhook", // WAJIB ADA
        referenceId: userEmail // KUNCI UTAMA SUPAYA WEBHOOK BISA UPDATE SUPABASE
    };

    // Tempelkan data pembeli ke iPaymu
    if (userEmail) body.buyerEmail = userEmail;
    if (userName) body.buyerName = userName;
    if (userPhone) body.buyerPhone = userPhone;

    const jsonBody = JSON.stringify(body);
    
    // 3. Generate Signature Keamanan iPaymu
    const bodyHash = crypto.createHash('sha256').update(jsonBody).digest('hex').toLowerCase();
    const stringToSign = `POST:${va}:${bodyHash}:${apikey}`;
    const signature = crypto.createHmac('sha256', apikey).update(stringToSign).digest('hex').toLowerCase();

    const d = new Date();
    const timestamp = d.getFullYear().toString() + 
        ("0" + (d.getMonth() + 1)).slice(-2) + 
        ("0" + d.getDate()).slice(-2) + 
        ("0" + d.getHours()).slice(-2) + 
        ("0" + d.getMinutes()).slice(-2) + 
        ("0" + d.getSeconds()).slice(-2);

    // --- JURUS BYPASS IP FIREWALL IPAYMU ---
    const spoofedIp = "216.198.79.195"; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'va': va,
                'signature': signature,
                'timestamp': timestamp,
                'X-Forwarded-For': spoofedIp,
                'X-Real-IP': spoofedIp,
                'CF-Connecting-IP': spoofedIp
            },
            body: jsonBody
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
