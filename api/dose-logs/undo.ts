import { supabase } from '../../lib/supabase';

function body(req: any) {
return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
}

export default async function handler(req: any, res: any) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}

const { dose_log_id } = body(req);
if (!dose_log_id) {
return res.status(400).json({ error: 'dose_log_id 필수' });
}

const { error: deleteError } = await supabase
.from('dose_logs')
.delete()
.eq('id', dose_log_id);

if (deleteError) return res.status(500).json({ error: deleteError.message });
return res.status(200).json({ success: true });
}
