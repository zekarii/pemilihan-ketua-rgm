// ini buat liatin jumlah / total semua orang vote di papan

const { redis } = require('./_redis');

function jumlah(flat) {
  var n = 0;
  for (var i = 1; i < (flat || []).length; i += 2) n += parseInt(flat[i], 10) || 0;
  return n;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });

  try {
    const santri = jumlah(await redis(['HGETALL', 'rgm:counts']));
    const asatidz = jumlah(await redis(['HGETALL', 'rgm:guru:votes']));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ total: santri + asatidz });
  } catch (e) {
    return res.status(500).json({ error: 'Gagal membaca data' });
  }
};
