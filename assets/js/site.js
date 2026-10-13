/*
  Progressive enhancement only — every page is complete without this file.
  Nothing here sends or collects anything: there are no network calls. The filter keeps its state
  in the URL; the theme choice stays in this browser. DOM writes use textContent, never innerHTML.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var reducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* 1. Local preview: opened straight from disk (file://), a link to "work/" would show a
        folder listing, so point folder links at their index.html. Does nothing once hosted. */
  if (location.protocol === 'file:') {
    each(document.querySelectorAll('a[href]'), function (link) {
      try {
        var url = new URL(link.getAttribute('href'), location.href);
        if (url.protocol === 'file:' && url.pathname.slice(-1) === '/') {
          url.pathname += 'index.html';
          link.setAttribute('href', url.href);
        }
      } catch (err) { /* leave the link as written */ }
    });
  }

  /* 2. Small-screen menu: a disclosure button for the navigation list and theme switch.
        Esc closes it and returns focus to the button. Without this script the list stays visible. */
  var menuButton = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('site-menu');
  if (menuButton && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
    };
    menuButton.hidden = false;
    menuButton.addEventListener('click', function () {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuButton.focus();
      }
    });
    menu.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('a')) { setMenu(false); }
    });
  }

  /* 3. Theme switch: System (follow the device), Light or Dark. theme.js applies the saved
        choice before paint; this keeps the control, the page and the browser chrome in step. */
  var themeSwitch = document.querySelector('[data-theme-switch]');
  if (themeSwitch) {
    var THEME_COLORS = { light: '#F7F2E8', dark: '#101820' };
    var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
    var applyTheme = function (choice) {
      var fixed = choice === 'light' || choice === 'dark';        // allow-list
      if (fixed) { root.setAttribute('data-theme', choice); } else { root.removeAttribute('data-theme'); }
      each(themeMetas, function (meta) {
        var forDark = (meta.getAttribute('media') || '').indexOf('dark') !== -1;
        meta.setAttribute('content', fixed ? THEME_COLORS[choice] : (forDark ? THEME_COLORS.dark : THEME_COLORS.light));
      });
      try {
        if (fixed) { localStorage.setItem('theme', choice); } else { localStorage.removeItem('theme'); }
      } catch (err) { /* not saved; the page still switches */ }
    };
    var currentTheme = root.getAttribute('data-theme');
    if (currentTheme !== 'light' && currentTheme !== 'dark') { currentTheme = 'system'; }
    each(themeSwitch.querySelectorAll('input[name="theme"]'), function (radio) {
      radio.checked = radio.value === currentTheme;
      radio.addEventListener('change', function () { if (radio.checked) { applyTheme(radio.value); } });
    });
    themeSwitch.hidden = false;
  }

  /* 4. Project filter. The only runtime input is ?tag=, matched against the chips that exist in
        the page; unknown values are ignored. */
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

  /* 5. Scroll reveal and the metric "settle". Content already on screen is never hidden;
        everything else fades in once. Metric numerals start at a lighter grade and settle to
        normal as they arrive — their value is never animated. Skipped under reduced motion. */
  if ('IntersectionObserver' in window && !reducedMotion) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('is-pending');
        watcher.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    each(document.querySelectorAll('.work-lead, .work-pair > li, .cards > li, .panel, .entry, .page-body > .split, .section > .split > .split__body, .case-body > section, .contact'), function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) { el.classList.add('reveal'); watcher.observe(el); }
    });
    each(document.querySelectorAll('.metric:not(.metric--text)'), function (el) {
      el.classList.add('is-pending');
      watcher.observe(el);
    });
  }

  /* 6. Table-of-contents scroll-spy (case studies, wide screens where the list sits beside the
        text): marks the section being read with aria-current="location". */
  var toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window && window.matchMedia) {
    var wide = window.matchMedia('(min-width: 1280px)');
    var tocLinks = {};
    var spy = null;
    each(toc.querySelectorAll('a[href^="#"]'), function (link) { tocLinks[link.getAttribute('href').slice(1)] = link; });
    var mark = function (id) {
      Object.keys(tocLinks).forEach(function (key) {
        if (key === id) { tocLinks[key].setAttribute('aria-current', 'location'); } else { tocLinks[key].removeAttribute('aria-current'); }
      });
    };
    var startSpy = function () {
      if (spy) { spy.disconnect(); spy = null; }
      mark(null);
      if (!wide.matches) { return; }
      spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.getAttribute('aria-labelledby');
          if (entry.isIntersecting && tocLinks[id]) { mark(id); }
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      each(document.querySelectorAll('.case-body > section[aria-labelledby]'), function (section) { spy.observe(section); });
    };
    startSpy();
    if (wide.addEventListener) { wide.addEventListener('change', startSpy); }
  }

  /* 7. Copy email address: the button appears only when this script runs; the copy is local. */
  each(document.querySelectorAll('button[data-copy]'), function (button) {
    var copyStatus = document.querySelector('[data-copy-status]');
    var say = function (text) {
      if (!copyStatus) { return; }
      copyStatus.textContent = text;
      setTimeout(function () { if (copyStatus.textContent === text) { copyStatus.textContent = ''; } }, 4000);
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

  /* 8. Figure that fails to load: say so in the page, next to the alt text. */
  var figureFallback = function (img) {
    var frame = img.closest('.figure__frame');
    if (!frame || frame.querySelector('.figure__fallback')) { return; }
    var note = document.createElement('p');
    note.className = 'figure__fallback';
    note.textContent = 'This project figure could not be loaded. The analysis is available in the text below.';
    frame.appendChild(note);
  };
  each(document.querySelectorAll('.figure__frame img'), function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') { figureFallback(img); }
    img.addEventListener('error', function () { figureFallback(img); });
  });
})();
