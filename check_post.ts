import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('site_settings').select('*');
  console.log('DB settings:', JSON.stringify(data, null, 2));

  // Let's manually trigger a POST to localhost:3000
  const res = await fetch('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand: { name: 'API_TEST' } })
  });
  console.log('POST status:', res.status);
  
  const { data: data2 } = await supabase.from('site_settings').select('*');
  console.log('DB after POST:', JSON.stringify(data2, null, 2));
}

check();
