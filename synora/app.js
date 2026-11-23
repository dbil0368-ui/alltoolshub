(() => {
  const $ = (id) => document.getElementById(id);
  const title = $('projectTitle');
  const prompt = $('prompt');
  const list = $('projectList');
  const storageKey = 'synora.projects.v1';
  let activeStudio = 'Creative Studio';

  function readProjects() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  }
  function writeProjects(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
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
      const meta = document.createElement('small'); meta.textContent = item.studio + ' · ' + new Date(item.updatedAt).toLocaleDateString();
      const open = document.createElement('button'); open.textContent = 'Open brief';
      open.addEventListener('click', () => {
        title.value = item.title; prompt.value = item.prompt; activeStudio = item.studio;
        $('workspaceTitle').textContent = item.studio;
        $('charCount').textContent = prompt.value.length + ' / 2000';
        $('workspace').scrollIntoView({behavior:'smooth'});
      });
      card.append(h,p,meta,document.createElement('br'),open);
      list.append(card);
    });
  }

  document.querySelectorAll('[data-studio]').forEach((button) => {
    button.addEventListener('click', () => {
      activeStudio = button.dataset.studio;
      $('workspaceTitle').textContent = activeStudio;
      $('workspace').scrollIntoView({behavior:'smooth'});
      $('notice').textContent = activeStudio + ' is a planning workspace in this preview. Live AI generation is not connected yet.';
    });
  });

  prompt.addEventListener('input', () => $('charCount').textContent = prompt.value.length + ' / 2000');
  $('saveProject').addEventListener('click', () => {
    const projectTitle = title.value.trim();
    const projectPrompt = prompt.value.trim();
    if (!projectTitle || !projectPrompt) {
      $('notice').textContent = 'Please add a project name and describe your idea before saving.';
      return;
    }
    const items = readProjects();
    items.push({id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), title: projectTitle, prompt: projectPrompt, studio: activeStudio, updatedAt: new Date().toISOString()});
    try {
      writeProjects(items);
      $('notice').textContent = 'Project saved on this device. No AI media has been generated.';
      renderProjects();
    } catch {
      $('notice').textContent = 'Could not save. Your browser storage may be full or disabled.';
    }
  });
  $('exportBtn').addEventListener('click', () => {
    const data = JSON.stringify(readProjects(), null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'synora-projects.json'; a.click();
    URL.revokeObjectURL(url);
  });
  $('profileBtn').addEventListener('click', () => {
    $('notice').textContent = 'Account sign-in is not connected in this preview. A secure authentication backend is needed.';
    $('workspace').scrollIntoView({behavior:'smooth'});
  });
  renderProjects();
})();