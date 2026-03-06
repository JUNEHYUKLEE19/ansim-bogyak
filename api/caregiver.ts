import { supabase } from '../lib/supabase';

function body(req: any) {
return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
}

export default async function handler(req: any, res: any) {
if (req.method === 'GET') {
const { data, error } = await supabase.from('caregiver').select('*');
if (error) return res.status(500).json({ error: error.message });
return res.status(200).json(data ?? []);
}

if (req.method === 'POST') {
const { name, phone, delay_minutes, enabled } = body(req);
if (!name || !phone) {
return res.status(400).json({ error: '움른연락처 이름과 전화번호 필수' });
}

const { data, error } = await supabase
.from('caregiver')
.insert({ name, phone, delay_minutes: delay_minutes || 30, enabled: enabled || false })
.select('id')
.single();

if (error) return res.status(500).json({ error: error.message });
return res.status(201).json({ id: data.id });
}

return res.status(405).json({ error: 'Method not allowed' });
}
