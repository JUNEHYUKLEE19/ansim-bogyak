import { supabase } from '../../lib/supabase';

export default async function handler(req: any, res: any) {
if (req.method !== 'GET') {
return res.status(405).json({ error: 'Method not allowed' });
}

const today = new Date().toISOString().split('T')[0];
const { data, error } = await supabase
.from('dose_logs')
.select('*')
.eq('date', today)
.order('time');

if (error) return res.status(500).json({ error: error.message });
return res.status(200).json(data ?? []);
}
