(() => {
  const $ = (id) => document.getElementById(id);
  const title = $('projectTitle');
  const prompt = $('prompt');
  const list = $('projectList');
  const storageKey = 'synora.projects.v1';
  let activeStudio = 'Creative Studio';
  let editingId = null;
  let searchTerm = '';
  const sortModes = ['newest', 'oldest', 'az'];
  let sortMode = 'newest';

  function readProjects() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item.title === 'string' && typeof item.prompt === 'string') : [];
    } catch { return []; }
  }
  function writeProjects(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }
  function showNotice(message) {
    $('notice').textContent = message;
  }
  function renderProjects() {
    const items = readProjects().filter(item => (item.title + ' ' + item.prompt + ' ' + (item.studio || '')).toLowerCase().includes(searchTerm));
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><span>✧</span><b>' + (searchTerm ? 'No matching projects' : 'Your ideas will live here') + '</b><p>' + (searchTerm ? 'Try another search term.' : 'Save your first project from any studio.') + '</p></div>';
      return;
    }
    list.replaceChildren();
    const sortedItems = items.slice().sort((a, b) => {
      if (sortMode === 'oldest') return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
      if (sortMode === 'az') return a.title.localeCompare(b.title);
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    sortedItems.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'project-item';
      const h = document.createElement('h3'); h.textContent = item.title;
      const p = document.createElement('p'); p.textContent = item.prompt;
      const meta = document.createElement('small'); meta.textContent = (item.studio || 'Creative Studio') + ' · ' + new Date(item.updatedAt || Date.now()).toLocaleDateString();
      const actions = document.createElement('div'); actions.className = 'project-actions';
      const open = document.createElement('button'); open.textContent = 'Open brief';
      open.addEventListener('click', () => {
        title.value = item.title; prompt.value = item.prompt; activeStudio = item.studio || 'Creative Studio'; editingId = item.id;
        $('workspaceTitle').textContent = activeStudio;
        $('charCount').textContent = prompt.value.length + ' / 2000';
        showNotice('Project opened. You can continue editing this brief.');
        $('workspace').scrollIntoView({behavior:'smooth'});
      });
      const remove = document.createElement('button'); remove.className = 'delete-project'; remove.textContent = 'Delete';
      remove.addEventListener('click', () => {
        const remaining = readProjects().filter(project => project.id !== item.id);
        try {
          writeProjects(remaining);
          if (editingId === item.id) {
            editingId = null; title.value = ''; prompt.value = ''; activeStudio = 'Creative Studio';
            $('workspaceTitle').textContent = 'Start creating'; $('charCount').textContent = '0 / 2000';
          }
          renderProjects(); showNotice('Project deleted from this browser.');
        }
        catch { showNotice('Could not update browser storage.'); }
      });
      actions.append(open, remove);
      card.append(h,p,meta,actions);
      list.append(card);
    });
  }

  const themeSelect = $('themeSelect');
  const savedTheme = localStorage.getItem('synora.theme') || 'dark';
  themeSelect.value = savedTheme;
  if (savedTheme === 'midnight') document.body.classList.add('midnight-theme');
  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value;
    document.body.classList.toggle('midnight-theme', theme === 'midnight');
    localStorage.setItem('synora.theme', theme);
  });

  const menuToggle = $('menuToggle');
  const mainNav = $('mainNav');
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mainNav.classList.toggle('menu-open', open);
    mainNav.classList.toggle('menu-closed', !open);
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    mainNav.classList.remove('menu-open', 'menu-closed');
  }));
  $('projectSearch').addEventListener('input', () => { searchTerm = $('projectSearch').value.trim().toLowerCase(); renderProjects(); });
  $('newProject').addEventListener('click', () => { editingId = null; title.value = ''; prompt.value = ''; activeStudio = 'Creative Studio'; $('workspaceTitle').textContent = 'Start creating'; $('charCount').textContent = '0 / 2000'; showNotice('New brief ready. Add a title and describe your idea.'); $('workspace').scrollIntoView({behavior:'smooth'}); title.focus({preventScroll:true}); });
  $('sortBtn').addEventListener('click', () => {
    const index = sortModes.indexOf(sortMode);
    sortMode = sortModes[(index + 1) % sortModes.length];
    const labels = {newest:'Newest', oldest:'Oldest', az:'A–Z'};
    const descriptions = {newest:'Sort projects, newest first', oldest:'Sort projects, oldest first', az:'Sort projects alphabetically'};
    $('sortLabel').textContent = labels[sortMode];
    $('sortBtn').setAttribute('aria-label', descriptions[sortMode]);
    renderProjects();
  });

  document.querySelectorAll('[data-studio]').forEach((button) => {
    button.addEventListener('click', () => {
      activeStudio = button.dataset.studio;
      editingId = null;
      $('workspaceTitle').textContent = activeStudio;
      showNotice(activeStudio + ' is a planning workspace in this preview. Live AI generation is not connected yet.');
      $('workspace').scrollIntoView({behavior:'smooth'});
      title.focus({preventScroll:true});
    });
  });

  prompt.addEventListener('input', () => $('charCount').textContent = prompt.value.length + ' / 2000');
  $('saveProject').addEventListener('click', () => {
    const projectTitle = title.value.trim();
    const projectPrompt = prompt.value.trim();
    if (!projectTitle || !projectPrompt) {
      showNotice('Please add a project name and describe your idea before saving.');
      (!projectTitle ? title : prompt).focus();
      return;
    }
    const items = readProjects();
    const record = {id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), title: projectTitle, prompt: projectPrompt, studio: activeStudio, updatedAt: new Date().toISOString()};
    const existingIndex = items.findIndex(item => item.id === editingId);
    if (existingIndex >= 0) items[existingIndex] = record; else items.push(record);
    editingId = record.id;
    try {
      writeProjects(items);
      showNotice('Project ' + (existingIndex >= 0 ? 'updated' : 'saved') + ' on this device. No AI media has been generated.');
      renderProjects();
    } catch { showNotice('Could not save. Your browser storage may be full or disabled.'); }
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotice('Import file is too large. Choose a JSON file under 2 MB.');
      event.target.value = '';
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('Expected a project list.');
      const valid = parsed.filter(item => item && typeof item.title === 'string' && typeof item.prompt === 'string')
        .map(item => ({
          id: typeof item.id === 'string' ? item.id : (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
          title: item.title.slice(0, 70),
          prompt: item.prompt.slice(0, 2000),
          studio: typeof item.studio === 'string' ? item.studio.slice(0, 60) : 'Creative Studio',
          updatedAt: typeof item.updatedAt === 'string' && !Number.isNaN(Date.parse(item.updatedAt)) ? item.updatedAt : new Date().toISOString()
        }));
      if (!valid.length) throw new Error('No valid projects were found.');
      const existing = readProjects();
      const byId = new Map(existing.map(item => [item.id, item]));
      valid.forEach(item => byId.set(item.id, item));
      writeProjects(Array.from(byId.values()));
      renderProjects();
      showNotice(valid.length + ' project(s) imported. Matching IDs were updated; other projects were kept.');
    } catch {
      showNotice('Could not import this file. Choose a valid SYNORA projects JSON export.');
    } finally {
      event.target.value = '';
    }
  });
  $('exportBtn').addEventListener('click', () => {
    const data = JSON.stringify(readProjects(), null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'synora-projects.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('profileBtn').addEventListener('click', () => {
    showNotice('Account sign-in is not connected in this preview. A secure authentication backend is needed.');
    $('workspace').scrollIntoView({behavior:'smooth'});
  });
  renderProjects();
})();