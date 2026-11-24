/* ===== THEME (saved choice > OS preference) ===== */
(function () {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if ((saved || 'dark') === 'dark') document.documentElement.classList.add('dark');
})();

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('[data-theme-icon]').forEach((el) => (el.textContent = isDark ? '☀️' : '🌙'));
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcon();
    })
  );

  /* Mobile menu */
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
  }

  /* Highlight current page in nav */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-pill').forEach((l) => {
    if (l.getAttribute('href') === page) l.classList.add('active');
  });

  /* Helper: run a callback once when an element scrolls into view */
  function onceVisible(selector, threshold, cb) {
    const els = document.querySelectorAll(selector);
    if (!('IntersectionObserver' in window)) return els.forEach(cb);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
    }, { threshold, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* Fade-in on scroll */
  onceVisible('.reveal', 0.15, (el) => el.classList.add('is-visible'));

  /* Skill bars */
  onceVisible('.skill-fill', 0.4, (el) => (el.style.width = (el.dataset.level || 0) + '%'));

  /* Animated counters */
  onceVisible('[data-counter]', 0.5, (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = target + suffix;
    })(start);
  });

  /* Contact form. If the form has a data-endpoint (e.g. a Formspree URL) it sends in the
     background; otherwise it opens the visitor's email app with the message filled in. */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const status = form.querySelector('[data-form-status]');
      const data = new FormData(form);
      status.classList.remove('hidden');
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('failed');
          status.textContent = 'Thank you — your message has been sent.';
          form.reset();
        } catch (err) {
          status.textContent = 'Something went wrong. Please email me directly instead.';
        }
      } else {
        const mail = document.querySelector('a[href^="mailto:"]:not([data-dev])');
        const to = mail ? mail.getAttribute('href').replace('mailto:', '') : '';
        const body = 'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\n\n' + data.get('message');
        status.textContent = 'Opening your email app…';
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(data.get('subject') || 'Website enquiry') + '&body=' + encodeURIComponent(body);
      }
    });
  }
});

