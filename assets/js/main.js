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
// Returns { data } on success or { error } on failure, so callers can show why.
async function loadJSON(path) {
  let res;
  try {
    res = await fetch(path);
  } catch (err) {
    return { error: 'Network error fetching ' + path + ' — ' + err.message };
  }
  if (!res.ok) {
    return { error: 'Could not load ' + path + ' (HTTP ' + res.status + '). Check the file exists and the name/case matches exactly.' };
  }
  const text = await res.text();
  try {
    return { data: JSON.parse(text) };
  } catch (err) {
    return { error: 'The file ' + path + ' loaded but is not valid JSON: ' + err.message + '. Common causes: a smart/curly quote (“ ” ‘ ’) instead of straight ("), or a trailing comma.' };
  }
}
function showError(mount, msg) {
  mount.innerHTML = '<p style="color:#b23b3b;font-family:var(--mono);font-size:.85rem;line-height:1.6">' + msg + '</p>';
  console.error(msg);
}

// ---- Publications renderer ----
async function renderPublications(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const result = await loadJSON('data/publications.json');
  if (result.error) { showError(mount, result.error); return; }
  const data = result.data;

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

// ---- Team <-> Publications matching ----
// Publications list authors as "Lastname, I. I." — pull out (lastname, first-initial) pairs.
function extractPubAuthors(authorsStr) {
  const out = [];
  const re = /([A-Z][A-Za-z'-]+),\s*((?:[A-Z]\.\s*)+)/g;
  let m;
  while ((m = re.exec(authorsStr))) {
    out.push({ lastname: m[1], initial: m[2].trim()[0] });
  }
  return out;
}
// Team names are "First [Middle] Last" (usually), occasionally "Surname Initials" (e.g. "Nagashree GE").
// Try both readings and see if either matches a (lastname, initial) pair from the publication.
function findMemberPublications(memberName, pubs) {
  const clean = memberName.replace(/\(.*?\)/g, '').replace(/^(Dr\.|Prof\.)\s*/, '').trim();
  const tokens = clean.split(/\s+/);
  if (tokens.length < 2) return [];
  const candidates = [
    { surname: tokens[tokens.length - 1], initial: tokens[0][0] }, // standard order
    { surname: tokens[0], initial: tokens[1][0] }                  // reversed (surname-first) order
  ];
  return pubs.filter(p => {
    const authors = extractPubAuthors(p.authors);
    return authors.some(a => candidates.some(c =>
      c.surname.toLowerCase() === a.lastname.toLowerCase() &&
      c.initial.toLowerCase() === a.initial.toLowerCase()
    ));
  }).sort((a, b) => b.year - a.year);
}

// ---- Team renderer ----
async function renderTeam(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const result = await loadJSON('data/team.json');
  if (result.error) { showError(mount, result.error); return; }
  const data = result.data;

  const pubsResult = await loadJSON('data/publications.json');
  const pubs = pubsResult.data || [];

  const groups = data.groups || [];
  let lastSection = null;
  mount.innerHTML = groups.map(g => {
    let heading = '';
    if (g.section) {
      // Parent section heading — printed once, when it first appears
      if (g.section !== lastSection) {
        heading += `<h2 class="team-group-title">${g.section}</h2>`;
        lastSection = g.section;
      }
      // Subsection label under the parent
      heading += `<h3 class="team-subgroup-title">${g.title}</h3>`;
    } else {
      heading = `<h2 class="team-group-title">${g.title}</h2>`;
      lastSection = null;
    }
    const isPI = g.title === 'Principal Investigator';
    const showPubs = !isPI;
    const gridClass = isPI ? 'grid pi-grid' : 'grid grid-4';
    return `
    ${heading}
    ${g.groupByYear ? membersByYear(g.members) : `<div class="${gridClass}">${g.members.map(m => personHTML(m, showPubs)).join('')}</div>`}
  `;
  }).join('');

  function membersByYear(members) {
    // Bucket members by the year found in their role (e.g. "M.Tech · 2024"); newest first
    const buckets = {};
    members.forEach(m => {
      const match = (m.role || '').match(/\b(19|20)\d{2}\b/);
      const year = match ? match[0] : 'Other';
      (buckets[year] = buckets[year] || []).push(m);
    });
    const years = Object.keys(buckets).sort((a, b) => (b === 'Other' ? -1 : a === 'Other' ? 1 : b - a));
    return years.map(y => `
      <div class="team-year-title">${y === 'Other' ? 'Other' : 'Class of ' + y}</div>
      <div class="grid grid-4">${buckets[y].map(personHTML).join('')}</div>
    `).join('');
  }

  function personHTML(m, showPubs) {
    const initials = m.name.split(' ').map(s => s[0]).slice(0, 2).join('');
    const img = m.photo
      ? `<img class="avatar" src="${m.photo}" alt="Photo of ${m.name}">`
      : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:2rem;color:var(--river)">${initials}</div>`;
    const socials = (m.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('');

    const matched = (showPubs && pubs.length) ? findMemberPublications(m.name, pubs) : [];
    const shown = matched.slice(0, 4);
    const remaining = matched.length - shown.length;
    const pubsHTML = matched.length ? `
      <div class="pubs">
        <div class="pubs-title">Publications</div>
        <ul>
          ${shown.map(p => `
            <li>
              ${p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">${p.title}</a>` : p.title}
              <span class="pub-year">— ${p.year}</span>
            </li>`).join('')}
        </ul>
        ${remaining > 0 ? `<div class="pubs-more"><a href="publications.html">+${remaining} more on the Publications page ↗</a></div>` : ''}
      </div>` : '';

    return `
      <div class="person">
        ${img}
        <h3>${m.name}</h3>
        <div class="role">${m.role}</div>
        ${m.desc ? `<div class="desc">${m.desc}</div>` : ''}
        ${socials ? `<div class="socials">${socials}</div>` : ''}
        ${pubsHTML}
      </div>`;
  }
}

// ---- News renderer ----
async function renderNews(mountId, limit) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const result = await loadJSON('data/news.json');
  if (result.error) { showError(mount, result.error); return; }
  const data = result.data;
  const items = limit ? data.slice(0, limit) : data;
  mount.innerHTML = items.map(n => `
    <div class="news-item">
      <div class="news-date">${n.date}</div>
      <div class="news-body"><p>${n.text}</p></div>
    </div>
  `).join('');
}
