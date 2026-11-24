(() => {
  const button = document.getElementById('plusMenuButton');
  const menu = document.getElementById('plusMenu');
  const photoInput = document.getElementById('chatImage');
  const cameraInput = document.getElementById('chatCamera');
  const videoInput = document.getElementById('chatVideo');
  const documentInput = document.getElementById('chatDocument');
  const choosePhoto = document.getElementById('choosePhoto');
  const takePhoto = document.getElementById('takePhoto');
  const chooseVideo = document.getElementById('chooseVideo');
  const chooseDocument = document.getElementById('chooseDocument');
  const notice = document.getElementById('chatNotice');
  if (!button || !menu || !photoInput || !cameraInput) return;

  function closeMenu() {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden));
  });
  choosePhoto.addEventListener('click', () => { closeMenu(); photoInput.click(); });
  takePhoto.addEventListener('click', () => { closeMenu(); cameraInput.click(); });
  if (chooseVideo && videoInput) chooseVideo.addEventListener('click', () => {
    closeMenu();
    videoInput.click();
  });
  if (chooseDocument && documentInput) chooseDocument.addEventListener('click', () => {
    closeMenu();
    documentInput.click();
  });
  cameraInput.addEventListener('change', () => {
    if (!cameraInput.files || !cameraInput.files.length) return;
    const transfer = new DataTransfer();
    transfer.items.add(cameraInput.files[0]);
    photoInput.files = transfer.files;
    photoInput.dispatchEvent(new Event('change', { bubbles: true }));
    cameraInput.value = '';
  });
  if (videoInput) videoInput.addEventListener('change', () => {
    const file = videoInput.files && videoInput.files[0];
    if (file && notice) notice.textContent = 'Video selected: ' + file.name + '. Video analysis is not connected yet.';
  });
  if (documentInput) documentInput.addEventListener('change', () => {
    const file = documentInput.files && documentInput.files[0];
    if (file && notice) notice.textContent = 'File selected: ' + file.name + '. Document reading is not connected yet.';
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== button) closeMenu();
  });

  const navButton = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navDropdown');
  if (navButton && navMenu) {
    navButton.addEventListener('click', (event) => {
      event.stopPropagation();
      navMenu.hidden = !navMenu.hidden;
      navButton.setAttribute('aria-expanded', String(!navMenu.hidden));
    });
    navMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        navMenu.hidden = true;
        navButton.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', (event) => {
      if (!navMenu.hidden && !navMenu.contains(event.target) && event.target !== navButton) {
        navMenu.hidden = true;
        navButton.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        navMenu.hidden = true;
        navButton.setAttribute('aria-expanded', 'false');
      }
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
})();