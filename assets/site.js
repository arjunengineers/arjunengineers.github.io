/* Small enhancements only: every page is complete without this file.
   Nothing here sends or stores anything. DOM writes use textContent, never innerHTML. */
(function () {
  'use strict';

  /* Opened straight from disk, a link to "work/" shows a folder listing. Does nothing once hosted. */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'), location.href);
      if (url.protocol === 'file:' && url.pathname.slice(-1) === '/') {
        url.pathname += 'index.html';
        link.setAttribute('href', url.href);
      }
    });
  }

  /* Work page filter. The only runtime input is ?tag=, checked against the buttons on the page. */
  var filter = document.querySelector('[data-filter]');
  if (filter) {
    var chips = Array.from(filter.querySelectorAll('button[data-tag]'));
    var clear = filter.querySelector('[data-clear]');
    var status = filter.querySelector('[data-status]');
    var rows = Array.from(document.querySelectorAll('[data-project-card]'));

    var apply = function (tag) {
      var chip = chips.find(function (c) { return c.dataset.tag === tag; });
      var shown = 0;
      rows.forEach(function (row) {
        row.hidden = Boolean(chip) && row.dataset.tags !== tag;
        if (!row.hidden) { shown += 1; }
      });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      clear.hidden = !chip;
      status.textContent = chip
        ? shown + (shown === 1 ? ' project' : ' projects') + ' in ' + chip.textContent.trim() + '.'
        : 'Showing all ' + shown + ' projects.';
      try {
        var url = new URL(location.href);
        if (chip) { url.searchParams.set('tag', tag); } else { url.searchParams.delete('tag'); }
        history.replaceState(null, '', url);
      } catch (err) { /* the filter still works without updating the address */ }
    };

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        apply(c.getAttribute('aria-pressed') === 'true' ? null : c.dataset.tag);
      });
    });
    clear.addEventListener('click', function () {
      apply(null);
      chips[0].focus();                 // the Clear button is about to disappear
    });
    filter.hidden = false;
    apply(new URLSearchParams(location.search).get('tag'));
  }

  /* Home page stage: pins one scene at a time and dissolves between them in coarse pixels, as the
     visitor scrolls. Native scrolling throughout. Skipped entirely under reduced motion, where the
     CSS leaves the scenes as ordinary sections. Only sets a custom property and paints a canvas. */
  var stage = document.querySelector('[data-stage]');
  if (stage && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    var root = document.documentElement;
    var scenes = Array.from(stage.querySelectorAll('.scene'));
    var frames = scenes.map(function (s) { return s.querySelector('.frame'); });
    var railLinks = Array.from(document.querySelectorAll('.rail a'));
    var veil = document.createElement('canvas');
    var veilCtx = veil.getContext('2d');
    var tops = [], heights = [], shots = [], noise = null, pixels = null, vh = 0, vw = 0;
    var active = -1, queued = false, painted = '', stopped = false;
    var CHAPTER_OFFSET = 1;             // the hero scene has no rail entry

    veil.className = 'veil';
    veil.setAttribute('aria-hidden', 'true');
    root.classList.add('stage');
    stage.appendChild(veil);

    var makeNoise = function (w, h) {   // large soft blobs plus fine grain, so the edge frays
      var gw = 14, gh = 10, grid = new Float32Array((gw + 1) * (gh + 1)), out = new Float32Array(w * h), i;
      for (i = 0; i < grid.length; i += 1) { grid[i] = Math.random(); }
      for (var y = 0; y < h; y += 1) {
        for (var x = 0; x < w; x += 1) {
          var fx = x / w * gw, fy = y / h * gh, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
          var a = grid[iy * (gw + 1) + ix], b = grid[iy * (gw + 1) + ix + 1];
          var c = grid[(iy + 1) * (gw + 1) + ix], d = grid[(iy + 1) * (gw + 1) + ix + 1];
          var blob = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
          out[y * w + x] = blob * 0.72 + Math.random() * 0.28;
        }
      }
      return out;
    };

    /* A small flattened picture of a scene's art, drawn from the images already on the page. */
    var shoot = function (i) {
      if (shots[i]) { return shots[i]; }
      var off = document.createElement('canvas');
      off.width = veil.width; off.height = veil.height;
      var ctx = off.getContext('2d', { willReadFrequently: true });
      var scale = veil.width / vw, ready = true;
      ctx.fillStyle = getComputedStyle(frames[i]).backgroundColor;
      ctx.fillRect(0, 0, off.width, off.height);
      frames[i].querySelectorAll('.art img').forEach(function (img) {
        var r = img.getBoundingClientRect();
        if (!img.complete || !img.naturalWidth) { ready = false; return; }
        if (!r.width) { return; }
        if (getComputedStyle(img).objectFit === 'cover') {
          var k = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
          var sw = r.width / k, sh = r.height / k;
          var pos = getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
          ctx.drawImage(img, (img.naturalWidth - sw) * pos[0] / 100, (img.naturalHeight - sh) * pos[1] / 100, sw, sh,
            r.left * scale, r.top * scale, r.width * scale, r.height * scale);
        } else {
          ctx.drawImage(img, r.left * scale, r.top * scale, r.width * scale, r.height * scale);
        }
      });
      var shot = ctx.getImageData(0, 0, off.width, off.height);
      if (ready) { shots[i] = shot; }
      return shot;
    };

    var paint = function (i, amount) {
      amount = Math.round(amount * 60) / 60;       // 60 steps are plenty and spare needless redraws
      var key = i + ':' + amount;
      if (key === painted) { return; }
      painted = key;
      var src = shoot(i).data, dst = pixels.data, n = noise.length;
      for (var p = 0; p < n; p += 1) {
        var on = noise[p] < amount * 1.05, q = p * 4;
        dst[q] = src[q]; dst[q + 1] = src[q + 1]; dst[q + 2] = src[q + 2]; dst[q + 3] = on ? 255 : 0;
      }
      veilCtx.putImageData(pixels, 0, 0);
    };

    /* Decode and flatten the next scene while idle, so the work never lands mid-scroll. */
    var prepare = function (k) {
      if (!frames[k] || shots[k]) { return; }
      var imgs = Array.from(frames[k].querySelectorAll('.art img'));
      Promise.all(imgs.map(function (img) { return img.decode ? img.decode().catch(function () {}) : null; })).then(function () {
        (window.requestIdleCallback || window.setTimeout)(function () { if (!stopped) { shoot(k); } });
      });
    };

    var enter = function (i) {
      frames.forEach(function (f, k) {
        f.classList.toggle('is-active', k === i);
        f.classList.toggle('is-near', Math.abs(k - i) <= 1);
      });
      railLinks.forEach(function (a, k) {
        if (k + CHAPTER_OFFSET === i) { a.setAttribute('aria-current', 'step'); } else { a.removeAttribute('aria-current'); }
      });
      if (scenes[i].dataset.tone === 'light') { document.body.dataset.chrome = 'light'; } else { delete document.body.dataset.chrome; }
      active = i;
      prepare(i + 1);
    };

    var run = function () {
      queued = false;
      if (stopped) { return; }
      var y = window.scrollY, i = 0;
      while (i < scenes.length - 1 && y >= tops[i + 1]) { i += 1; }
      if (i !== active) { enter(i); }
      var end = tops[i] + heights[i], reach = vh * 0.72, settle = vh * 0.3;
      var p = Math.max(0, Math.min(1, (y - tops[i]) / heights[i]));
      frames[i].style.setProperty('--p', p.toFixed(4));
      frames[i].classList.toggle('is-late', p > 0.44);
      document.body.classList.toggle('past-stage', i === scenes.length - 1 && y > end - vh * 0.6);
      if (i < scenes.length - 1 && y > end - reach) {
        paint(i + 1, 1 - (end - y) / reach);
        veil.style.opacity = '1';
      } else if (i > 0 && y < tops[i] + settle) {
        paint(i, 1);
        veil.style.opacity = String(1 - (y - tops[i]) / settle);
      } else {
        veil.style.opacity = '0';
      }
    };

    /* Pinned frames cannot scroll, so if text would be cut off (a short screen, enlarged text)
       the page goes back to ordinary sections. */
    var fits = function () {
      return frames.every(function (f) {
        var copy = f.querySelector('.copy');
        return copy.scrollHeight <= copy.clientHeight + 1;
      });
    };
    var stop = function () {
      stopped = true;
      root.classList.remove('stage');
      veil.remove();
      frames.forEach(function (f) { f.style.removeProperty('--p'); });
      delete document.body.dataset.chrome;
      document.body.classList.remove('past-stage');
    };

    var measure = function () {
      if (stopped) { return; }
      if (!fits()) { stop(); return; }
      vh = window.innerHeight; vw = window.innerWidth;
      var cell = Math.max(6, Math.round(vw / 200));
      veil.width = Math.ceil(vw / cell); veil.height = Math.ceil(vh / cell);
      pixels = veilCtx.createImageData(veil.width, veil.height);
      noise = makeNoise(veil.width, veil.height);
      shots = []; painted = '';
      scenes.forEach(function (s, k) {
        var r = s.getBoundingClientRect();
        tops[k] = r.top + window.scrollY; heights[k] = r.height;
      });
      run();
    };

    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; window.requestAnimationFrame(run); }
    }, { passive: true });
    window.addEventListener('resize', measure);
    /* A keyboard user tabbing to a link in another scene is carried to the point where it is shown. */
    stage.addEventListener('focusin', function (e) {
      var k = frames.findIndex(function (f) { return f.contains(e.target); });
      if (k < 0) { return; }
      var y = tops[k] + heights[k] * (e.target.closest('.slot__b') ? 0.56 : 0.24);
      if (k === 0) { y = 0; }
      window.scrollTo(0, y);
    });
    measure();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }
  }

  /* Copy email address: the button appears only when this script runs. */
  var copy = document.querySelector('button[data-copy]');
  if (copy) {
    var note = document.querySelector('[data-copy-status]');
    var say = function (text) { note.textContent = text; };
    copy.hidden = false;
    copy.addEventListener('click', function () {
      if (!navigator.clipboard) { say('Copy failed — the address is shown above.'); return; }
      navigator.clipboard.writeText(copy.dataset.copy).then(
        function () { say('Email address copied.'); },
        function () { say('Copy failed — the address is shown above.'); }
      );
    });
  }
})();
