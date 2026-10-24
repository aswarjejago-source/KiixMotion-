// File: api/upload.js
// Proxy Upload Vercel - Supaya URL engine luar tertutup 100%

export const config = {
  runtime: 'edge', // Pakai edge runtime biar parsing file kencang tanpa package tambahan
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType') || 'image';
    const apiKeyPribadi = formData.get('apiKey');

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let keyUpload = apiKeyPribadi;

    // Ambil kunci upload dari database di sisi server (browser gak bisa liat)
    if (!keyUpload && SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
      const poolRes = await fetch(
        `${SUPABASE_URL}/rest/v1/runninghub_pool?select=api_key&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
          }
        }
      );
      const poolData = await poolRes.json();
      if (poolData && poolData.length > 0) {
        keyUpload = poolData[0].api_key;
      }
    }

    if (!keyUpload) {
      return new Response(JSON.stringify({ success: false, message: 'Server upload sedang padat.' }), { status: 503 });
    }

    // Tembak upload dari server Vercel
    const engineForm = new FormData();
    engineForm.append('file', file);
    engineForm.append('apiKey', keyUpload);
    engineForm.append('fileType', fileType);

    const rhRes = await fetch('https://www.runninghub.ai/task/openapi/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyUpload}`
      },
      body: engineForm
    });

    const data = await rhRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}
