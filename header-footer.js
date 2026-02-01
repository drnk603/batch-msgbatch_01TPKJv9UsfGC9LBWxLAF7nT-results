(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var toggle = header.querySelector('.dr-header-toggle');
  var nav = header.querySelector('.dr-nav');
  if (!toggle || !nav) return;

  var isOpen = false;

  function setState(open) {
    isOpen = open;
    header.setAttribute('data-dr-nav-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setState(!isOpen);
  });

  header.addEventListener('keyup', function (event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      if (isOpen) {
        setState(false);
        toggle.focus();
      }
    }
  });
})();