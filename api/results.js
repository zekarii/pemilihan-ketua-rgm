const { redis } = require('./_redis');
const candidates = require('../candidates.json');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass || b.password !== pass) return res.status(401).json({ error: 'Password salah' });

  try {
    if (b.action === 'reset') {
      await redis(['DEL', 'rgm:counts', 'rgm:voters', 'rgm:log']);
    }
    const flat = (await redis(['HGETALL', 'rgm:counts'])) || [];
    const raw = {};
    for (let i = 0; i < flat.length; i += 2) raw[flat[i]] = parseInt(flat[i + 1], 10);
    const counts = candidates.map(c => ({ id: c.id, nama: c.nama, foto: c.foto, suara: raw[c.id] || 0 }));
    const semua = ((await redis(['LRANGE', 'rgm:log', 0, -1])) || []).map(s => {
      try { return JSON.parse(s); } catch (e) { return null; }
    }).filter(Boolean);
    // Jumlah suara per kelas, dihitung dari seluruh riwayat
    const perKelas = {};
    semua.forEach(l => { perKelas[l.kelas] = (perKelas[l.kelas] || 0) + 1; });
    const log = semua.slice(-300).reverse();
    res.status(200).json({ counts, total: counts.reduce((a, c) => a + c.suara, 0), perKelas, log });
  } catch (e) {
    res.status(500).json({ error: 'Gagal membaca data' });
  }
};
