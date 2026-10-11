/*
  Progressive enhancement only — every page is complete without this file (NFR-02).
  Nothing here stores, sends, or collects anything (NFR-07): filter state lives in the URL.
  DOM writes use textContent, never innerHTML (project-portfolio.md §4.2).
*/
(function () {
  'use strict';

  /* 1. Local preview: opened straight from disk (file://), a link to "work/" would show a
        folder listing, so point folder links at their index.html. Does nothing once hosted. */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (link) {
      try {
        var url = new URL(link.getAttribute('href'), location.href);
        if (url.protocol === 'file:' && url.pathname.slice(-1) === '/') {
          url.pathname += 'index.html';
          link.setAttribute('href', url.href);
        }
      } catch (err) { /* leave the link as written */ }
    });
  }

  /* 2. Project filter (FR-03). The only runtime input is ?tag=, matched against the chips
        that exist in the page; unknown values are ignored. */
  var filter = document.querySelector('[data-filter]');
  if (filter) {
    var chips = Array.prototype.slice.call(filter.querySelectorAll('button[data-tag]'));
    var clear = filter.querySelector('[data-clear]');
    var status = filter.querySelector('[data-status]');
    var empty = document.querySelector('[data-empty]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-project-card]'));
    var labels = {};
    chips.forEach(function (chip) { labels[chip.dataset.tag] = chip.textContent.trim(); });

    var apply = function (tag) {
      var active = tag && Object.prototype.hasOwnProperty.call(labels, tag) ? tag : null;   // allow-list
      var shown = 0;
      cards.forEach(function (card) {
        var match = !active || (card.dataset.tags || '').split(' ').indexOf(active) !== -1;
        card.hidden = !match;
        if (match) { shown += 1; }
      });
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(chip.dataset.tag === active));
      });
      if (clear) { clear.hidden = !active; }
      if (empty) { empty.hidden = shown !== 0; }
      if (status) {
        status.textContent = active
          ? shown + (shown === 1 ? ' project' : ' projects') + ' in ' + labels[active] + '.'
          : 'Showing all ' + shown + ' projects.';
      }
      try {
        var url = new URL(location.href);
        if (active) { url.searchParams.set('tag', active); } else { url.searchParams.delete('tag'); }
        history.replaceState(null, '', url);
      } catch (err) { /* some browsers refuse replaceState on file:// — the filter still works */ }
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        apply(chip.getAttribute('aria-pressed') === 'true' ? null : chip.dataset.tag);
      });
    });
    if (clear) {
      clear.addEventListener('click', function () {
        apply(null);
        if (chips[0]) { chips[0].focus(); }     // the Clear button is about to disappear
      });
    }

    filter.hidden = false;
    var initial = null;
    try { initial = new URL(location.href).searchParams.get('tag'); } catch (err) { initial = null; }
    apply(initial);
  }

  /* 2b. Theme toggle: light by default; the choice is kept in this browser only. */
  var root = document.documentElement;
  document.querySelectorAll('[data-theme-toggle]').forEach(function (toggle) {
    var sync = function () { toggle.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark')); };
    toggle.hidden = false;
    sync();
    toggle.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') !== 'dark';
      if (dark) { root.setAttribute('data-theme', 'dark'); } else { root.removeAttribute('data-theme'); }
      try { if (dark) { localStorage.setItem('theme', 'dark'); } else { localStorage.removeItem('theme'); } } catch (err) { /* not saved; still switches */ }
      sync();
    });
  });

  /* 2c. Scroll reveal: content already on screen is never hidden; everything else fades in once. */
  if ('IntersectionObserver' in window && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); watcher.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.featured > li, .cards > li, .capability, .entry, .page-body > .split, .section > .split > .split__body, .case-body > section, .contact').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) { el.classList.add('reveal'); watcher.observe(el); }
    });
  }

  /* 3. Copy email address: the button appears only when this script runs; the copy is local. */
  document.querySelectorAll('button[data-copy]').forEach(function (button) {
    var status = document.querySelector('[data-copy-status]');
    var say = function (text) {
      if (!status) { return; }
      status.textContent = text;
      setTimeout(function () { if (status.textContent === text) { status.textContent = ''; } }, 4000);
    };
    button.hidden = false;
    button.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(button.dataset.copy).then(
          function () { say('Email address copied.'); },
          function () { say('Copy failed — the address is shown above.'); }
        );
      } catch (err) { say('Copy failed — the address is shown above.'); }
    });
  });

  /* 4. Figure that fails to load: say so in the page, next to the alt text. */
  var figureFallback = function (img) {
    var frame = img.closest('.figure__frame');
    if (!frame || frame.querySelector('.figure__fallback')) { return; }
    var note = document.createElement('p');
    note.className = 'figure__fallback';
    note.textContent = 'This project figure could not be loaded. The analysis is available in the text below.';
    frame.appendChild(note);
  };
  document.querySelectorAll('.figure__frame img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') { figureFallback(img); }
    img.addEventListener('error', function () { figureFallback(img); });
  });
})();