/* ==========================================================================
   v2 FEATURES — progress bar, spotlight, command menu (Ctrl/Cmd + K), toast,
   copy email, live local time, rotating words, project filters + popup
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // EDIT THIS: WhatsApp link used by the command menu (Ctrl/Cmd + K) — country code + number, digits only
  const WHATSAPP_URL = 'https://wa.me/16033221676';

  /* ---------- Toast ---------- */
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---------- Scroll progress bar ---------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Cursor spotlight on cards (mouse devices only) ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  }

  /* ---------- Copy to clipboard ---------- */
  function copyText(text, msg) {
    const done = () => showToast(msg || 'Copied to clipboard');
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { showToast('Copy failed — please copy it manually'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else { fallback(); }
  }
  // Email comes from the first mailto: link on the page, so you only edit it in one place
  function siteEmail() {
    const a = document.querySelector('a[href^="mailto:"]:not([data-dev])');
    return a ? a.getAttribute('href').replace('mailto:', '') : '';
  }
  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      const a = card && card.querySelector('a[href^="mailto:"]:not([data-dev])');
      copyText(a ? a.getAttribute('href').replace('mailto:', '') : siteEmail(), 'Email copied');
    });
  });

  /* ---------- Live local time badge ---------- */
  const timeEls = document.querySelectorAll('[data-local-time]');
  function tickTime() {
    timeEls.forEach((el) => {
      try {
        el.textContent = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: el.dataset.tz || undefined,
        }).format(new Date());
      } catch (err) { if (el.parentElement) el.parentElement.style.display = 'none'; }
    });
  }
  if (timeEls.length) { tickTime(); setInterval(tickTime, 30000); }

  /* ---------- Rotating words in the hero ---------- */
  document.querySelectorAll('[data-rotate]').forEach((el) => {
    const words = (el.dataset.words || '').split('|').filter(Boolean);
    if (words.length < 2 || reduceMotion) return;
    let i = 0;
    setInterval(() => {
      el.classList.add('rot-out');
      setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove('rot-out'); }, 280);
    }, 2400);
  });

  /* ---------- Command menu (Ctrl/Cmd + K) ---------- */
  const pages = [
    ['Home', 'index.html', '🏠'], ['About', 'about.html', '👤'], ['Education & Skills', 'education.html', '🎓'],
    ['Projects', 'projects.html', '🗂️'], ['Experience', 'experience.html', '💼'], ['Résumé', 'resume.html', '📄'],
    ['Perspectives', 'perspectives.html', '✍️'], ['Gallery', 'gallery.html', '📷'], ['Contact', 'contact.html', '✉️'],
  ];
  const items = pages.map(([label, href, icon]) => ({ group: 'Page', label, icon, run: () => { window.location.href = href; } }))
    .concat([
      { group: 'Action', label: 'Toggle dark / light mode', icon: '🌗', run: () => { const t = document.querySelector('[data-theme-toggle]'); if (t) t.click(); } },
      { group: 'Action', label: 'Copy email address', icon: '📋', run: () => copyText(siteEmail(), 'Email copied') },
      { group: 'Action', label: 'Download résumé (PDF)', icon: '⬇️', run: () => { const a = document.createElement('a'); a.href = 'assets/resume.pdf'; a.download = 'John-Kapisha-Resume.pdf'; a.click(); } },
      { group: 'Action', label: 'Download research essay (PDF)', icon: '🌾', run: () => { const a = document.createElement('a'); a.href = 'assets/research-essay.pdf'; a.download = 'John-Kapisha-Research-Essay.pdf'; a.click(); } },
      { group: 'Action', label: 'Message on WhatsApp', icon: '💬', run: () => window.open(WHATSAPP_URL, '_blank', 'noopener') },
    ]);

  const dlg = document.createElement('dialog');
  dlg.className = 'overlay-dialog palette';
  dlg.setAttribute('aria-label', 'Command menu');
  dlg.innerHTML = '<div class="overlay-box palette-box"><input type="text" placeholder="Search pages and actions…" aria-label="Search pages and actions" autocomplete="off" /><ul role="listbox"></ul><p class="palette-hint">↑↓ navigate · Enter select · Esc close</p></div>';
  document.body.appendChild(dlg);
  const input = dlg.querySelector('input');
  const list = dlg.querySelector('ul');
  let shown = [];
  let active = 0;

  function mark() {
    Array.prototype.forEach.call(list.children, (li, i) => li.setAttribute('aria-selected', i === active));
    const el = list.children[active];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  function run(item) { dlg.close(); item.run(); }
  function render() {
    const plain = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = plain(input.value.trim());
    shown = items.filter((it) => plain(it.label).indexOf(q) !== -1);
    active = 0;
    list.innerHTML = '';
    if (!shown.length) {
      const li = document.createElement('li');
      li.className = 'palette-empty'; li.textContent = 'No results';
      list.appendChild(li);
      return;
    }
    shown.forEach((it, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.innerHTML = '<span aria-hidden="true">' + it.icon + '</span><span class="grow"></span><small>' + it.group + '</small>';
      li.querySelector('.grow').textContent = it.label;
      li.addEventListener('click', () => run(it));
      li.addEventListener('mousemove', () => { if (active !== idx) { active = idx; mark(); } });
      list.appendChild(li);
    });
    mark();
  }
  function openPalette() { input.value = ''; render(); dlg.showModal(); input.focus(); }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
    else if (e.key === 'Enter' && shown[active]) { e.preventDefault(); run(shown[active]); }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg.open) dlg.close(); else openPalette();
    }
  });

  const themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-btn';
    btn.setAttribute('aria-label', 'Open command menu');
    btn.innerHTML = '<span aria-hidden="true">🔍</span><kbd>' + (isMac ? '⌘' : 'Ctrl') + ' K</kbd>';
    btn.addEventListener('click', openPalette);
    themeBtn.parentNode.insertBefore(btn, themeBtn);
  }

  /* ---------- Projects: filter chips + case-study popup ---------- */
  const grid = document.querySelector('[data-project-grid]');
  if (grid) {
    const cards = Array.prototype.slice.call(grid.querySelectorAll('[data-project]'));
    const catOf = (c) => ((c.querySelector('p') || {}).textContent || '').trim();

    const filterBar = document.querySelector('[data-filter-bar]');
    if (filterBar) {
      const cats = ['All'].concat(cards.map(catOf).filter((c, i, a) => c && a.indexOf(c) === i));
      cats.forEach((cat, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = cat;
        b.setAttribute('aria-pressed', i === 0);
        b.addEventListener('click', () => {
          filterBar.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
          cards.forEach((c) => {
            const show = cat === 'All' || catOf(c) === cat;
            c.style.display = show ? '' : 'none';
            if (show) c.classList.add('is-visible');
          });
        });
        filterBar.appendChild(b);
      });
    }

    const modal = document.querySelector('[data-case-modal]');
    if (modal) {
      const q = (s) => modal.querySelector(s);
      const setText = (sel, val) => {
        const el = q(sel);
        el.textContent = val || '';
        (el.closest('[data-case-block]') || el).hidden = !val;
      };
      cards.forEach((card) => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const d = card.dataset;
          const cover = card.querySelector('.cover');
          const cc = q('[data-case-cover]');
          cc.innerHTML = cover ? cover.innerHTML : '';
          cc.style.setProperty('--tint', cover ? cover.style.getPropertyValue('--tint') : '');
          const fig = q('[data-case-figure]');
          if (d.img) {
            const im = q('[data-case-img]');
            im.src = d.img; im.alt = d.caption || '';
            q('[data-case-caption]').textContent = d.caption || '';
            q('[data-case-figlink]').href = d.img;
            q('[data-case-figlink2]').href = d.img;
            fig.hidden = false; cc.hidden = true;
          } else { fig.hidden = true; cc.hidden = false; }
          const docBtn = q('[data-case-doc]');
          if (d.doc) {
            docBtn.href = d.doc; docBtn.textContent = d.docLabel || 'Download PDF';
            if (d.docName) docBtn.setAttribute('download', d.docName);
            docBtn.hidden = false;
          } else { docBtn.hidden = true; }
          q('[data-case-cat]').textContent = catOf(card);
          q('[data-case-title]').textContent = ((card.querySelector('h3') || {}).textContent || '').trim();
          setText('[data-case-role]', d.role);
          setText('[data-case-timeline]', d.timeline);
          setText('[data-case-summary]', d.summary);
          setText('[data-case-result]', d.result);
          const fb = q('[data-case-focus]');
          fb.innerHTML = '';
          (d.focus || '').split('|').filter(Boolean).forEach((t) => {
            const s = document.createElement('span');
            s.className = 'tag'; s.textContent = t.trim();
            fb.appendChild(s);
          });
          fb.closest('[data-case-block]').hidden = !d.focus;
          const link = q('[data-case-link]');
          if (link) { if (d.link) { link.href = d.link; link.hidden = false; } else { link.hidden = true; } }
          modal.showModal();
          q('.overlay-box').scrollTop = 0;
        });
      });
      const openFromHash = () => {
        const wanted = window.location.hash.slice(1);
        const target = wanted && cards.filter((c) => c.id === wanted)[0];
        if (target) setTimeout(() => target.click(), 400);
      };
      openFromHash();
      window.addEventListener('hashchange', openFromHash);
      q('[data-case-close]').addEventListener('click', () => modal.close());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    }
  }
});


/* ==========================================================================
   Gallery photo viewer (opens when a real photo on gallery.html is clicked)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const items = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-item]'));
  if (!items.length) return;
  const dlg = document.createElement('dialog');
  dlg.className = 'overlay-dialog';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = '<div class="overlay-box lightbox"><button type="button" class="case-close" data-lb-close aria-label="Close photo viewer">✕</button><img alt="" /><p class="lightbox-cap"></p><div class="lightbox-nav"><button type="button" data-lb-prev aria-label="Previous photo">←</button><button type="button" data-lb-next aria-label="Next photo">→</button></div></div>';
  document.body.appendChild(dlg);
  const img = dlg.querySelector('img');
  const cap = dlg.querySelector('.lightbox-cap');
  let index = 0;
  function show(n) {
    index = (n + items.length) % items.length;
    const src = items[index].querySelector('img');
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    const fc = items[index].closest('figure').querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : '';
  }
  items.forEach((b, n) => b.addEventListener('click', () => { show(n); dlg.showModal(); }));
  dlg.querySelector('[data-lb-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-lb-prev]').addEventListener('click', () => show(index - 1));
  dlg.querySelector('[data-lb-next]').addEventListener('click', () => show(index + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
});
