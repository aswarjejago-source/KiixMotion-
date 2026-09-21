const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Kunci Sandbox iPaymu Lu
    const va = "0000002188898353";
    const apikey = "SANDBOX79FD0BF5-B4DD-4C98-9AD2-D040EE45D52A";
    const url = "https://sandbox.ipaymu.com/api/v2/payment";

    const body = {
        product: ["Langganan VIP KiiXMotion 1 Bulan"],
        qty: ["1"],
        price: ["50000"],
        description: ["Akses penuh fitur premium motion control AI"],
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
