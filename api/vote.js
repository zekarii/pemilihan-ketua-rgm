const { redis } = require('./_redis');
const candidates = require('../candidates.json');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const kelas = String(b.kelas || '').trim().replace(/\s+/g, ' ').slice(0, 20);
  const cand = candidates.find(c => c.id === String(b.kandidat));

  if (!kelas || !cand) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  try {
    await redis(['HINCRBY', 'rgm:counts', cand.id, 1]);
    await redis(['RPUSH', 'rgm:log', JSON.stringify({
      kelas, kandidat: cand.id, waktu: new Date().toISOString()
    })]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Vote error:', e.message || e);
    return res.status(500).json({ error: 'Gagal menyimpan suara: ' + (e.message || 'kesalahan server') });
  }
};