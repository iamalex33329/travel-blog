const MONTHS = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function $(id) { return document.getElementById(id); }

// ── Lightbox ─────────────────────────────────────────────────

function initLightbox() {
  const lb = $('lightbox');
  const img = $('lightboxImg');
  const cap = $('lightboxCaption');
  const close = $('lightboxClose');
  let images = [];
  let current = 0;

  function open(src, caption, allImages, idx) {
    images = allImages || [];
    current = idx || 0;
    img.src = src;
    img.alt = caption || '';
    cap.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { img.src = ''; }, 300);
  }

  close.addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight' && images.length > 1) {
      current = (current + 1) % images.length;
      img.src = images[current].src;
      cap.textContent = images[current].caption || '';
    }
    if (e.key === 'ArrowLeft' && images.length > 1) {
      current = (current - 1 + images.length) % images.length;
      img.src = images[current].src;
      cap.textContent = images[current].caption || '';
    }
  });

  return { open };
}

// ── Gallery Renderer ─────────────────────────────────────────

function renderGallery(blocks, lightbox, allPhotos) {
  const gallery = $('gallery');
  let photoIndex = 0;

  blocks.forEach((block, blockIdx) => {
    const el = document.createElement('div');
    el.className = `gallery-block gallery-block--${block.layout || 'full'} reveal`;

    switch (block.layout) {

      case 'text': {
        el.innerHTML = `
          <div class="gallery-block--text">
            ${block.quote ? `<p class="block-pull-quote">${block.quote}</p>` : ''}
            ${block.body ? `<p class="block-body">${block.body}</p>` : ''}
          </div>
        `;
        break;
      }

      case 'half': {
        const photos = block.photos || [];
        const leftImgs = photos.slice(0, Math.ceil(photos.length / 2));
        const rightImgs = photos.slice(Math.ceil(photos.length / 2));

        const makeCol = (imgs) => imgs.map(p => {
          const idx = photoIndex++;
          return `
            <div class="gallery-block__img-wrap" style="cursor:zoom-in" data-idx="${idx}">
              <img src="${p.src}" alt="${p.caption || ''}" loading="lazy">
            </div>
          `;
        }).join('');

        el.innerHTML = `
          <div class="gallery-block__col">${makeCol(leftImgs)}</div>
          <div class="gallery-block__col">${makeCol(rightImgs)}</div>
        `;

        const caption = photos[0]?.caption || '';
        if (caption) {
          el.insertAdjacentHTML('beforeend', `
            <div class="gallery-block__caption-area">
              <p class="t-caption gallery-block__caption">${caption}</p>
              <span class="gallery-block__num t-label">0${blockIdx + 1}</span>
            </div>
          `);
        }
        break;
      }

      case 'trio': {
        const photos = block.photos || [];
        el.innerHTML = photos.map(p => {
          const idx = photoIndex++;
          return `
            <div class="gallery-block__img-wrap" style="cursor:zoom-in" data-idx="${idx}">
              <img src="${p.src}" alt="${p.caption || ''}" loading="lazy">
            </div>
          `;
        }).join('');
        break;
      }

      case 'featured': {
        const photos = block.photos || [];
        const main = photos[0];
        const side = photos.slice(1, 3);
        const mainIdx = photoIndex++;

        el.innerHTML = `
          <div class="gallery-block__main gallery-block__img-wrap" style="cursor:zoom-in" data-idx="${mainIdx}">
            <img src="${main?.src || ''}" alt="${main?.caption || ''}" loading="lazy">
          </div>
          <div class="gallery-block__side">
            ${side.map(p => {
              const idx = photoIndex++;
              return `
                <div class="gallery-block__img-wrap" style="cursor:zoom-in" data-idx="${idx}">
                  <img src="${p.src}" alt="${p.caption || ''}" loading="lazy">
                </div>
              `;
            }).join('')}
          </div>
        `;

        const caption = main?.caption || '';
        if (caption) {
          el.insertAdjacentHTML('beforeend', `
            <div class="gallery-block__caption-area">
              <p class="t-caption gallery-block__caption">${caption}</p>
              <span class="gallery-block__num t-label">0${blockIdx + 1}</span>
            </div>
          `);
        }
        break;
      }

      case 'portrait': {
        const photo = block.photo || {};
        const idx = photoIndex++;
        el.innerHTML = `
          <div class="gallery-block__img-wrap" style="cursor:zoom-in" data-idx="${idx}">
            <img src="${photo.src || ''}" alt="${photo.caption || ''}" loading="lazy">
          </div>
          ${photo.caption ? `
            <div class="gallery-block__caption-area">
              <p class="t-caption gallery-block__caption">${photo.caption}</p>
              <span class="gallery-block__num t-label">0${blockIdx + 1}</span>
            </div>
          ` : ''}
        `;
        break;
      }

      // Default: full-width
      default: {
        const photo = block.photo || {};
        const idx = photoIndex++;
        el.innerHTML = `
          <div class="gallery-block__img-wrap" style="cursor:zoom-in" data-idx="${idx}">
            <img src="${photo.src || ''}" alt="${photo.caption || ''}" loading="lazy">
          </div>
          ${photo.caption ? `
            <div class="gallery-block__caption-area">
              <p class="t-caption gallery-block__caption">${photo.caption}</p>
              <span class="gallery-block__num t-label">0${blockIdx + 1}</span>
            </div>
          ` : ''}
        `;
        break;
      }
    }

    gallery.appendChild(el);
  });

  // Click handlers for lightbox
  gallery.querySelectorAll('[data-idx]').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const idx = parseInt(wrap.dataset.idx, 10);
      const img = wrap.querySelector('img');
      lightbox.open(img.src, img.alt, allPhotos, idx);
    });
  });
}

