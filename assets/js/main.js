/* ==========================================================================
   EcoHydroLab — shared behaviour
   ========================================================================== */

// Mobile nav toggle
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const open = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

// Scroll reveal
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

// ---- Data loader helper ----
async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error('Failed to load', path, err);
    return null;
  }
}

// ---- Publications renderer ----
async function renderPublications(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const data = await loadJSON('data/publications.json');
  if (!data) { mount.innerHTML = '<p class="muted">Publications list could not be loaded.</p>'; return; }

  const tags = [...new Set(data.flatMap(p => p.tags || []))].sort();
  const controls = document.getElementById('pub-filters');
  let active = 'all';

  function draw() {
    const filtered = active === 'all' ? data : data.filter(p => (p.tags || []).includes(active));
    const byYear = {};
    filtered.forEach(p => { (byYear[p.year] = byYear[p.year] || []).push(p); });
    const years = Object.keys(byYear).sort((a, b) => b - a);
    mount.innerHTML = years.map(y => `
      <div class="pub-year">${y}</div>
      ${byYear[y].map(pubHTML).join('')}
    `).join('') || '<p class="muted">No publications match this filter.</p>';
  }

  function pubHTML(p) {
    const badge = p.featured
      ? '<span class="pub-badge featured">Featured</span>'
      : `<span class="pub-badge">${(p.type || 'Article')}</span>`;
    const links = (p.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`).join('');
    return `
      <div class="pub">
        <div>${badge}</div>
        <div>
          <div class="pub-title">${p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">${p.title}</a>` : p.title}</div>
          <div class="pub-meta">${p.authors} &middot; <span class="pub-venue">${p.venue}</span>${p.volume ? ', ' + p.volume : ''}</div>
          ${links ? `<div class="pub-links">${links}</div>` : ''}
        </div>
      </div>`;
  }

  if (controls) {
    const btns = ['all', ...tags];
    controls.innerHTML = btns.map(t =>
      `<button class="filter-btn ${t === 'all' ? 'active' : ''}" data-tag="${t}">${t === 'all' ? 'All' : t}</button>`
    ).join('');
    controls.addEventListener('click', e => {
      const b = e.target.closest('.filter-btn');
      if (!b) return;
      active = b.dataset.tag;
      controls.querySelectorAll('.filter-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  }
  draw();
}

// ---- Team renderer ----
async function renderTeam(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const data = await loadJSON('data/team.json');
  if (!data) { mount.innerHTML = '<p class="muted">Team list could not be loaded.</p>'; return; }

  const groups = data.groups || [];
  mount.innerHTML = groups.map(g => `
    <h2 class="team-group-title">${g.title}</h2>
    <div class="grid grid-4">
      ${g.members.map(personHTML).join('')}
    </div>
  `).join('');

  function personHTML(m) {
    const initials = m.name.split(' ').map(s => s[0]).slice(0, 2).join('');
    const img = m.photo
      ? `<img class="avatar" src="${m.photo}" alt="Photo of ${m.name}">`
      : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:2rem;color:var(--river)">${initials}</div>`;
    const socials = (m.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('');
    return `
      <div class="person">
        ${img}
        <h3>${m.name}</h3>
        <div class="role">${m.role}</div>
        ${m.desc ? `<div class="desc">${m.desc}</div>` : ''}
        ${socials ? `<div class="socials">${socials}</div>` : ''}
      </div>`;
  }
}

// ---- News renderer ----
async function renderNews(mountId, limit) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const data = await loadJSON('data/news.json');
  if (!data) { mount.innerHTML = '<p class="muted">News could not be loaded.</p>'; return; }
  const items = limit ? data.slice(0, limit) : data;
  mount.innerHTML = items.map(n => `
    <div class="news-item">
      <div class="news-date">${n.date}</div>
      <div class="news-body"><p>${n.text}</p></div>
    </div>
  `).join('');
}
