(() => {
  const byId = (id) => document.getElementById(id);

  // Chat attachment popover
  const plusButton = byId('plusMenuButton');
  const plusMenu = byId('plusMenu');
  const photoInput = byId('chatImage');
  const cameraInput = byId('chatCamera');
  const videoInput = byId('chatVideo');
  const documentInput = byId('chatDocument');
  const notice = byId('chatNotice');

  function closePlusMenu() {
    if (plusMenu) plusMenu.hidden = true;
    if (plusButton) plusButton.setAttribute('aria-expanded', 'false');
  }
  if (plusButton && plusMenu) {
    plusButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const opening = plusMenu.hidden;
      plusMenu.hidden = !opening;
      plusButton.setAttribute('aria-expanded', String(opening));
    });
    const bindPicker = (buttonId, input) => {
      const trigger = byId(buttonId);
      if (trigger && input) trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closePlusMenu();
        input.click();
      });
    };
    bindPicker('choosePhoto', photoInput);
    bindPicker('takePhoto', cameraInput);
    bindPicker('chooseVideo', videoInput);
    bindPicker('chooseDocument', documentInput);
    document.addEventListener('click', (event) => {
      if (!plusMenu.hidden && !plusMenu.contains(event.target) && event.target !== plusButton) closePlusMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePlusMenu();
    });
  }

  // Camera selections use the same validated image-preview flow as Photos.
  if (cameraInput && photoInput) {
    cameraInput.addEventListener('change', () => {
      const file = cameraInput.files && cameraInput.files[0];
      if (!file) return;
      try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        photoInput.files = transfer.files;
        photoInput.dispatchEvent(new Event('change', { bubbles: true }));
      } catch {
        if (notice) notice.textContent = 'Camera photo selected. If it does not attach, use Photos to choose it.';
      }
      cameraInput.value = '';
    });
  }
  if (videoInput) videoInput.addEventListener('change', () => {
    const file = videoInput.files && videoInput.files[0];
    if (file && notice) notice.textContent = 'Video selected: ' + file.name + '. Video analysis is not connected yet.';
  });
  if (documentInput) documentInput.addEventListener('change', () => {
    const file = documentInput.files && documentInput.files[0];
    if (file && notice) notice.textContent = 'File selected: ' + file.name + '. Document analysis is not connected yet.';
  });

  // Three-line navigation dropdown
  const navButton = byId('menuToggle');
  const navMenu = byId('navDropdown');
  function closeNavMenu() {
    if (navMenu) navMenu.hidden = true;
    if (navButton) navButton.setAttribute('aria-expanded', 'false');
  }
  const homeLink = byId('homeLink');
  if (homeLink) homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    document.body.classList.remove('menu-page');
    document.querySelectorAll('.shell>.section').forEach(section => section.classList.remove('active-menu-page'));
    window.scrollTo({top:0,behavior:'smooth'});
  });
  if (navButton && navMenu) {
    navButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const opening = navMenu.hidden;
      navMenu.hidden = !opening;
      navButton.setAttribute('aria-expanded', String(opening));
    });
    navMenu.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      closeNavMenu();
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          document.body.classList.add('menu-page');
          document.querySelectorAll('.shell>.section').forEach(section => section.classList.remove('active-menu-page'));
          target.classList.add('active-menu-page');
          target.scrollIntoView({behavior:'smooth',block:'start'});
        }
      }
    });
    document.addEventListener('click', (event) => {
      if (!navMenu.hidden && !navMenu.contains(event.target) && event.target !== navButton) closeNavMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNavMenu();
    });
  }
})();