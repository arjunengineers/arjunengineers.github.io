/* Runs before the page paints: marks that scripts work, and applies a saved theme choice.
   Three states: "light", "dark", or nothing saved (follow the device setting, handled in CSS).
   The choice lives only in this browser (localStorage) and is never sent anywhere. */
(function () {
  'use strict';
  var root = document.documentElement;
  var COLORS = { light: '#F7F2E8', dark: '#101820' };
  var saved = null;
  root.classList.add('js');
  try { saved = localStorage.getItem('theme'); } catch (err) { saved = null; }
  if (saved === 'light' || saved === 'dark') {        // allow-list: anything else means "system"
    root.setAttribute('data-theme', saved);
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i += 1) { metas[i].setAttribute('content', COLORS[saved]); }
  }
})();
