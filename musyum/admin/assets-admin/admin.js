var password = '', timer = null;

function panggil(action) {
  return fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password, action: action })
  }).then(function (r) {
    return r.text().then(function (t) {
    var j = {};
    try { j = JSON.parse(t); } catch (e) {}
    if (!r.ok || !j.counts) throw new Error(j.error || ('Server tidak menjawab dengan benar (kode ' + r.status + ')'));
    return j;
  });
  });
}

function gambar(d) {
  document.getElementById('total').textContent = d.total;
  var h = document.getElementById('hasil');
  h.innerHTML = '';
  var nama = {};
  d.counts.forEach(function (c) {
    nama[c.id] = c.nama;
    var pct = d.total ? Math.round(c.suara / d.total * 100) : 0;
    var row = document.createElement('div');
    row.className = 'baris';
    var img = document.createElement('img'); img.src = c.foto; img.alt = '';
    var info = document.createElement('div'); info.className = 'info';
    var t = document.createElement('div'); t.textContent = c.nama + ' (' + pct + '%)';
    var bt = document.createElement('div'); bt.className = 'batang';
    var bi = document.createElement('i'); bi.style.width = pct + '%'; bt.appendChild(bi);
    info.appendChild(t); info.appendChild(bt);
    var a = document.createElement('div'); a.className = 'angka'; a.textContent = c.suara;
    row.appendChild(img); row.appendChild(info); row.appendChild(a);
    h.appendChild(row);
  });
  var tb = document.getElementById('log');
  tb.innerHTML = '';
  d.log.forEach(function (l) {
    var tr = document.createElement('tr');
    [new Date(l.waktu).toLocaleString('id-ID'), l.nama, l.kelas, nama[l.kandidat] || l.kandidat].forEach(function (v) {
      var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}

function muat(action) {
  return panggil(action).then(function (d) {
    document.getElementById('login').hidden = true;
    document.getElementById('isi').hidden = false;
    gambar(d);
    if (!timer) timer = setInterval(function () { muat().catch(function () {}); }, 10000);
  });
}

document.getElementById('btnMasuk').addEventListener('click', function () {
  password = document.getElementById('pw').value;
  muat().catch(function (e) { document.getElementById('err').textContent = e.message; });
});
document.getElementById('pw').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('btnMasuk').click();
});
document.getElementById('btnRefresh').addEventListener('click', function () { muat().catch(function (e) { alert(e.message); }); });
document.getElementById('btnReset').addEventListener('click', function () {
  if (confirm('Hapus SEMUA suara? Tindakan ini tidak bisa dibatalkan.')) muat('reset').catch(function (e) { alert(e.message); });
});