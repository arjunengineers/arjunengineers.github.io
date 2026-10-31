/* Runs before the page paints, so layout is right from the first frame.
   "js" reveals script-only controls; "motion" enables the scroll scenes. Without either class
   every page is complete and static. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    root.classList.add('motion');
  }
})();
