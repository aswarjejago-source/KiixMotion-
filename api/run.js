export default async function handler(req, res) {
    // Pastikan header selalu ngebales dalam bentuk JSON, cegah error HTML dari Vercel
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, apiKey, workflowId, imageUrl, videoUrl } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API Key tidak boleh kosong!' });
        }

        // 1. CEK SALDO / INFO AKUN RUNNINGHUB
        if (action === 'check_balance') {
            const apiResponse = await fetch('https://www.runninghub.ai/openapi/v2/user/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: apiKey })
            });
            
            const textResponse = await apiResponse.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                return res.status(500).json({ error: 'Gagal parsing dari RunningHub: ' + textResponse.substring(0, 100) });
            }
            return res.status(200).json(data);
        }

        // 2. EKSEKUSI RENDER WORKFLOW
        if (!workflowId || !imageUrl || !videoUrl) {
            return res.status(400).json({ error: 'Data render (Workflow ID / URL Foto / URL Video) kurang lengkap!' });
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

        const textResponse = await apiResponse.text();
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            return res.status(500).json({ error: 'RunningHub mengembalikan non-JSON: ' + textResponse.substring(0, 100) });
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Server Error: ' + error.message });
    }
}
