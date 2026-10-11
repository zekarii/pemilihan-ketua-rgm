/* ============================================================
   Admin - Hasil Pemilihan Ketua RGM
   Satu file lengkap: daftar kelas, login, hasil, per kelas, riwayat
   ============================================================ */

var KELAS = {
  'X':   ['XA', 'XB', 'XC', 'XD'],
  'XI':  ['XI IPA 1', 'XI IPA 2', 'XI IPS 1', 'XI IPS 2', 'XI IAI 1'],
  'XII': ['XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XII IAI 1']
};

var UKURAN_KELAS = {
   'XA': 35,
   'XB': 35,
   'XC': 33,
   'XD': 35,
   'XI IPA 1': 35,
   'XI IPA 2': 35,
   'XI IPS 1': 27,
   'XI IPS 2': 26,
   'XI IAI 1': 15,
   'XII IPA 1': 35,
   'XII IPA 2': 34,
   'XII IPS 1': 35,
   'XII IAI 1': 33
};

var REFRESH_MS = 10000;
var password = '';
var timer = null;
 
function el(id) { return document.getElementById(id); }
 
function on(id, evt, fn) {
  var e = el(id);
  if (e) e.addEventListener(evt, fn);
}
 
/* ---------- Panggilan ke API ---------- */
function panggil(action) {
  return fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password, action: action })
  }).then(function (r) {
    return r.text().then(function (t) {
      var j = {};
      try { j = JSON.parse(t); } catch (e) {}
      if (!r.ok || !j.counts) {
        throw new Error(j.error || ('Server tidak menjawab dengan benar (kode ' + r.status + ')'));
      }
      return j;
    });
  });
}
 
/* ---------- Suara per kelas ---------- */
function kartuKelas(nama, n) {
  var max = UKURAN_KELAS[nama];
  var k = document.createElement('div');
  k.className = 'kelas-kartu' + (n === 0 ? ' nol' : '') + (max && n > max ? ' lebih' : '');
 
  var a = document.createElement('span');
  a.className = 'kelas-nama';
  a.textContent = nama;
 
  var b = document.createElement('div');
  b.className = 'kelas-angka';
  var angka = document.createElement('strong');
  angka.textContent = n;
  b.appendChild(angka);
  if (max) {
    var batas = document.createElement('small');
    batas.textContent = '/ ' + max;
    b.appendChild(batas);
  }
 
  k.appendChild(a);
  k.appendChild(b);
  return k;
}
 
function grupKelas(judul, daftar, per) {
  var grup = document.createElement('div');
  grup.className = 'kelas-grup';
 
  var grid = document.createElement('div');
  grid.className = 'kelas-grid';
 
  var total = 0;
  daftar.forEach(function (k) {
    var n = per[k] || 0;
    total += n;
    grid.appendChild(kartuKelas(k, n));
  });
 
  var h = document.createElement('h3');
  h.className = 'kelas-judul';
  h.textContent = judul + ' \u00b7 ' + total + ' suara';
 
  grup.appendChild(h);
  grup.appendChild(grid);
  return grup;
}
 
function gambarKelas(per) {
  var box = el('perKelas');
  if (!box) return;
  box.innerHTML = '';
 
  var dikenal = {};
  Object.keys(KELAS).forEach(function (j) {
    KELAS[j].forEach(function (k) { dikenal[k] = true; });
    box.appendChild(grupKelas('Kelas ' + j, KELAS[j], per));
  });
 
  // Nama kelas di data yang tidak ada di daftar di atas
  var lain = Object.keys(per).filter(function (k) { return !dikenal[k]; });
  if (lain.length) box.appendChild(grupKelas('Lainnya', lain, per));
}
 
/* ---------- Hasil per kandidat + riwayat ---------- */
function gambar(d) {
  el('total').textContent = d.total;
  gambarKelas(d.perKelas || {});
 
  var h = el('hasil');
  h.innerHTML = '';
  var nama = {};
 
  d.counts.forEach(function (c) {
    nama[c.id] = c.nama;
    var pct = d.total ? Math.round(c.suara / d.total * 100) : 0;
 
    var baris = document.createElement('div');
    baris.className = 'baris';
 
    var img = document.createElement('img');
    img.src = /^(\/|https?:)/.test(c.foto) ? c.foto : '/' + c.foto;
    img.alt = '';
 
    var info = document.createElement('div');
    info.className = 'info';
 
    var namaEl = document.createElement('div');
    namaEl.className = 'info-nama';
    namaEl.textContent = c.nama;
 
    var pctEl = document.createElement('p');
    pctEl.className = 'info-pct';
    pctEl.textContent = pct + '%';
 
    var bt = document.createElement('div');
    bt.className = 'batang';
    var bi = document.createElement('i');
    bi.style.width = pct + '%';
    bt.appendChild(bi);
 
    info.appendChild(namaEl);
    info.appendChild(pctEl);
    info.appendChild(bt);
 
    var angka = document.createElement('div');
    angka.className = 'angka';
    angka.textContent = c.suara;
 
    baris.appendChild(img);
    baris.appendChild(info);
    baris.appendChild(angka);
    h.appendChild(baris);
  });
 
  var tb = el('log');
  tb.innerHTML = '';
  d.log.forEach(function (l) {
    var tr = document.createElement('tr');
    [
      new Date(l.waktu).toLocaleString('id-ID'),
      l.kelas,
      nama[l.kandidat] || l.kandidat
    ].forEach(function (v) {
      var td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}
 
/* ---------- Muat data, login, tombol ---------- */
function muat(action) {
  return panggil(action).then(function (d) {
    el('login').hidden = true;
    el('isi').hidden = false;
    gambar(d);
    if (!timer) timer = setInterval(function () { muat().catch(function () {}); }, REFRESH_MS);
  });
}
 
on('btnMasuk', 'click', function () {
  password = el('pw').value;
  muat().catch(function (e) { el('err').textContent = e.message; });
});
 
on('pw', 'keydown', function (e) {
  if (e.key === 'Enter') el('btnMasuk').click();
});
 
on('btnRefresh', 'click', function () {
  muat().catch(function (e) { alert(e.message); });
});
 
on('btnReset', 'click', function () {
  if (confirm('Hapus SEMUA suara? Tindakan ini tidak bisa dibatalkan.')) {
    muat('reset').catch(function (e) { alert(e.message); });
  }
});
