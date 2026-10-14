var kodeGuru = '';
var kandidatTerpilih = null;
var sibuk = false;
var halaman = ['kode', 'pilih', 'terimakasih'];

function tampil(id) {
  halaman.forEach(function (h) {
    document.getElementById(h).classList.toggle('aktif', h === id);
  });
}

function kirim(body) {
  return fetch('/api/guru-vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function (r) {
    return r.text().then(function (t) {
      var j = {};
      try { j = JSON.parse(t); } catch (e) {}
      if (!r.ok || !j.ok) throw new Error(j.error || ('Server tidak menjawab dengan benar (kode ' + r.status + ')'));
      return j;
    });
  });
}

/* ---------- Langkah 1: cek kode ---------- */
function cekKode() {
  var err = document.getElementById('errKode');
  var btn = document.getElementById('btnKode');
  var kode = document.getElementById('inputKode').value.trim().toUpperCase();
  if (!kode) { err.textContent = 'Masukkan kode terlebih dahulu.'; return; }
  if (sibuk) return;
  sibuk = true; btn.disabled = true; err.textContent = '';

  kirim({ action: 'check', kode: kode }).then(function () {
    kodeGuru = kode;
    tampil('pilih');
  }).catch(function (e) {
    err.textContent = e.message;
  }).then(function () {
    sibuk = false; btn.disabled = false;
  });
}

document.getElementById('btnKode').addEventListener('click', cekKode);
document.getElementById('inputKode').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') cekKode();
});

/* ---------- Langkah 2: konfirmasi dan kirim suara ---------- */
function bukaModal(nama, id) {
  kandidatTerpilih = id;
  document.getElementById('namaKandidat').textContent = nama;
  document.getElementById('modalKonfirmasi').classList.add('aktif');
}

function tutupModal() {
  document.getElementById('modalKonfirmasi').classList.remove('aktif');
  kandidatTerpilih = null;
  sibuk = false;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = false; });
}

function kembaliKeAwal() {
  kodeGuru = '';
  document.getElementById('inputKode').value = '';
  document.getElementById('errPilih').textContent = '';
  tampil('kode');
}

function kirimSuara() {
  if (!kandidatTerpilih || sibuk) return;
  sibuk = true;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = true; });
  document.getElementById('errPilih').textContent = '';

  kirim({ kode: kodeGuru, kandidat: kandidatTerpilih }).then(function () {
    tutupModal();
    tampil('terimakasih');
    setTimeout(kembaliKeAwal, 3200);
  }).catch(function (e) {
    tutupModal();
    document.getElementById('errPilih').textContent = e.message + '. Panggil panitia bila perlu.';
  });
}

document.getElementById('btnTidak').addEventListener('click', tutupModal);
document.getElementById('btnYa').addEventListener('click', kirimSuara);
document.getElementById('modalKonfirmasi').addEventListener('click', function (e) {
  if (e.target === this) tutupModal();
});

/* ---------- Daftar kandidat ---------- */
fetch('/candidates.json')
  .then(function (r) { return r.json(); })
  .then(function (list) {
    var g = document.getElementById('galeri');
    list.forEach(function (c, idx) {
      var b = document.createElement('button');
      b.className = 'kandidat';
      b.type = 'button';
      b.style.animationDelay = (idx * 0.1) + 's';

      var img = document.createElement('img');
      img.src = /^(\/|https?:)/.test(c.foto) ? c.foto : '/' + c.foto;
      img.alt = 'Foto ' + c.nama;

      var s = document.createElement('span');
      s.textContent = c.nama;

      b.appendChild(img);
      b.appendChild(s);
      b.addEventListener('click', function () { bukaModal(c.nama, c.id); });
      g.appendChild(b);
    });
  })
  .catch(function (e) { console.error('Gagal memuat kandidat:', e); });
