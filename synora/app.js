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

  // Navigation uses native HTML <details>, so it works without JavaScript.

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

  const templateSets = {
    'Video Studio': [
      ['cinematic','Create a cinematic video about [TOPIC]. Audience: [AUDIENCE]. Mood: [MOOD]. Visual style: [STYLE]. Include an engaging opening, clear story progression, scene-by-scene direction, suggested camera movement, sound design, and a memorable ending.'],
      ['short-form','Create a short vertical video about [TOPIC] for [PLATFORM]. Start with a strong 2-second hook, keep the pacing energetic, add concise narration and on-screen text ideas, and finish with a clear call to action.'],
      ['explainer','Create an easy-to-understand explainer video about [TOPIC]. Break the subject into simple scenes, use everyday examples, suggest visuals for each point, and end with a short recap.']
    ],
    'Image Studio': [
      ['photoreal','Create a detailed photorealistic image of [SUBJECT] in [SETTING]. Composition: [COMPOSITION]. Lighting: [LIGHTING]. Color palette: [COLORS]. Camera perspective: [ANGLE]. High detail, coherent anatomy and materials, clean background, no text or watermark.'],
      ['poster','Design a polished poster for [EVENT/IDEA]. Main subject: [SUBJECT]. Visual mood: [MOOD]. Layout: clear focal point, balanced negative space, strong contrast, and an uncluttered area for a title.'],
      ['product','Create a premium product image featuring [PRODUCT]. Use a clean studio setup, soft controlled lighting, realistic materials, elegant composition, and a refined background that complements the product.']
    ],
    'Voice Studio': [
      ['narration','Write a natural voiceover script about [TOPIC] for [AUDIENCE]. Tone: [TONE]. Use conversational language, short speakable sentences, clear pauses, and a strong opening and closing.'],
      ['podcast','Create a podcast episode outline about [TOPIC]. Include a welcoming introduction, 4–6 discussion points, questions for the host, natural transitions, and a concise closing.'],
      ['advert','Write a concise audio advertisement for [PRODUCT/SERVICE]. Audience: [AUDIENCE]. Tone: [TONE]. Highlight the main benefit, use memorable wording, and finish with a clear call to action.']
    ],
    'Writing Studio': [
      ['article','Write a well-structured article about [TOPIC] for [AUDIENCE]. Use a compelling headline, engaging introduction, clear section headings, practical examples, and a concise conclusion. Keep the tone [TONE].'],
      ['social','Create 5 original social media post ideas about [TOPIC] for [PLATFORM]. Each should have a distinct angle, an engaging first line, concise body copy, and a relevant call to action.'],
      ['story','Develop an original story about [PREMISE]. Main character: [CHARACTER]. Setting: [SETTING]. Genre: [GENRE]. Establish a clear conflict, meaningful character choices, and a satisfying ending.']
    ],
    'Creative Studio': [
      ['idea','Help develop this idea: [IDEA]. Define the goal, intended audience, key message, creative direction, and practical next steps.'],
      ['campaign','Create a creative campaign concept for [PRODUCT/CAUSE]. Define the target audience, central message, visual direction, content ideas, and a simple rollout plan.']
    ]
  };
  function populateTemplates(studio) {
    const select = $('templateSelect');
    if (!select) return;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = 'Choose a starter…';
    select.append(placeholder);
    (templateSets[studio] || templateSets['Creative Studio']).forEach(([key]) => {
      const option = document.createElement('option');
      option.value = key; option.textContent = key.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
      select.append(option);
    });
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
        title.value = item.title; prompt.value = item.prompt; activeStudio = item.studio || 'Creative Studio'; editingId = item.id; populateTemplates(activeStudio);
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

  populateTemplates(activeStudio);

  const themeNames = ['midnight','white-glow','ocean','emerald','rose','ruby','sunset','gold','sky','cyan','lavender','mint','cherry','amoled'];
  const themeClasses = themeNames.map(name => name + '-theme');
  function applyTheme(theme) {
    document.body.classList.remove(...themeClasses);
    if (theme !== 'dark' && themeNames.includes(theme)) document.body.classList.add(theme + '-theme');
  }
  const savedTheme = localStorage.getItem('synora.theme') || 'white-glow';
  applyTheme(['dark', ...themeNames].includes(savedTheme) ? savedTheme : 'white-glow');

  $('projectSearch').addEventListener('input', () => { searchTerm = $('projectSearch').value.trim().toLowerCase(); renderProjects(); });
  $('newProject').addEventListener('click', () => { editingId = null; title.value = ''; prompt.value = ''; activeStudio = 'Creative Studio'; populateTemplates(activeStudio); $('workspaceTitle').textContent = 'Start creating'; $('charCount').textContent = '0 / 2000'; showNotice('New brief ready. Add a title and describe your idea.'); $('workspace').scrollIntoView({behavior:'smooth'}); title.focus({preventScroll:true}); });
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
      populateTemplates(activeStudio);
      showNotice(activeStudio + ' is a planning workspace in this preview. Live AI generation is not connected yet.');
      $('workspace').scrollIntoView({behavior:'smooth'});
      title.focus({preventScroll:true});
    });
  });

  $('insertTemplate').addEventListener('click', () => {
    const key = $('templateSelect').value;
    const selected = (templateSets[activeStudio] || templateSets['Creative Studio']).find(item => item[0] === key);
    if (!selected) {
      showNotice('Choose a prompt starter first.');
      $('templateSelect').focus();
      return;
    }
    const starter = selected[1];
    prompt.value = prompt.value.trim() ? prompt.value.trim() + '\n\n' + starter : starter;
    $('charCount').textContent = prompt.value.length + ' / 2000';
    prompt.focus();
    showNotice('Starter added. Replace the [BRACKETED] notes with your own details.');
  });
  $('copyPrompt').addEventListener('click', async () => {
    if (!prompt.value.trim()) {
      showNotice('There is no brief to copy yet.');
      prompt.focus();
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt.value);
      showNotice('Brief copied to clipboard.');
    } catch {
      showNotice('Clipboard access is unavailable. Select the brief text and copy it manually.');
      prompt.focus();
      prompt.select();
    }
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
  if ($('profileBtn')) $('profileBtn').addEventListener('click', () => {
    showNotice('Account sign-in is not connected in this preview. A secure authentication backend is needed.');
    $('workspace').scrollIntoView({behavior:'smooth'});
  });
  const languageSelect = $('languageSelect');
  if (languageSelect) {
    languageSelect.value = localStorage.getItem('synora.language') || '';
    languageSelect.addEventListener('change', () => {
      const language = languageSelect.value;
      if (!language) return;
      localStorage.setItem('synora.language', language);
      const target = 'https://translate.google.com/translate?sl=auto&tl=' + encodeURIComponent(language) + '&u=' + encodeURIComponent(location.href);
      window.open(target, '_blank', 'noopener');
      showNotice('Opening a translated view. Automatic translation is provided by Google Translate.');
    });
  }

  const chatForm = $('chatForm');
  const chatInput = $('chatInput');
  const chatMessages = $('chatMessages');
  const chatNotice = $('chatNotice');
  const chatSend = $('chatSend');
  function setChatNotice(message, visible = true) {
    if (!chatNotice) return;
    chatNotice.textContent = message;
    chatNotice.hidden = !visible;
  }
  const CHAT_STORAGE_KEY = 'synora.chatHistory.v2';
  const MOVIE_STORAGE_KEY = 'synora.movieTranscript.v1';
  let chatHistory = [];
  let visibleHistory = [];
  let movieTranscript = '';
  try {
    const savedChat = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    if (Array.isArray(savedChat)) chatHistory = savedChat.filter(item =>
      item && ['user','assistant'].includes(item.role) && typeof item.content === 'string'
    ).slice(-10);
    const savedVisible = JSON.parse(localStorage.getItem('synora.visibleChat.v1') || '[]');
    if (Array.isArray(savedVisible)) visibleHistory = savedVisible.filter(item => item && ['user','assistant'].includes(item.role) && typeof item.content === 'string').slice(-40);
    movieTranscript = localStorage.getItem(MOVIE_STORAGE_KEY) || '';
  } catch { chatHistory = []; movieTranscript = ''; }
  function persistChatState() {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory.slice(-10)));
      localStorage.setItem('synora.visibleChat.v1', JSON.stringify(visibleHistory.slice(-40)));
      if (movieTranscript) localStorage.setItem(MOVIE_STORAGE_KEY, movieTranscript);
      else localStorage.removeItem(MOVIE_STORAGE_KEY);
    } catch { setChatNotice('এই ব্রাউজারে মেমোরি সংরক্ষণ করা যায়নি। ডাউনলোড করে রাখুন।'); }
  }
  function addChatBubble(role, content, record = true) {
    if (record) {
      visibleHistory.push({role, content});
      visibleHistory = visibleHistory.slice(-40);
    }
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'assistant' ? 'assistant-bubble' : 'user-bubble');
    bubble.textContent = content;
    chatMessages.append(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function restoreVisibleChat() {
    if (!chatHistory.length) return;
    chatMessages.replaceChildren();
    visibleHistory.forEach(item => addChatBubble(item.role, item.content, false));
    if (movieTranscript) renderMovieDownloadButton();
  }
  function downloadTextFile(text, filename) {
    const blob = new Blob(['\\ufeff', text], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  let chatImageData = '';
  const chatImageInput = $('chatImage');
  const chatImageName = $('chatImageName');
  const chatImagePreview = $('chatImagePreview');
  const chatImageThumb = $('chatImageThumb');
  $('removeChatImage').addEventListener('click', () => {
    chatImageData = '';
    chatImageInput.value = '';
    chatImagePreview.hidden = true;
    chatImageName.textContent = 'JPG, PNG or WEBP · max 3 MB';
  });
  async function prepareImageForEdit(file) {
    // FLUX.2 Klein reference images must be below 512x512; resize locally before upload.
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.88);
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  chatImageInput.addEventListener('change', async () => {
    const file = chatImageInput.files && chatImageInput.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setChatNotice('Choose a JPG, PNG or WEBP image.');
      chatImageInput.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setChatNotice('Image must be 3 MB or smaller.');
      chatImageInput.value = '';
      return;
    }
    try {
      chatImageData = await prepareImageForEdit(file);
      chatImageThumb.src = chatImageData;
      chatImageName.textContent = file.name + ' · ready to edit';
      chatImagePreview.hidden = false;
      setChatNotice('Image ready. Describe the edit you want, then press Send.');
    } catch {
      setChatNotice('Could not prepare this image. Please choose another photo.');
      chatImageInput.value = '';
    }
  });
  function renderMovieDownloadButton() {
    const old = chatMessages.querySelector('.movie-result-actions');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.className = 'chat-bubble assistant-bubble movie-result-actions';
    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'image-download';
    download.textContent = 'সম্পূর্ণ চিত্রনাট্য TXT ডাউনলোড ↓';
    download.addEventListener('click', () => downloadTextFile(movieTranscript, 'synora-complete-screenplay.txt'));
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'image-download';
    clear.textContent = 'নতুন সিনেমা শুরু';
    clear.addEventListener('click', () => {
      movieTranscript = '';
      movieModeActive = false;
      chatHistory = [];
      chatMessages.replaceChildren();
      persistChatState();
      addChatBubble('assistant', 'নতুন সিনেমার জন্য প্রস্তুত। আপনার সিনেমার ধারণা লিখুন।');
    });
    wrap.append(download, clear);
    chatMessages.append(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function renderMoviePackage(reply) {
    addChatBubble('assistant', reply);
    movieTranscript = (movieTranscript ? movieTranscript + String.fromCharCode(10,10) : '') + reply;
    persistChatState();
    renderMovieDownloadButton();
  }

  function addChatImageBubble(dataUrl) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-bubble assistant-bubble image-result-bubble';
    const image = document.createElement('img');
    image.src = dataUrl;
    image.alt = 'SYNORA AI edited image';
    image.loading = 'lazy';
    const download = document.createElement('a');
    download.href = dataUrl;
    download.download = 'synora-edited-image.png';
    download.className = 'image-download';
    download.textContent = 'Download edited image ↓';
    wrap.append(image, download);
    chatMessages.append(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  let movieModeActive = Boolean(movieTranscript);
  function isMovieContinuationRequest(text) {
    return /(পরের অংশ|পরের দৃশ্য|পরবর্তী দৃশ্য|চালিয়ে যাও|চালিয়ে যাও|continue|next scene|next part|continue screenplay|লেখা চালাও)/i.test(text);
  }

  function isMovieBuildRequest(text) {
    return /(movie|film|cinema|short film|feature film|সিনেমা|চলচ্চিত্র|মুভি|ফিল্ম)/i.test(text)
      && /(বানাও|তৈরি|create|make|generate|লিখ|করো|চাই|build)/i.test(text);
  }

  function isWebsiteBuildRequest(text) {
    return /(website|web site|webpage|web page|ওয়েবসাইট|ওয়েবসাইট|ওয়েব পেজ|ওয়েব পেজ|সাইট বানাও|সাইট তৈরি|ওয়েব অ্যাপ|ওয়েব অ্যাপ)/i.test(text);
  }
  function renderWebsitePreview(html) {
    const wrap = document.createElement('section');
    wrap.className = 'chat-bubble assistant-bubble website-result-bubble';
    const heading = document.createElement('strong');
    heading.textContent = 'Your website preview';
    const actions = document.createElement('div');
    actions.className = 'website-result-actions';
    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'image-download';
    download.textContent = 'Download website HTML ↓';
    download.addEventListener('click', () => {
      const blob = new Blob([html], {type:'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'synora-website.html';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'image-download';
    open.textContent = 'Open preview in new tab ↗';
    open.addEventListener('click', () => {
      const blob = new Blob([html], {type:'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, '_blank', 'noopener');
      if (!tab) {
        const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
    actions.append(download, open);
    const frame = document.createElement('iframe');
    frame.className = 'website-preview-frame';
    frame.title = 'Generated website preview';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.srcdoc = html;
    wrap.append(heading, actions, frame);
    chatMessages.append(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function extractWebsiteHtml(reply) {
    const match = reply.match(/```(?:html)?\\s*([\\s\\S]*?)```/i);
    const candidate = match ? match[1].trim() : reply.trim();
    return /<!doctype html|<html[\\s>]/i.test(candidate) ? candidate : '';
  }

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    const imageToSend = chatImageData;
    if ((!message && !imageToSend) || chatSend.disabled) return;

    if (imageToSend) {
      chatInput.value = '';
      addChatBubble('user', message || 'Please enhance this image.');
      chatSend.disabled = true;
      chatSend.textContent = 'Editing…';
      setChatNotice('SYNORA Image AI is editing your photo…');
      try {
        const response = await fetch('/api/image-edit', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            prompt:message || 'Enhance this image while preserving the main subject and overall composition.',
            image:imageToSend
          })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Image editing is unavailable right now.');
        if (typeof payload.image !== 'string' || !payload.image.startsWith('data:image/')) {
          throw new Error('The image service returned no edited image.');
        }
        addChatBubble('assistant', 'Your edited image is ready.');
        addChatImageBubble(payload.image);
        chatImageData = '';
        chatImageInput.value = '';
        chatImagePreview.hidden = true;
        chatImageName.textContent = 'JPG, PNG or WEBP · max 3 MB';
        setChatNotice('Image edit complete.', false);
      } catch (error) {
        chatInput.value = message;
        addChatBubble('assistant', 'I could not edit that image. ' + (error.message || 'Please try again.'));
        setChatNotice(error.message || 'Image editing failed. Check the server configuration.');
      } finally {
        chatSend.disabled = false;
        chatSend.textContent = 'Send ↗';
        chatInput.focus();
      }
      return;
    }

    chatInput.value = '';
    addChatBubble('user', message);
    const buildWebsite = isWebsiteBuildRequest(message);
    const buildMovie = !buildWebsite && isMovieBuildRequest(message);
    const continueMovie = !buildWebsite && !buildMovie && movieModeActive && isMovieContinuationRequest(message);
    if (buildMovie) {
      movieTranscript = '';
      movieModeActive = true;
      chatHistory = [];
    }
    const lineBreak = String.fromCharCode(10);
    const movieContext = movieTranscript
      ? lineBreak + lineBreak + 'CANONICAL MOVIE STORY SO FAR (continue this exact story; do not restart):' + lineBreak + movieTranscript.slice(0, 2200) + (movieTranscript.length > 4400 ? lineBreak + '[Earlier material abbreviated]' + lineBreak + movieTranscript.slice(-2200) : movieTranscript.slice(2200))
      : '';
    const requestContent = buildWebsite
      ? message + lineBreak + lineBreak + 'Create a complete, polished, mobile-responsive single-file website now. Return the entire working HTML document including embedded CSS and JavaScript inside one ```html code fence. Do not return a plan or partial snippets. Use accessible semantic HTML, responsive styling, and working interactions. Do not use external build tools or require API keys.'
      : (continueMovie
        ? message + movieContext + lineBreak + lineBreak + 'Continue from the exact next scene after the latest scene in the canonical story above. Preserve title, characters, facts, plot, tone and scene numbering. Do not repeat the outline or opening scene. Write the next 5–8 minutes as a complete screenplay section with scene headings, action and age-appropriate dialogue. Add this section to the continuing screenplay. This is text only, not an MP4 or rendered video.'
        : (buildMovie
          ? message + lineBreak + lineBreak + 'Act as SYNORA AI Movie Studio. This is a text screenplay workflow, not video rendering. Do not claim an MP4/video has been generated. Create a production-ready movie package in the user’s language: title, genre, 120-minute target runtime, logline, premise, character bible, visual style, three-act structure with timings, and a numbered scene list whose timings total 120 minutes. Then write only the opening 5–8 minutes as a complete screenplay with scene headings, action and age-appropriate dialogue. Clearly say the output is a screenplay, not a finished movie. Tell the user to type “পরের দৃশ্য” to continue.'
          : message));
    chatHistory.push({role:'user', content:requestContent});
    chatSend.disabled = true;
    chatSend.textContent = 'Thinking…';
    setChatNotice('Connecting securely to SYNORA AI…');
    try {
      const response = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:chatHistory})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'AI service is unavailable right now.');
      if (typeof payload.reply !== 'string' || !payload.reply.trim()) throw new Error('The AI service returned an empty reply.');
      chatHistory.push({role:'assistant', content:payload.reply});
      chatHistory = chatHistory.slice(-10);
      const websiteHtml = buildWebsite ? extractWebsiteHtml(payload.reply) : '';
      if (websiteHtml) {
        addChatBubble('assistant', 'I created your website. Preview it below or download the HTML file.');
        renderWebsitePreview(websiteHtml);
      } else if (buildMovie || continueMovie) {
        renderMoviePackage(payload.reply);
      } else {
        addChatBubble('assistant', payload.reply);
        if (buildWebsite) setChatNotice('AI replied, but did not return a complete HTML document. Ask: “Return the full website as one HTML code block.”');
      }
      persistChatState();
      setChatNotice('Connected. Replies are generated by the configured AI provider.', false);
    } catch (error) {
      chatHistory.pop();
      persistChatState();
      chatInput.value = message;
      addChatBubble('assistant', 'I could not connect just now. ' + (error.message || 'Please try again later.'));
      persistChatState();
      setChatNotice(location.hostname.endsWith('github.io')
        ? 'GitHub Pages cannot run the /api/chat server. Open the Vercel website.'
        : (error.message || 'AI connection failed. Check the Vercel server configuration.'));
    } finally {
      chatSend.disabled = false;
      chatSend.textContent = 'Send ↗';
      chatInput.focus();
    }
  });
  restoreVisibleChat();
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  renderProjects();
})();