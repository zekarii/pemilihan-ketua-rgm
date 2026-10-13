const { redis } = require('./_redis');
const candidates = require('../candidates.json');

const VOTES_KEY = 'rgm:guru:votes';   // suara guru per kandidat
const TOTAL_KEY = 'rgm:guru:total';   // total suara guru

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method tidak diizinkan' });
  }

  let b = {};
  try {
    b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'Data tidak valid' });
  }

  const benar = (process.env.TEACHER_CODE || '').trim().toUpperCase();
  const k = String(b.kode || '').trim().toUpperCase();
  if (!benar || k !== benar) {
    return res.status(401).json({ ok: false, error: 'Kode tidak valid' });
  }

  const max = parseInt(process.env.MAX_GURU_VOTES, 10) || 0; // 0 = tanpa batas

  try {
    if (b.action === 'check') {
      if (max) {
        const total = parseInt(await redis(['GET', TOTAL_KEY]), 10) || 0;
        if (total >= max) {
          return res.status(403).json({ ok: false, error: 'Kuota suara guru sudah penuh' });
        }
      }
      return res.status(200).json({ ok: true });
    }

    const id = String(b.kandidat);
    if (!candidates.some(c => String(c.id) === id)) {
      return res.status(400).json({ ok: false, error: 'Kandidat tidak valid' });
    }

    // INCR atomik: hanya sampai batas yang bisa lolos
    const total = await redis(['INCR', TOTAL_KEY]);
    if (max && total > max) {
      await redis(['DECR', TOTAL_KEY]);
      return res.status(403).json({ ok: false, error: 'Kuota suara guru sudah penuh' });
    }

    try {
      await redis(['HINCRBY', VOTES_KEY, id, 1]);
    } catch (e) {
      await redis(['DECR', TOTAL_KEY]);
      throw e;
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Gagal mencatat suara' });
  }
};
