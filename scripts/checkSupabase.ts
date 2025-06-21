import 'dotenv/config';
import fetch from 'node-fetch';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;

(async () => {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: key, authorization: `Bearer ${key}` },
    });
    const code = res.status;
    let verdict = '✅ OK';
    if (code === 401) verdict = '❌ 401 – bad anon key';
    else if (code === 404) verdict = '❌ 404 – project asleep or URL wrong';
    else if (code >= 500) verdict = `❌ ${code} – Supabase host error`;
    console.log(`[supabase-diag] HTTP ${code}  →  ${verdict}`);
    process.exit(code === 200 ? 0 : 1);
  } catch (err) {
    console.error('[supabase-diag] ❌ Network/DNS error →', err.message);
    process.exit(2);
  }
})();