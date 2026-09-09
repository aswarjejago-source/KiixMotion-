export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, apiKey, workflowId, imageUrl, videoUrl } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API Key tidak boleh kosong!' });
        }

        // 1. JIKA AKSI CEK SALDO / KOIN
        if (action === 'check_balance') {
            // Sesuaikan endpoint cek saldo RunningHub jika ada endpoint resminya, 
            // sementara kita pakai endpoint user info/balance standar
            const balanceResponse = await fetch('https://www.runninghub.ai/openapi/v2/user/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: apiKey })
            });
            
            const balanceData = await balanceResponse.json();
            return res.status(200).json(balanceData);
        }

        // 2. JIKA AKSI RENDER WORKFLOW
        if (!workflowId || !imageUrl || !videoUrl) {
            return res.status(400).json({ error: 'Data render kurang lengkap!' });
        }

        const apiResponse = await fetch('https://www.runninghub.ai/openapi/v2/run/workflow/synchronous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: apiKey,
                workflowId: workflowId,
                randomSeed: true,
                retainSeconds: 0,
                usePersonalQueue: false,
                nodeInfoList: [
                    { nodeId: "30", fieldName: "image", fieldValue: imageUrl, description: "image" },
                    { nodeId: "33", fieldName: "video", fieldValue: videoUrl, description: "video" }
                ]
            })
        });

        const data = await apiResponse.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
