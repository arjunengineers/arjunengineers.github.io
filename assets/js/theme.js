/* Runs before the page paints: marks that scripts work, and applies a saved dark-mode choice.
   The choice lives only in this browser (localStorage) and is never sent anywhere. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (localStorage.getItem('theme') === 'dark') { root.setAttribute('data-theme', 'dark'); }
  } catch (err) { /* storage unavailable: stay on the light theme */ }
})();
