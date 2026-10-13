var KELAS = {
  'X':   ['XA', 'XB', 'XC', 'XD'],
  'XI':  ['XI IPA 1', 'XI IPA 2', 'XI IPS 1', 'XI IPS 2', 'XI IAI 1'],
  'XII': ['XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XII IAI 1']
};

var pemilih = { kelas: '' };
var sibuk = false;
var halaman = ['nama', 'pilih', 'terimakasih'];
var kandidatTerpilih = null;

/* ---------- ya ini biar dropdownnya kek Google Forms ---------- */
function Dropdown(root, placeholder, onChange) {
  var btn = root.querySelector('.dd-btn');
  var label = root.querySelector('.dd-val');
  var list = root.querySelector('.dd-list');
  var opts = [], active = -1;
  var self = { value: '' };

  function render() {
    list.innerHTML = '';
    opts.forEach(function (o, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.textContent = o;
      if (o === self.value) { li.classList.add('dipilih'); li.setAttribute('aria-selected', 'true'); }
      li.addEventListener('mousedown', function (e) { e.preventDefault(); });
      li.addEventListener('click', function () { pick(i); });
      list.appendChild(li);
    });
  }

  function mark(i) {
    active = i;
    Array.prototype.forEach.call(list.children, function (li, k) {
      li.classList.toggle('aktif', k === i);
    });
    if (list.children[i]) list.children[i].scrollIntoView({ block: 'nearest' });
  }

  function isOpen() { return root.classList.contains('buka'); }

  function open() {
    if (btn.disabled || !opts.length) return;
    root.classList.add('buka');
    btn.setAttribute('aria-expanded', 'true');
    mark(Math.max(opts.indexOf(self.value), 0));
    list.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function close() {
    root.classList.remove('buka');
    btn.setAttribute('aria-expanded', 'false');
  }

  function pick(i) {
    self.value = opts[i];
    label.textContent = self.value;
    root.classList.add('terisi');
    document.getElementById('errNama').textContent = '';
    render();
    close();
    btn.focus();
    if (onChange) onChange(self.value);
  }

  btn.addEventListener('click', function () { isOpen() ? close() : open(); });

  btn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen()) { open(); return; }
      mark(Math.min(opts.length - 1, Math.max(0, active + (e.key === 'ArrowDown' ? 1 : -1))));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isOpen() ? pick(active) : open();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      close();
    }
  });

  document.addEventListener('click', function (e) {
    if (!root.contains(e.target)) close();
  });

  self.setOptions = function (arr, ph) {
    opts = arr;
    self.value = '';
    label.textContent = ph || placeholder;
    root.classList.remove('terisi');
    btn.disabled = !arr.length;
    close();
    render();
  };
  self.clear = function () { self.setOptions(opts, placeholder); };
  self.focus = function () { btn.focus(); };
  return self;
}

var ddKelas = Dropdown(document.getElementById('ddKelas'), 'Pilih kelas');
var ddJenjang = Dropdown(document.getElementById('ddJenjang'), 'Pilih jenjang', function (v) {
  ddKelas.setOptions(KELAS[v] || [], 'Pilih kelas');
});

function resetPilihan() {
  ddJenjang.setOptions(['X', 'XI', 'XII'], 'Pilih jenjang');
  ddKelas.setOptions([], 'Pilih jenjang dulu');
}
resetPilihan();

/* ---------- Navigasi halaman ---------- */
function tampil() {
  var h = (location.hash || '#nama').slice(1);
  if (halaman.indexOf(h) < 0) h = 'nama';
  if (h !== 'nama' && !pemilih.kelas) { location.hash = '#nama'; return; }
  halaman.forEach(function (id) {
    document.getElementById(id).classList.toggle('aktif', id === h);
  });
}

window.addEventListener('hashchange', tampil);

function lanjut() {
  var err = document.getElementById('errNama');
  if (!ddJenjang.value || !ddKelas.value) {
    err.textContent = 'Pilih jenjang dan kelas terlebih dahulu.';
    return;
  }
  err.textContent = '';
  pemilih = { kelas: ddKelas.value };
  location.hash = '#pilih';
}

document.getElementById('btnNext').addEventListener('click', lanjut);

function kembaliKeAwal() {
  pemilih = { kelas: '' };
  resetPilihan();
  sibuk = false;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = false; });
  location.hash = '#nama';
}

/* ---------- Konfirmasi dan kirim suara ---------- */
function bukaModal(namaKandidat, id) {
  kandidatTerpilih = id;
  document.getElementById('namaKandidat').textContent = namaKandidat;
  document.getElementById('modalKonfirmasi').classList.add('aktif');
}

function tutupModal() {
  document.getElementById('modalKonfirmasi').classList.remove('aktif');
  kandidatTerpilih = null;
  sibuk = false;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = false; });
}

function kirimSuara() {
  if (!kandidatTerpilih || sibuk) return;
  sibuk = true;
  document.querySelectorAll('.kandidat').forEach(function (b) { b.disabled = true; });
  document.getElementById('errPilih').textContent = '';

  fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kelas: pemilih.kelas, kandidat: kandidatTerpilih })
  }).then(function (r) {
    return r.text().then(function (t) {
      var j = {};
      try { j = JSON.parse(t); } catch (e) {}
      return { ok: r.ok, status: r.status, j: j };
    });
  }).then(function (res) {
    tutupModal();
    if (!res.ok || !res.j.ok) throw new Error(res.j.error || ('Server tidak menjawab dengan benar (kode ' + res.status + ')'));
    location.hash = '#terimakasih';
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
  .catch(function (e) {
    console.error('Gagal memuat kandidat:', e);
  });

tampil();
