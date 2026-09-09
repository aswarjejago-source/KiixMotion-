
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { apiKey, workflowId, imageUrl, videoUrl } = req.body;

        const payload = {
            apiKey: apiKey,
            workflowId: workflowId,
            randomSeed: true,
            retainSeconds: 0,
            usePersonalQueue: false,
            nodeInfoList: [
                {
                    nodeId: "30",
                    fieldName: "image",
                    fieldValue: imageUrl,
                    description: "image"
                },
                {
                    nodeId: "33",
                    fieldName: "video",
                    fieldValue: videoUrl,
                    description: "video"
                }
            ]
        };

        const response = await fetch('https://www.runninghub.ai/openapi/v2/run/workflow/synchronous', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
