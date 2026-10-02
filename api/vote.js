const { redis } = require('./_redis');
const candidates = require('../candidates.json');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const nama = String(b.nama || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const kelas = String(b.kelas || '').trim().replace(/\s+/g, ' ').slice(0, 20);
  const cand = candidates.find(c => c.id === String(b.kandidat));
  if (!nama || !kelas || !cand) return res.status(400).json({ error: 'Data tidak lengkap' });

  // Satu orang (nama + kelas) hanya bisa memilih sekali. Hapus 3 baris ini jika tidak diinginkan.
  const key = (nama + '|' + kelas).toLowerCase();
  try {
    const added = await redis(['SADD', 'osis:voters', key]);
    if (added === 0) return res.status(409).json({ error: 'Nama dan kelas ini sudah memilih' });
    try {
      await redis(['HINCRBY', 'osis:counts', cand.id, 1]);
      await redis(['RPUSH', 'osis:log', JSON.stringify({ nama, kelas, kandidat: cand.id, waktu: new Date().toISOString() })]);
    } catch (e) {
      await redis(['SREM', 'osis:voters', key]).catch(() => {});
      throw e;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan suara' });
  }
};
