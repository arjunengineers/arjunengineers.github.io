/*
  Progressive enhancement only — every page is complete without this file.
  Nothing here sends or collects anything: no network calls, no storage. The filter keeps its
  state in the URL. DOM writes use textContent, never innerHTML.
  Scrolling is never locked or hijacked: scenes only read the native scroll position.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var motion = root.classList.contains('motion');
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };

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

  /* 2. Small-screen menu: a full panel opened by the Menu button. Esc closes it and returns
        focus to the button; while open, the page behind it is inert. */
  var menuButton = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('site-menu');
  if (menuButton && menu) {
    var behind = document.querySelectorAll('main, footer, .rail');
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.lastChild.textContent = open ? 'Close' : 'Menu';
      each(behind, function (el) { el.inert = open; });
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
    if (window.matchMedia) {
      var desktop = window.matchMedia('(min-width: 860px)');
      if (desktop.addEventListener) {
        desktop.addEventListener('change', function () { setMenu(false); });
      }
    }
  }

  /* 3. Project filter. The only runtime input is ?tag=, matched against the chips that exist in
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

  /* 4. Scroll scenes. Each [data-scrub] element gets --p from 0 to 1.
        data-scrub="pin": progress through a pinned runway. data-scrub="pass": from the element
        entering the screen until it leaves. The statement's words light up the same way. */
  var scenes = motion ? Array.prototype.slice.call(document.querySelectorAll('[data-scrub]')) : [];
  var statement = motion ? document.querySelector('[data-words]') : null;
  var words = [];

  if (statement) {
    var text = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    text.forEach(function (word, index) {
      var span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      statement.appendChild(span);
      if (index < text.length - 1) { statement.appendChild(document.createTextNode(' ')); }
      words.push(span);
    });
    statement.classList.add('is-reading');
  }

  if (scenes.length || words.length) {
    var queued = false;
    var paint = function () {
      queued = false;
      var vh = window.innerHeight;
      scenes.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.bottom < -vh || box.top > vh * 2) { return; }
        var pin = el.dataset.scrub === 'pin';
        var p = pin ? -box.top / Math.max(1, box.height - vh) : (vh - box.top) / (box.height + vh);
        el.style.setProperty('--p', clamp(p).toFixed(4));
      });
      if (words.length) {
        var area = statement.getBoundingClientRect();
        var read = clamp((vh * 0.82 - area.top) / (area.height + vh * 0.32));
        var lit = Math.ceil(read * words.length);
        words.forEach(function (word, index) { word.classList.toggle('is-lit', index < lit); });
      }
    };
    var ask = function () {
      if (!queued) { queued = true; window.requestAnimationFrame(paint); }
    };
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask, { passive: true });
    paint();
  }

  /* 5. Reveal: content already on screen is never hidden; everything else eases in once. */
  if (motion && 'IntersectionObserver' in window) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');
        watcher.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    each(document.querySelectorAll('[data-reveal], .case-body > section, .split, .entry'), function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
        el.classList.add('reveal');
        watcher.observe(el);
      }
    });
  }

  /* 6. Chapter rail (home) and table of contents (case studies): mark where the reader is. */
  var spyOn = function (links, attribute, value, rootMargin) {
    if (!('IntersectionObserver' in window)) { return; }
    var targets = {};
    each(links, function (link) { targets[link.getAttribute('href').slice(1)] = link; });
    var mark = function (id) {
      Object.keys(targets).forEach(function (key) {
        if (key === id) { targets[key].setAttribute(attribute, value); } else { targets[key].removeAttribute(attribute); }
      });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.dataset.chapter || entry.target.getAttribute('aria-labelledby');
        if (entry.isIntersecting && targets[id]) { mark(id); }
      });
    }, { rootMargin: rootMargin });
    return spy;
  };

  var railLinks = document.querySelectorAll('.rail a[href^="#"]');
  if (railLinks.length) {
    var railSpy = spyOn(railLinks, 'aria-current', 'true', '-45% 0px -50% 0px');
    if (railSpy) { each(document.querySelectorAll('[data-chapter]'), function (el) { railSpy.observe(el); }); }
  }

  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (tocLinks.length && window.matchMedia && window.matchMedia('(min-width: 1280px)').matches) {
    var tocSpy = spyOn(tocLinks, 'aria-current', 'location', '-15% 0px -70% 0px');
    if (tocSpy) { each(document.querySelectorAll('.case-body > section[aria-labelledby]'), function (el) { tocSpy.observe(el); }); }
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
