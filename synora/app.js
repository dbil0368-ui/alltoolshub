(() => {
  const $ = (id) => document.getElementById(id);
  const title = $('projectTitle');
  const prompt = $('prompt');
  const list = $('projectList');
  const storageKey = 'synora.projects.v1';
  let activeStudio = 'Creative Studio';

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
    const items = readProjects();
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><span>✧</span><b>Your ideas will live here</b><p>Save your first project from any studio.</p></div>';
      return;
    }
    list.replaceChildren();
    items.slice().reverse().forEach((item) => {
      const card = document.createElement('article');
      card.className = 'project-item';
      const h = document.createElement('h3'); h.textContent = item.title;
      const p = document.createElement('p'); p.textContent = item.prompt;
      const meta = document.createElement('small'); meta.textContent = (item.studio || 'Creative Studio') + ' · ' + new Date(item.updatedAt || Date.now()).toLocaleDateString();
      const actions = document.createElement('div'); actions.className = 'project-actions';
      const open = document.createElement('button'); open.textContent = 'Open brief';
      open.addEventListener('click', () => {
        title.value = item.title; prompt.value = item.prompt; activeStudio = item.studio || 'Creative Studio';
        $('workspaceTitle').textContent = activeStudio;
        $('charCount').textContent = prompt.value.length + ' / 2000';
        showNotice('Project opened. You can continue editing this brief.');
        $('workspace').scrollIntoView({behavior:'smooth'});
      });
      const remove = document.createElement('button'); remove.className = 'delete-project'; remove.textContent = 'Delete';
      remove.addEventListener('click', () => {
        const remaining = readProjects().filter(project => project.id !== item.id);
        try { writeProjects(remaining); renderProjects(); showNotice('Project deleted from this browser.'); }
        catch { showNotice('Could not update browser storage.'); }
      });
      actions.append(open, remove);
      card.append(h,p,meta,actions);
      list.append(card);
    });
  }

  document.querySelectorAll('[data-studio]').forEach((button) => {
    button.addEventListener('click', () => {
      activeStudio = button.dataset.studio;
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
    items.push({id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), title: projectTitle, prompt: projectPrompt, studio: activeStudio, updatedAt: new Date().toISOString()});
    try {
      writeProjects(items);
      showNotice('Project saved on this device. No AI media has been generated.');
      renderProjects();
    } catch { showNotice('Could not save. Your browser storage may be full or disabled.'); }
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