// ── Post Navigation ───────────────────────────────────────────

async function loadPostNav(currentId) {
  try {
    const res = await fetch('data/trips.json');
    const data = await res.json();
    const trips = data.trips.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
    const idx = trips.findIndex(t => t.id === currentId);
    if (idx === -1) return;

    const prev = trips[idx + 1];
    const next = trips[idx - 1];
    const nav = $('postNav');
    const prevEl = $('navPrev');
    const nextEl = $('navNext');

    if (prev || next) {
      nav.style.display = '';

      if (prev) {
        $('navPrevTitle').textContent = `${prev.country}`;
        prevEl.style.cursor = 'pointer';
        prevEl.addEventListener('click', () => {
          window.location.href = `post.html?id=${encodeURIComponent(prev.id)}`;
        });
      } else {
        prevEl.style.opacity = '0.3';
        prevEl.style.pointerEvents = 'none';
      }

      if (next) {
        $('navNextTitle').textContent = `${next.country}`;
        nextEl.style.cursor = 'pointer';
        nextEl.addEventListener('click', () => {
          window.location.href = `post.html?id=${encodeURIComponent(next.id)}`;
        });
      } else {
        nextEl.style.opacity = '0.3';
        nextEl.style.pointerEvents = 'none';
      }
    }
  } catch (e) {
    // nav optional
  }
}

// ── Init ──────────────────────────────────────────────────────

async function init() {
  // Header scroll
  const header = $('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  $('footerYear').textContent = `© ${new Date().getFullYear()}`;

  const lightbox = initLightbox();

  // Read post ID from URL
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    document.title = 'Not Found';
    $('gallery').innerHTML = `<p class="t-caption" style="padding:4rem 0;text-align:center">Post not found. <a href="index.html" style="color:var(--color-gold)">Return home →</a></p>`;
    return;
  }

  try {
    const res = await fetch(`data/posts/${postId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const post = await res.json();

    // Apply accent color
    if (post.accent) {
      document.body.style.setProperty('--accent', post.accent);
    }

    // Update page title & meta
    document.title = `${post.title}`;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', post.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', post.description || '');

    // Hero
    if (post.cover) {
      $('postHeroImg').innerHTML = `<img src="${post.cover}" alt="${post.title}" style="width:100%;height:100%;object-fit:cover">`;
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', post.cover);
    }

    const monthName = MONTHS[post.month] || '';
    $('postMonthText').textContent = `${monthName} ${post.year}`;
    $('postTitle').textContent = post.country || post.title;
    $('postDesc').textContent = post.description || '';
    $('breadcrumbTitle').textContent = post.country || post.title;
    $('breadcrumbYear').textContent = post.year;
    $('breadcrumbYear').href = `index.html#year-${post.year}`;

    // Meta bar
    $('metaCountry').textContent = post.country || '—';
    $('metaCity').textContent = post.city || '—';
    $('metaMonth').textContent = monthName;

    // Count all photos across blocks
    let photoCount = 0;
    const allPhotos = [];
    (post.blocks || []).forEach(block => {
      if (block.layout === 'full' || block.layout === 'portrait') {
        if (block.photo) { allPhotos.push(block.photo); photoCount++; }
      } else if (block.layout === 'half' || block.layout === 'trio' || block.layout === 'featured') {
        (block.photos || []).forEach(p => { allPhotos.push(p); photoCount++; });
      }
    });
    $('metaPhotoCount').textContent = `${photoCount} photo${photoCount !== 1 ? 's' : ''}`;

    // Render gallery
    renderGallery(post.blocks || [], lightbox, allPhotos);

    // Post navigation
    loadPostNav(postId);

    // Intersection observer
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  } catch (err) {
    console.error('Failed to load post:', err);
    $('gallery').innerHTML = `
      <p class="t-caption" style="padding:4rem 0;text-align:center">
        Could not load this post.<br>
        <a href="index.html" style="color:var(--color-gold)">Return home →</a>
      </p>
    `;
  }
}

document.addEventListener('DOMContentLoaded', init);