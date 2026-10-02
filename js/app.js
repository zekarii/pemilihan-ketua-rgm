var pemilih = { nama: '', kelas: '' };
var sibuk = false;
var halaman = ['nama', 'pilih', 'terimakasih'];

function tampil() {
  var h = (location.hash || '#nama').slice(1);
  if (halaman.indexOf(h) < 0) h = 'nama';
  // halaman pilih/terimakasih tidak boleh dibuka tanpa mengisi nama
  if (h !== 'nama' && !pemilih.nama) { location.hash = '#nama'; return; }
  halaman.forEach(function (id) {
    document.getElementById(id).classList.toggle('aktif', id === h);
  });
  if (h === 'nama') document.getElementById('inNama').focus();
}
window.addEventListener('hashchange', tampil);

function lanjut() {
  var n = document.getElementById('inNama').value.trim();
  var k = document.getElementById('inKelas').value.trim();
  var err = document.getElementById('errNama');
  if (!n || !k) { err.textContent = 'Isi nama dan kelas terlebih dahulu.'; return; }
  err.textContent = '';
  pemilih = { nama: n, kelas: k };
  location.hash = '#pilih';
}
document.getElementById('btnNext').addEventListener('click', lanjut);
['inNama', 'inKelas'].forEach(function (id) {
  document.getElementById(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') lanjut(); });
});

function kembaliKeAwal() {
  pemilih = { nama: '', kelas: '' };
  document.getElementById('inNama').value = '';
  document.getElementById('inKelas').value = '';
  sibuk = false;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = false; });
  location.hash = '#nama';
}

function pilih(id) {
  if (sibuk) return;
  sibuk = true;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = true; });
  document.getElementById('errPilih').textContent = '';
  fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: pemilih.nama, kelas: pemilih.kelas, kandidat: id })
  }).then(function (r) {
    return r.text().then(function (t) {
    var j = {};
    try { j = JSON.parse(t); } catch (e) {}
    return { ok: r.ok, status: r.status, j: j };
  });
  }).then(function (res) {
    if (!res.ok || !res.j.ok) throw new Error(res.j.error || ('Server tidak menjawab dengan benar (kode ' + res.status + ')'));
    location.hash = '#terimakasih';
    setTimeout(kembaliKeAwal, 4500);
  }).catch(function (e) {
    sibuk = false;
    document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = false; });
    document.getElementById('errPilih').textContent = e.message + '. Panggil panitia bila perlu.';
  });
}

fetch('candidates.json').then(function (r) { return r.json(); }).then(function (list) {
  var g = document.getElementById('galeri');
  list.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'kandidat';
    b.type = 'button';
    var img = document.createElement('img');
    img.src = c.foto; img.alt = 'Foto ' + c.nama;
    var s = document.createElement('span');
    s.textContent = c.nama;
    b.appendChild(img); b.appendChild(s);
    b.addEventListener('click', function () { pilih(c.id); });
    g.appendChild(b);
  });
});

tampil();
