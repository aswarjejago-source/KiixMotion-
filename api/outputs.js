// File: api/outputs.js
// Backend Proxy Status Checker - RunningHub & Kling (PiAPI)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supaAdmin = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { taskId, apiKey, poolId, provider } = req.body;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'Task ID wajib disertakan.' });
  }

  // =========================================================
  // JALUR 1: CEK STATUS KLING (PiAPI)
  // =========================================================
  if (provider === 'kling' || String(taskId).includes('-')) {
    try {
      const PIAPI_KEY = process.env.PIAPI_KEY || "b6d3705e08d8e2330e60639119bd04bc304be592eebda976ec2551f82ea072da";

      const piapiRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': PIAPI_KEY
        }
      });

      const rawText = await piapiRes.text();
      let piapiJson = null;
      try {
        piapiJson = JSON.parse(rawText);
      } catch (e) {}

      if (!piapiRes.ok || !piapiJson) {
        return res.status(piapiRes.status).json({
          success: false,
          message: 'Gagal mengambil status task dari PiAPI.'
        });
      }

      const taskData = piapiJson.data || piapiJson;
      return res.status(200).json({
        success: true,
        data: taskData
      });
    } catch (errKling) {
      return res.status(500).json({
        success: false,
        message: 'Koneksi ke status PiAPI gagal: ' + errKling.message
      });
    }
  }

  // =========================================================
  // JALUR 2: CEK STATUS RUNNINGHUB / KIIX (WAN & MINIMAX)
  // =========================================================
  try {
    let effectiveApiKey = apiKey;

    // Ambil API key dari Supabase pool jika user pakai sistem kredit Kiix
    if (!effectiveApiKey && supaAdmin) {
      if (poolId) {
        const { data: poolRec } = await supaAdmin
          .from('runninghub_pool')
          .select('api_key')
          .eq('id', poolId)
          .maybeSingle();

        if (poolRec && poolRec.api_key) {
          effectiveApiKey = poolRec.api_key;
        }
      }

      // Cadangan: ambil akun pool yang tersedia jika poolId tidak cocok
      if (!effectiveApiKey) {
        const { data: fallbackPool } = await supaAdmin
          .from('runninghub_pool')
          .select('api_key')
          .limit(1)
          .maybeSingle();

        if (fallbackPool && fallbackPool.api_key) {
          effectiveApiKey = fallbackPool.api_key;
        }
      }
    }

    // Cadangan terakhir dari Environment Variable Vercel
    if (!effectiveApiKey) {
      effectiveApiKey = process.env.RUNNINGHUB_API_KEY;
    }

    if (!effectiveApiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key RunningHub tidak ditemukan (ApiKey & Pool kosong).'
      });
    }

    // Kirim apiKey di Header DAN di Body agar sesuai spek OpenAPI RunningHub
    const rhRes = await fetch('https://www.runninghub.ai/task/openapi/outputs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
        'apiKey': effectiveApiKey
      },
      body: JSON.stringify({
        apiKey: effectiveApiKey,
        taskId: taskId
      })
    });

    const rhJson = await rhRes.json();
    return res.status(200).json(rhJson);

  } catch (errRh) {
    return res.status(500).json({
      success: false,
      message: 'Koneksi ke RunningHub gagal: ' + errRh.message
    });
  }
}
