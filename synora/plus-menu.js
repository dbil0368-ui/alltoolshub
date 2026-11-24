(() => {
  const button = document.getElementById('plusMenuButton');
  const menu = document.getElementById('plusMenu');
  const photoInput = document.getElementById('chatImage');
  const cameraInput = document.getElementById('chatCamera');
  const choosePhoto = document.getElementById('choosePhoto');
  const takePhoto = document.getElementById('takePhoto');
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
  choosePhoto.addEventListener('click', () => {
    closeMenu();
    photoInput.click();
  });
  takePhoto.addEventListener('click', () => {
    closeMenu();
    cameraInput.click();
  });
  cameraInput.addEventListener('change', () => {
    if (!cameraInput.files || !cameraInput.files.length) return;
    const transfer = new DataTransfer();
    transfer.items.add(cameraInput.files[0]);
    photoInput.files = transfer.files;
    photoInput.dispatchEvent(new Event('change', { bubbles: true }));
    cameraInput.value = '';
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== button) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
})();