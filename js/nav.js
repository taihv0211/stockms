// Sidebar mobile toggle — dùng chung mọi trang.
(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var sidebar = document.querySelector('.sidebar');
  var scrim = document.querySelector('.scrim');
  if (!toggle || !sidebar) return;

  function open() {
    sidebar.classList.add('is-open');
    if (scrim) scrim.classList.add('is-open');
  }
  function close() {
    sidebar.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
  }
  toggle.addEventListener('click', function () {
    sidebar.classList.contains('is-open') ? close() : open();
  });
  if (scrim) scrim.addEventListener('click', close);
})();
