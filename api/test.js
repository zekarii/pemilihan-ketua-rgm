module.exports = async (req, res) => {
  const u = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const t = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const p = process.env.ADMIN_PASSWORD;
  
  res.status(200).json({
    db_url: u ? 'terhubung' : 'KOSONG - setup Upstash Redis di Storage',
    db_token: t ? 'terhubung' : 'KOSONG - setup Upstash Redis di Storage',
    admin_password: p ? 'diset' : 'KOSONG - tambah ADMIN_PASSWORD di Environment Variables',
    msg: (!u || !t) ? 'Database belum terhubung' : !p ? 'Password belum diset' : 'Semua siap!'
  });
};
