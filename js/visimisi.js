(function () {
  const btn   = document.getElementById('btnVisiMisi');
  const modal = document.getElementById('modalVisiMisi');
  const grid  = document.getElementById('vmGrid');
  const FADE_MS = 250; // samakan dengan durasi di CSS
  let data = null;
  let closing = false;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function load() {
    if (data) return data;
    const res = await fetch('/candidates.json');
    const json = await res.json();
    data = Array.isArray(json) ? json : (json.candidates || json.kandidat || []);
    return data;
  }

  function render(list) {
    grid.innerHTML = list.map((c, i) => {
      const misi = Array.isArray(c.misi) ? c.misi : (c.misi ? [c.misi] : []);
      return `
        <article class="vm-card">
          <span class="vm-no">${esc(c.nomor ?? String(i + 1).padStart(2, '0'))}</span>
          <h3>${esc(c.nama ?? c.name)}</h3>
          <h4>Visi</h4>
          <p>${esc(c.visi) || '-'}</p>
          <h4>Misi</h4>
          <ol>${misi.map(m => `<li>${esc(m)}</li>`).join('') || '<li>-</li>'}</ol>
        </article>`;
    }).join('');
  }

  function open() {
    closing = false;
    modal.classList.remove('menutup');
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (modal.hidden || closing) return;
    closing = true;
    modal.classList.add('menutup');
    setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('menutup');
      document.body.style.overflow = '';
      closing = false;
    }, FADE_MS);
  }

  btn.addEventListener('click', async () => {
    try {
      render(await load());
    } catch (e) {
      grid.innerHTML = '<p>Visi & misi belum dapat dimuat.</p>';
    }
    open();
  });

  modal.addEventListener('click', e => {
    if (e.target === modal || e.target.closest('.vm-close')) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
})();
