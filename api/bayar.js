const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // --- MULAI PERUBAHAN PRODUCTION ---
    // Kunci Production iPaymu Lu (Udah Diganti)
    const va = "1179002188898353";
    const apikey = "6A9E222F-9973-44FE-A657-83D1AC7DD74B";
    const url = "https://my.ipaymu.com/api/v2/payment";
    // --- AKHIR PERUBAHAN PRODUCTION ---

    const body = {
        product: ["Langganan VIP KiiXMotion 25 Hari"],
        qty: ["1"],
        price: ["35000"], // Rp 35.000 untuk durasi 25 hari
        description: ["Akses penuh fitur premium motion control AI selama 25 hari"],
        returnUrl: "https://kiix-motion.vercel.app/studio.html",
        cancelUrl: "https://kiix-motion.vercel.app/studio.html",
        notifyUrl: "https://kiix-motion.vercel.app/studio.html"
    };

    const jsonBody = JSON.stringify(body);
    
    // Bikin Signature aman di Server Vercel
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

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'va': va,
                'signature': signature,
                'timestamp': timestamp
            },
            body: jsonBody
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
