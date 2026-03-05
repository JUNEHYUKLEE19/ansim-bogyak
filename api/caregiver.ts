export default async function handler(req: any, res: any) {
if (req.method === 'GET') {
return res.status(200).json({
name: '',
phone: '',
delay_minutes: 30,
enabled: false
});
}
return res.status(405).json({ error: 'Method not allowed' });
}
