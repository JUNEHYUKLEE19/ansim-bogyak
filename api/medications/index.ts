import { supabase } from '../../lib/supabase';

function body(req: any) {
return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
}

export default async function handler(req: any, res: any) {
if (req.method === 'GET') {
const { data, error } = await supabase.from('medications').select('*').order('id');
if (error) return res.status(500).json({ error: error.message });
return res.status(200).json(data ?? []);
}

if (req.method === 'POST') {
const { name, time, times_per_day, with_meal, start_date } = body(req);
if (!name || !time || !times_per_day || !with_meal || !start_date) {
return res.status(400).json({ error: '필수 항목 누락' });
}

const { data, error } = await supabase
.from('medications')
.insert({ name: String(name).trim(), time, times_per_day, with_meal, start_date })
.select('id')
.single();

if (error) return res.status(500).json({ error: error.message });
return res.status(201).json({ id: data.id });
}

return res.status(405).json({ error: 'Method not allowed' });
}
