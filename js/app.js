const MONTHS = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function $(id) { return document.getElementById(id); }
function postUrl(trip) { return `post.html?id=${encodeURIComponent(trip.id)}`; }

// ── Lightbox (homepage doesn't need it, but keep for consistency) ──
function initLightbox() {
  const lb = $('lightbox');
  if (!lb) return;
  const close = $('lightboxClose');
  close.addEventListener('click', () => lb.classList.remove('open'));
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });
}

// ── Featured post (most recent trip) ─────────────────────────
function buildFeatured(trip) {
  const monthName = MONTHS[trip.month] || '';
  const url = postUrl(trip);
  const hasImg = trip.cover && trip.cover !== '';

  const el = document.createElement('a');
  el.className = 'featured-post reveal';
  el.href = url;

  const imgHtml = hasImg
    ? `<img src="${trip.cover}" alt="${trip.country}" loading="eager">`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1612,#2d2520)"></div>`;

  el.innerHTML = `
    <div class="featured-post__img-wrap">
      ${imgHtml}
      <span class="featured-post__label t-label">Latest</span>
    </div>
    <div class="featured-post__meta">
      <p class="t-label featured-post__issue">${trip.year} — No. ${String(trip.month).padStart(2,'0')}</p>
      <h2 class="featured-post__country">${trip.country}</h2>
      ${trip.city ? `<p class="featured-post__city">${trip.city}</p>` : ''}
      <p class="featured-post__desc">${monthName} ${trip.year}</p>
      <span class="featured-post__cta">
        View journal
        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </div>
  `;
  return el;
}

// ── Archive card ──────────────────────────────────────────────
function buildArchiveCard(trip, idx) {
  const monthName = MONTHS[trip.month] || '';
  const url = postUrl(trip);
  const hasImg = trip.cover && trip.cover !== '';
  const hues = [220, 30, 140, 280, 10, 180];
  const h = hues[idx % hues.length];

  const el = document.createElement('a');
  el.className = 'archive-card reveal';
  el.href = url;

  const imgHtml = hasImg
    ? `<img src="${trip.cover}" alt="${trip.country}" loading="lazy">`
    : `<div class="archive-card__img-placeholder" style="background:linear-gradient(135deg,hsl(${h},20%,12%),hsl(${h},15%,22%))"></div>`;

  el.innerHTML = `
    <div class="archive-card__img-wrap">${imgHtml}</div>
    <div class="archive-card__body">
      <p class="t-label archive-card__month">${monthName} ${trip.year}</p>
      <h3 class="archive-card__country">${trip.country}</h3>
      ${trip.city ? `<p class="archive-card__city">${trip.city}</p>` : ''}
    </div>
  `;
  return el;
}

// ── Year label divider ────────────────────────────────────────
function buildYearDivider(year) {
  const el = document.createElement('div');
  el.className = 'archive-heading';
  el.innerHTML = `
    <span class="t-label" style="color:var(--color-muted)">${year}</span>
    <div class="archive-heading__line"></div>
  `;
  return el;
}

// ── Render ────────────────────────────────────────────────────
function render(data) {
  const container = $('tripsContainer');
  container.innerHTML = '';

  // Sort all trips: newest first
  const trips = [...data.trips].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  if (trips.length === 0) {
    container.innerHTML = `
      <div class="container" style="padding:var(--gap-xl) 0;text-align:center">
        <p class="t-label" style="color:var(--color-gold);margin-bottom:1rem">No trips yet</p>
        <p class="t-caption">Add your first trip to <code>data/trips.json</code> to get started.</p>
      </div>
    `;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'container';

  // Featured — top trip
  const featured = buildFeatured(trips[0]);
  wrapper.appendChild(featured);

  // Rest grouped by year
  if (trips.length > 1) {
    const rest = trips.slice(1);
    const byYear = {};
    rest.forEach(t => {
      if (!byYear[t.year]) byYear[t.year] = [];
      byYear[t.year].push(t);
    });
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    years.forEach(year => {
      wrapper.appendChild(buildYearDivider(year));
      const grid = document.createElement('div');
      grid.className = 'archive-grid';
      byYear[year].forEach((trip, i) => grid.appendChild(buildArchiveCard(trip, i)));
      wrapper.appendChild(grid);
    });
  }

  container.appendChild(wrapper);

  // Scroll reveal
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  const header = $('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  $('footerYear').textContent = `© ${new Date().getFullYear()}`;
  initLightbox();

  try {
    const res = await fetch('data/trips.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
  } catch (err) {
    $('tripsContainer').innerHTML = `
      <div class="container" style="padding:var(--gap-xl) 0;text-align:center">
        <p class="t-label" style="color:var(--color-gold);margin-bottom:1rem">No trips yet</p>
        <p class="t-caption">Add your first trip to <code>data/trips.json</code>.</p>
      </div>
    `;
    console.error('Failed to load trips:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);