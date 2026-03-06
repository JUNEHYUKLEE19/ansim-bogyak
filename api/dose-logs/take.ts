import { supabase } from '../../lib/supabase';

function body(req: any) {
return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
}

export default async function handler(req: any, res: any) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}

const { medication_id, taken_time } = body(req);
if (!medication_id || !taken_time) {
return res.status(400).json({ error: '약 아이디와 복용 시간 필수' });
}

const date = new Date(taken_time).toISOString().split('T')[0];
const { data, error } = await supabase
.from('dose_logs')
.insert({ medication_id, date, time: taken_time, status: 'taken' })
.select('id')
.single();

if (error) return res.status(500).json({ error: error.message });
return res.status(201).json({ id: data.id });
}
