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

  // Optional browser-native voice input and spoken replies (no external API key).
  const voiceInputButton = $('voiceInputButton');
  const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let activeRecognition = null;
  let isVoiceListening = false;
  function preferredSpeechLanguage() {
    const text = (chatInput && chatInput.value) || '';
    return /[\\u0980-\\u09FF]/.test(text) ? 'bn-IN' : 'en-IN';
  }
  function setVoiceButtonState(listening) {
    isVoiceListening = listening;
    if (!voiceInputButton) return;
    voiceInputButton.innerHTML = listening
      ? '<svg class="voice-mic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>'
      : '<svg class="voice-mic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3"></rect><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7"></path></svg>';
    voiceInputButton.setAttribute('aria-label', listening ? 'Stop voice input' : 'Speak to SYNORA');
    voiceInputButton.title = listening ? 'Stop listening' : 'Speak to SYNORA';
    voiceInputButton.classList.toggle('voice-listening', listening);
  }
  if (voiceInputButton) {
    if (!speechRecognition) {
      voiceInputButton.disabled = true;
      voiceInputButton.title = 'Voice input is not supported in this browser';
      voiceInputButton.setAttribute('aria-label', 'Voice input is not supported');
    } else {
      voiceInputButton.addEventListener('click', () => {
        if (isVoiceListening && activeRecognition) { activeRecognition.stop(); return; }
        try {
          const recognition = new speechRecognition();
          activeRecognition = recognition;
          recognition.lang = preferredSpeechLanguage();
          recognition.interimResults = true;
          recognition.continuous = false;
          recognition.onstart = () => { setVoiceButtonState(true); setChatNotice('শুনছি… কথা বলুন।'); };
          recognition.onresult = (event) => {
            let finalText = '';
            let interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript || '';
              if (event.results[i].isFinal) finalText += transcript;
              else interimText += transcript;
            }
            if (finalText) {
              chatInput.value = (chatInput.value.trim() ? chatInput.value.trim() + ' ' : '') + finalText.trim();
              chatInput.dispatchEvent(new Event('input', {bubbles:true}));
            }
            if (interimText) setChatNotice('শুনছি: ' + interimText, true);
          };
          recognition.onerror = (event) => setChatNotice('Voice input: ' + (event.error || 'not available') + '. চাইলে টাইপ করে পাঠান।');
          recognition.onend = () => { setVoiceButtonState(false); activeRecognition = null; if (chatNotice && chatNotice.textContent.startsWith('শুনছি')) setChatNotice('', false); };
          recognition.start();
        } catch { setVoiceButtonState(false); setChatNotice('Voice input চালু করা যায়নি। Browser permission পরীক্ষা করুন।'); }
      });
    }
  }
  function speakAssistantReply(text, button) {
    if (!('speechSynthesis' in window)) { setChatNotice('এই browser-এ spoken replies সমর্থিত নয়।'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\\u0980-\\u09FF]/.test(text) ? 'bn-IN' : 'en-IN';
    utterance.rate = 1;
    utterance.onstart = () => { if (button) { button.textContent = '■ Stop'; button.setAttribute('aria-label', 'Stop reading this SYNORA reply'); } };
    utterance.onend = utterance.onerror = () => { if (button) { button.textContent = '🔊 Read aloud'; button.setAttribute('aria-label', 'Read aloud — this SYNORA reply'); } };
    if (button) { button.textContent = '■ Stop'; button.setAttribute('aria-label', 'Stop reading this SYNORA reply'); }
    window.speechSynthesis.speak(utterance);
  }
  function setChatNotice(message, visible = true) {
    if (!chatNotice) return;
    chatNotice.textContent = message;
    chatNotice.hidden = !visible;
  }
  const CHAT_STORAGE_KEY = 'synora.chatHistory.v2';
  const CONVERSATIONS_KEY = 'synora.conversations.v1';
  let currentConversationId = 'chat-' + Date.now();
  let conversations = [];
  function makeConversationId() { return 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); }
  function conversationTitle(items) {
    const first = items.find(item => item.role === 'user' && item.content.trim());
    return first ? first.content.trim().replace(/\\s+/g, ' ').slice(0, 42) : 'New chat';
  }
  function readConversations() {
    try {
      const value = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && Array.isArray(item.messages)) : [];
    } catch { return []; }
  }
  function saveCurrentConversation() {
    if (!visibleHistory.length) return;
    const entry = {id:currentConversationId,title:conversationTitle(visibleHistory),messages:visibleHistory.slice(-80),apiMessages:chatHistory.slice(-20),movieTranscript,updatedAt:new Date().toISOString()};
    conversations = conversations.filter(item => item.id !== currentConversationId);
    conversations.unshift(entry); conversations = conversations.slice(0,25);
    try { localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations)); }
    catch { setChatNotice('চ্যাটের জায়গা পূর্ণ। পুরোনো চ্যাট মুছে বা ডাউনলোড করে রাখুন।'); }
    renderConversationList();
  }
  function renderConversationList() {
    const host = $('chatHistoryList'); if (!host) return;
    host.replaceChildren();
    if (!conversations.length) {
      const empty=document.createElement('p'); empty.className='chat-history-empty'; empty.textContent='এখনো কোনো পুরোনো চ্যাট নেই'; host.append(empty); return;
    }
    conversations.forEach(item => {
      const row=document.createElement('div'); row.className='chat-history-row';
      const open=document.createElement('button'); open.type='button'; open.className='chat-history-open'; open.textContent=item.title||'New chat'; open.title=item.title||'New chat';
      open.addEventListener('click',()=>{
        saveCurrentConversation(); currentConversationId=item.id;
        chatHistory=cleanApiMessages(Array.isArray(item.apiMessages)?item.apiMessages:item.messages);
        visibleHistory=item.messages.slice(-80); movieTranscript=item.movieTranscript||'';
        chatMessages.replaceChildren(); visibleHistory.forEach(message=>addChatBubble(message.role,message.content,false));
        persistChatState(); renderConversationList(); setChatNotice('আগের চ্যাট খোলা হয়েছে।'); closeChatMenu(); chatInput.focus();
      });
      const remove=document.createElement('button'); remove.type='button'; remove.className='chat-history-delete'; remove.textContent='×'; remove.setAttribute('aria-label','Delete chat');
      remove.addEventListener('click',()=>{
        conversations=conversations.filter(entry=>entry.id!==item.id);
        try{localStorage.setItem(CONVERSATIONS_KEY,JSON.stringify(conversations));}catch{}
        if(currentConversationId===item.id){currentConversationId=makeConversationId();chatHistory=[];visibleHistory=[];movieTranscript='';chatMessages.replaceChildren();addChatBubble('assistant','Hello! I’m SYNORA AI. What would you like help with today?');persistChatState();}
        renderConversationList();
      });
      row.append(open,remove); host.append(row);
    });
  }
  function closeChatMenu() {
    const menu=$('navDropdown'),toggle=$('menuToggle'); if(menu)menu.hidden=true;
    if(toggle){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation menu');}
  }
  const MOVIE_STORAGE_KEY = 'synora.movieTranscript.v1';
  let chatHistory = [];
  let visibleHistory = [];
  function cleanApiMessages(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(item =>
      item && ['user','assistant'].includes(item.role) &&
      typeof item.content === 'string' && item.content.trim().length > 0
    ).map(item => ({ role: item.role, content: item.content.slice(0, 5000) })).slice(-10);
  }
  let movieTranscript = '';
  try {
    const savedChat = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    if (Array.isArray(savedChat)) chatHistory = cleanApiMessages(savedChat);
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
      saveCurrentConversation();
    } catch { setChatNotice('এই ব্রাউজারে মেমোরি সংরক্ষণ করা যায়নি। ডাউনলোড করে রাখুন।'); }
  }
  function addChatBubble(role, content, record = true) {
    if (record) {
      visibleHistory.push({role, content});
      visibleHistory = visibleHistory.slice(-40);
    }
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'assistant' ? 'assistant-bubble' : 'user-bubble');
    const messageText = document.createElement('span');
    messageText.className = 'chat-message-text';
    messageText.textContent = content;
    bubble.append(messageText);
    if (role === 'assistant') {
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'copy-message-btn';
      copyButton.textContent = 'Copy';
      copyButton.setAttribute('aria-label', 'Copy this SYNORA reply');
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(content);
          copyButton.textContent = 'Copied';
          setTimeout(() => { copyButton.textContent = 'Copy'; }, 1400);
        } catch {
          const area = document.createElement('textarea');
          area.value = content;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.append(area);
          area.select();
          const copied = document.execCommand('copy');
          area.remove();
          copyButton.textContent = copied ? 'Copied' : 'Select text';
          setTimeout(() => { copyButton.textContent = 'Copy'; }, 1400);
        }
      });
      bubble.append(copyButton);
      const speakButton = document.createElement('button');
      speakButton.type = 'button';
      speakButton.className = 'speak-message-btn';
      speakButton.textContent = '🔊 Read aloud';
      speakButton.setAttribute('aria-label', 'Read aloud — this SYNORA reply');
      speakButton.addEventListener('click', () => {
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          speakButton.textContent = '🔊 Read aloud';
          speakButton.setAttribute('aria-label', 'Read aloud — this SYNORA reply');
        } else {
          speakAssistantReply(content, speakButton);
        }
      });
      bubble.append(speakButton);
    }
    chatMessages.append(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function restoreVisibleChat() {
    conversations = readConversations();
    const matchingCurrent = conversations.find(item => Array.isArray(item.messages) && JSON.stringify(item.messages.slice(-80)) === JSON.stringify(visibleHistory.slice(-80)));
    if (matchingCurrent) currentConversationId = matchingCurrent.id;
    if (!conversations.length && visibleHistory.length) {
      conversations.unshift({id:currentConversationId,title:conversationTitle(visibleHistory),messages:visibleHistory.slice(-80),apiMessages:chatHistory.slice(-20),movieTranscript,updatedAt:new Date().toISOString()});
      try { localStorage.setItem(CONVERSATIONS_KEY,JSON.stringify(conversations)); } catch {}
    }
    renderConversationList();
    if (!chatHistory.length && !visibleHistory.length) return;
    chatMessages.replaceChildren();
    visibleHistory.forEach(item => addChatBubble(item.role, item.content, false));
    if (movieTranscript) renderMovieDownloadButton();
  }
  function downloadTextFile(text, filename) {
    const blob = new Blob([String.fromCharCode(65279), text], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Chat actions available from the navigation menu.
  const newChatAction = $('newChatAction');
  if (newChatAction) newChatAction.addEventListener('click', () => {
    saveCurrentConversation();
    currentConversationId = makeConversationId();
    chatHistory = [];
    visibleHistory = [];
    movieTranscript = '';
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      localStorage.removeItem('synora.visibleChat.v1');
      localStorage.removeItem(MOVIE_STORAGE_KEY);
    } catch {}
    chatMessages.replaceChildren();
    addChatBubble('assistant', 'Hello! I’m SYNORA AI. What would you like help with today?');
    persistChatState();
    setChatNotice('নতুন চ্যাট শুরু হয়েছে।');
    renderConversationList();
    closeChatMenu();
    chatInput.focus();
  });
  const revenueCenterAction = $('revenueCenterAction');
  if (revenueCenterAction) revenueCenterAction.addEventListener('click', () => {
    closeChatMenu();
    document.body.classList.remove('chat-home');
    const section = $('revenue-center');
    if (section) setTimeout(() => section.scrollIntoView({behavior:'smooth',block:'start'}), 40);
  });

  // Revenue Center demos: local-only previews, no billing or live API calls.
  const revenueSection = $('revenue-center');
  if (revenueSection) {
    const setDemoText = (selector, value) => {
      const node = revenueSection.querySelector(selector);
      if (node) node.textContent = value;
    };
    const copyDemoText = async (value, outputSelector, successText) => {
      const output = revenueSection.querySelector(outputSelector);
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        if (output) output.textContent = successText;
      } catch {
        if (output) output.textContent = 'Copy was not available in this browser. Select the example text and copy it manually.';
      }
    };
    const updateChecklist = (demoSelector, outputSelector) => {
      const demo = revenueSection.querySelector(demoSelector);
      if (!demo) return;
      const boxes = [...demo.querySelectorAll('input[type="checkbox"]')];
      const done = boxes.filter(box => box.checked).length;
      setDemoText(outputSelector, done + ' of ' + boxes.length + ' preparation steps complete.');
    };

    const licenseDemo = revenueSection.querySelector('[data-demo="license"]');
    if (licenseDemo) {
      licenseDemo.querySelector('[data-action="license-preview"]')?.addEventListener('click', () => {
        const product = licenseDemo.querySelector('[data-license-product]')?.value.trim() || 'Unnamed product';
        const users = licenseDemo.querySelector('[data-license-users]')?.value || 'Not specified';
        const out = licenseDemo.querySelector('[data-license-output]');
        if (out) out.textContent = 'Sample scope: ' + product + ' · Permitted use: ' + users + '. This is a planning summary only, not a legal licence or offer.';
      });
    }

    const whiteDemo = revenueSection.querySelector('[data-demo="whitelabel"]');
    if (whiteDemo) {
      const nameInput = whiteDemo.querySelector('[data-brand-name]');
      const colorInput = whiteDemo.querySelector('[data-brand-color]');
      const preview = whiteDemo.querySelector('[data-brand-preview]');
      const refreshBrand = () => {
        const name = (nameInput?.value || '').trim() || 'Your workspace';
        const color = colorInput?.value || '#7652c9';
        const title = whiteDemo.querySelector('[data-brand-preview-name]');
        if (title) title.textContent = name;
        if (preview) preview.style.setProperty('--brand-accent', color);
      };
      const brandOutput = whiteDemo.querySelector('[data-brand-output]');
      const brandBrief = () => {
        const name = (nameInput?.value || '').trim() || 'Your workspace';
        const color = colorInput?.value || '#7652c9';
        return 'SYNORA White-label Brand Brief\\nBrand name: ' + name + '\\nAccent colour: ' + color + '\\nStatus: Local planning preview only. No tenant, customer site, deployment, contract or payment is active.';
      };
      nameInput?.addEventListener('input', refreshBrand);
      colorInput?.addEventListener('change', refreshBrand);
      whiteDemo.querySelector('[data-action="save-brand"]')?.addEventListener('click', () => {
        try {
          localStorage.setItem('synora-white-label-brand', JSON.stringify({name:(nameInput?.value || '').trim() || 'Your workspace', color:colorInput?.value || '#7652c9'}));
          if (brandOutput) brandOutput.textContent = 'Brand settings saved in this browser on this device.';
        } catch {
          if (brandOutput) brandOutput.textContent = 'Could not save in this browser. You can still copy the brand brief.';
        }
      });
      whiteDemo.querySelector('[data-action="copy-brand"]')?.addEventListener('click', () => {
        copyDemoText(brandBrief(), '[data-brand-output]', 'Brand brief copied. It is an informational preview, not a live white-label deployment.');
      });
      try {
        const saved = JSON.parse(localStorage.getItem('synora-white-label-brand') || 'null');
        if (saved && typeof saved.name === 'string' && typeof saved.color === 'string') {
          if (nameInput) nameInput.value = saved.name.slice(0, 36);
          if (colorInput && [...colorInput.options].some(option => option.value === saved.color)) colorInput.value = saved.color;
        }
      } catch {}
      refreshBrand();
    }

    const resellerDemo = revenueSection.querySelector('[data-demo="reseller"]');
    resellerDemo?.querySelectorAll('input[type="checkbox"]').forEach(box => box.addEventListener('change', () => {
      const boxes = [...resellerDemo.querySelectorAll('input[type="checkbox"]')];
      const done = boxes.filter(item => item.checked).length;
      setDemoText('[data-check-progress]', done + ' of ' + boxes.length + ' preparation steps complete. This is a planning checklist, not partner registration.');
    }));
    if (resellerDemo) {
      const partnerBrief = () => {
        const name = resellerDemo.querySelector('[data-partner-name]')?.value.trim() || 'Unnamed organisation';
        const model = resellerDemo.querySelector('[data-partner-model]')?.value || 'Referral partner';
        const support = resellerDemo.querySelector('[data-partner-support]')?.value || 'To be agreed';
        return 'SYNORA RESELLER PROGRAMME — PLANNING BRIEF\\nOrganisation: ' + name + '\\nPartner model: ' + model + '\\nSupport approach: ' + support + '\\nStatus: Draft only. No registration, approval, contract, commission, payment or reseller access is active.';
      };
      const output = resellerDemo.querySelector('[data-partner-output]');
      resellerDemo.querySelector('[data-action="partner-preview"]')?.addEventListener('click', () => {
        if (output) output.textContent = partnerBrief();
      });
      resellerDemo.querySelector('[data-action="partner-save"]')?.addEventListener('click', () => {
        try {
          localStorage.setItem('synora-reseller-draft', JSON.stringify({
            name: resellerDemo.querySelector('[data-partner-name]')?.value.trim() || '',
            model: resellerDemo.querySelector('[data-partner-model]')?.value || 'Referral partner',
            support: resellerDemo.querySelector('[data-partner-support]')?.value || 'SYNORA handles product support'
          }));
          if (output) output.textContent = partnerBrief() + '\\n\\nSaved in this browser on this device.';
        } catch {
          if (output) output.textContent = 'Could not save this draft in the browser. You can still create or copy the brief.';
        }
      });
      resellerDemo.querySelector('[data-action="partner-copy"]')?.addEventListener('click', () => {
        copyDemoText(partnerBrief(), '[data-partner-output]', 'Partner brief copied. This is not a registration or approval.');
      });
      try {
        const saved = JSON.parse(localStorage.getItem('synora-reseller-draft') || 'null');
        if (saved && typeof saved === 'object') {
          const name = resellerDemo.querySelector('[data-partner-name]');
          const model = resellerDemo.querySelector('[data-partner-model]');
          const support = resellerDemo.querySelector('[data-partner-support]');
          if (name && typeof saved.name === 'string') name.value = saved.name.slice(0, 60);
          if (model && [...model.options].some(option => option.value === saved.model)) model.value = saved.model;
          if (support && [...support.options].some(option => option.value === saved.support)) support.value = saved.support;
        }
      } catch {}
    }

    const apiDemo = revenueSection.querySelector('[data-demo="api"]');
    if (apiDemo) {
      const endpoint = apiDemo.querySelector('[data-api-endpoint]');
      const request = apiDemo.querySelector('[data-api-request]');
      const output = apiDemo.querySelector('[data-api-output]');
      const examples = {
        status: { path: '/api/v1/status', response: { success: true, service: 'SYNORA API', status: 'example-only', note: 'Illustrative response; no live service was contacted.' } },
        profile: { path: '/api/v1/profile', response: { success: true, user: { id: 'demo-user', plan: 'sample' }, note: 'Fictional sample data only.' } },
        usage: { path: '/api/v1/usage', response: { success: true, usage: { requests: 0, period: 'sample-month' }, note: 'Fictional sample data only.' } }
      };
      const current = () => examples[endpoint?.value] || examples.status;
      const refreshRequest = () => {
        if (request) request.textContent = 'GET ' + current().path + '\\nAccept: application/json';
      };
      endpoint?.addEventListener('change', refreshRequest);
      apiDemo.querySelector('[data-action="live-api-status"]')?.addEventListener('click', async () => {
        if (output) output.textContent = 'Checking the live SYNORA API endpoint…';
        try {
          const response = await fetch('/api/v1/status', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.error || 'API status check failed.');
          if (output) output.textContent = 'LIVE ENDPOINT REACHED\\n' + JSON.stringify(data, null, 2) + '\\nAuthenticated chat requires the project administrator to configure SYNORA_API_KEY in Vercel.';
        } catch (error) {
          if (output) output.textContent = 'Could not reach the live API endpoint. ' + (error?.message || 'Please try again after deployment.');
        }
      });
      apiDemo.querySelector('[data-action="preview-api"]')?.addEventListener('click', () => {
        if (output) output.textContent = '200 OK — illustrative sample only\\n' + JSON.stringify(current().response, null, 2) + '\\nNo request was sent.';
      });
      apiDemo.querySelector('[data-action="copy-api"]')?.addEventListener('click', () => {
        copyDemoText('curl -X GET "https://api.example.invalid' + current().path + '" -H "Accept: application/json"', '[data-api-output]', 'Example cURL copied. It uses a reserved example domain and will not call SYNORA.');
      });
      apiDemo.querySelectorAll('input[type="checkbox"]').forEach(box => box.addEventListener('change', () => {
        const boxes = [...apiDemo.querySelectorAll('input[type="checkbox"]')];
        const done = boxes.filter(item => item.checked).length;
        setDemoText('[data-api-progress]', done + ' of ' + boxes.length + ' API launch checks complete. Checklist only; API access is not live.');
      }));
      refreshRequest();
    }

    const templateDemo = revenueSection.querySelector('[data-demo="templates"]');
    if (templateDemo) {
      const search = templateDemo.querySelector('[data-template-search]');
      const category = templateDemo.querySelector('[data-template-category]');
      const filterTemplates = () => {
        const term = (search?.value || '').toLowerCase().trim();
        const selected = category?.value || 'all';
        templateDemo.querySelectorAll('[data-template-card]').forEach(card => {
          const matchesText = card.textContent.toLowerCase().includes(term);
          const matchesCategory = selected === 'all' || card.dataset.category === selected;
          card.hidden = !(matchesText && matchesCategory);
        });
      };
      search?.addEventListener('input', filterTemplates);
      category?.addEventListener('change', filterTemplates);
      templateDemo.querySelectorAll('[data-copy-template]').forEach(button => button.addEventListener('click', () => {
        copyDemoText(button.getAttribute('data-copy-template') || '', '[data-template-output]', 'Original sample prompt copied. You can paste it into the SYNORA chat.');
      }));
      const title = templateDemo.querySelector('[data-draft-title]');
      const draftCategory = templateDemo.querySelector('[data-draft-category]');
      const prompt = templateDemo.querySelector('[data-draft-prompt]');
      const previewButton = templateDemo.querySelector('[data-action="preview-template"]');
      const copyButton = templateDemo.querySelector('[data-action="copy-draft"]');
      const saveButton = templateDemo.querySelector('[data-action="save-draft"]');
      const draftOutput = templateDemo.querySelector('[data-draft-output]');
      const savedDrafts = templateDemo.querySelector('[data-saved-drafts]');
      let draftText = '';
      const readDrafts = () => {
        try {
          const value = JSON.parse(localStorage.getItem('synora-template-drafts') || '[]');
          return Array.isArray(value) ? value.filter(item => item && typeof item.title === 'string' && typeof item.prompt === 'string').slice(0, 30) : [];
        } catch { return []; }
      };
      const renderDrafts = () => {
        if (!savedDrafts) return;
        savedDrafts.replaceChildren();
        const drafts = readDrafts();
        if (!drafts.length) {
          const empty = document.createElement('p');
          empty.className = 'revenue-demo-hint';
          empty.textContent = 'No saved drafts yet. Save a draft to keep it on this device.';
          savedDrafts.append(empty);
          return;
        }
        drafts.forEach((item, index) => {
          const card = document.createElement('article');
          const heading = document.createElement('strong');
          heading.textContent = item.title;
          const description = document.createElement('p');
          description.textContent = item.category + ' · ' + item.prompt.slice(0, 150);
          const copy = document.createElement('button');
          copy.type = 'button';
          copy.className = 'revenue-demo-button';
          copy.textContent = 'Copy prompt';
          copy.addEventListener('click', () => copyDemoText('Template title: ' + item.title + '\\nCategory: ' + item.category + '\\nInstructions: ' + item.prompt, '[data-template-output]', 'Saved draft prompt copied.'));
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'revenue-demo-button';
          remove.textContent = 'Delete draft';
          remove.addEventListener('click', () => {
            const next = readDrafts();
            next.splice(index, 1);
            try { localStorage.setItem('synora-template-drafts', JSON.stringify(next)); renderDrafts(); }
            catch { if (draftOutput) draftOutput.textContent = 'Could not update saved drafts in this browser.'; }
          });
          card.append(heading, description, copy, remove);
          savedDrafts.append(card);
        });
      };
      previewButton?.addEventListener('click', () => {
        const safeTitle = (title?.value || '').trim().slice(0, 60);
        const safePrompt = (prompt?.value || '').trim().slice(0, 700);
        if (!safeTitle || !safePrompt) {
          if (draftOutput) draftOutput.textContent = 'Please enter a title and describe your original template before previewing.';
          if (copyButton) copyButton.disabled = true;
          if (saveButton) saveButton.disabled = true;
          draftText = '';
          return;
        }
        draftText = 'Template title: ' + safeTitle + '\\nCategory: ' + (draftCategory?.value || 'Other') + '\\nInstructions: ' + safePrompt;
        if (draftOutput) draftOutput.textContent = draftText + '\\n\\nDraft preview only — not uploaded or published.';
        if (copyButton) copyButton.disabled = false;
        if (saveButton) saveButton.disabled = false;
      });
      copyButton?.addEventListener('click', () => {
        if (draftText) copyDemoText(draftText, '[data-draft-output]', 'Your template draft prompt was copied. It has not been submitted or published.');
      });
      saveButton?.addEventListener('click', () => {
        if (!draftText) return;
        const next = readDrafts();
        if (next.length >= 30) {
          if (draftOutput) draftOutput.textContent = 'This local demo supports up to 30 saved drafts. Delete one before saving another.';
          return;
        }
        try {
          next.unshift({ title: (title?.value || '').trim().slice(0, 60), category: draftCategory?.value || 'Other', prompt: (prompt?.value || '').trim().slice(0, 700), savedAt: new Date().toISOString() });
          localStorage.setItem('synora-template-drafts', JSON.stringify(next));
          if (draftOutput) draftOutput.textContent = 'Draft saved in My drafts on this device. It has not been uploaded or published.';
          renderDrafts();
        } catch {
          if (draftOutput) draftOutput.textContent = 'Could not save this draft in the browser. You can still copy the prompt.';
        }
      });
      renderDrafts();
    }

    const businessDemo = revenueSection.querySelector('[data-demo="business"]');
    if (businessDemo) {
      const updateTeam = () => {
        const input = businessDemo.querySelector('[data-team-size]');
        const count = Math.min(500, Math.max(1, Number.parseInt(input?.value || '1', 10) || 1));
        if (input) input.value = String(count);
        const type = businessDemo.querySelector('[data-team-type]')?.value || 'Small team';
        setDemoText('[data-team-output]', count + ' members · ' + type + ' workspace preview. No accounts or invitations are created.');
      };
      businessDemo.querySelector('[data-team-size]')?.addEventListener('input', updateTeam);
      businessDemo.querySelector('[data-team-type]')?.addEventListener('change', updateTeam);
      updateTeam();
    }

    const developerDemo = revenueSection.querySelector('[data-demo="developer"]');
    developerDemo?.querySelector('[data-action="run-mock"]')?.addEventListener('click', () => {
      const endpoint = developerDemo.querySelector('[data-dev-endpoint]')?.value || '/api/v1/status';
      const mock = {
        '/api/v1/status': {demo: true, service: 'SYNORA API', status: 'preview-only', billing: 'disabled'},
        '/api/v1/models': {demo: true, models: [], note: 'No live model catalogue is connected.'},
        '/api/v1/usage': {demo: true, requests: 0, billable: false, note: 'Illustrative usage only.'}
      };
      const output = developerDemo.querySelector('[data-dev-output]');
      if (output) output.textContent = JSON.stringify({request: endpoint, response: mock[endpoint] || mock['/api/v1/status']}, null, 2);
    });

    const trainingDemo = revenueSection.querySelector('[data-demo="training"]');
    trainingDemo?.querySelectorAll('input[type="checkbox"]').forEach(box => box.addEventListener('change', () => {
      const boxes = [...trainingDemo.querySelectorAll('input[type="checkbox"]')];
      const done = boxes.filter(item => item.checked).length;
      setDemoText('[data-training-progress]', done + ' of ' + boxes.length + ' preparation steps complete.');
    }));
  }

  const upgradePremiumAction = $('upgradePremiumAction');
  function explainPremiumSetup() {
    setChatNotice('Premium plan: up to 100 saved conversations. Secure billing and server-side subscription verification are not connected yet, so upgrades and payments are not available. No charge has been made.');
    closeChatMenu();
    const plans = $('plans');
    if (plans) { document.body.classList.remove('chat-home'); plans.scrollIntoView({behavior:'smooth',block:'start'}); }
  }
  if (upgradePremiumAction) upgradePremiumAction.addEventListener('click', explainPremiumSetup);
  const planUpgradeButton = $('planUpgradeButton');
  if (planUpgradeButton) planUpgradeButton.addEventListener('click', explainPremiumSetup);

  const downloadChatAction = $('downloadChatAction');
  if (downloadChatAction) downloadChatAction.addEventListener('click', () => {
    const transcript = visibleHistory.map(item => (item.role === 'user' ? 'You' : 'SYNORA AI') + ':\n' + item.content).join('\n\n');
    if (!transcript.trim()) {
      setChatNotice('ডাউনলোড করার মতো চ্যাট এখনো নেই।');
    } else {
      downloadTextFile(transcript, 'synora-chat.txt');
      setChatNotice('চ্যাট TXT ফাইল হিসেবে ডাউনলোড করা হয়েছে।');
    }
    closeChatMenu();
  });

  let chatImageData = '';
  let lastGeneratedImage = '';
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
      visibleHistory = [];
      chatMessages.replaceChildren();
      addChatBubble('assistant', 'নতুন সিনেমার জন্য প্রস্তুত। আপনার সিনেমার ধারণা লিখুন।');
      persistChatState();
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
    const movieTopic = /(movie|film|cinema|short film|feature film|সিনেমা|চলচ্চিত্র|মুভি|ফিল্ম)/i.test(text);
    const duration = /(2\\s*hours?|two\\s*hours?|120\\s*(minutes?|mins?)|২\\s*(ঘণ্টা|ঘন্টা)|দুই\\s*(ঘণ্টা|ঘন্টা)|দুই ঘণ্টার)/i.test(text);
    const action = /(বানাও|তৈরি|create|make|generate|লিখ|করো|চাই|build)/i.test(text);
    return (movieTopic && (action || duration)) || (duration && /(ভিডিও|video|সিনেমা|মুভি|ফিল্ম)/i.test(text));
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

  function getLocalTimeReply(message) {
    const text = String(message || '').toLowerCase();
    const isBengali = /[\u0980-\u09FF]/.test(message);
    const isHindi = /[\u0900-\u097F]/.test(message);
    const isRomanHindi = /\b(kitna|kitne|baje|baj rahe|samay|waqt|abhi)\b/.test(text);
    const locale = isBengali ? 'bn-IN' : (isHindi || isRomanHindi ? 'hi-IN' : 'en-IN');
    const now = new Date();
    const asksDate = /\b(date|today|day|what date)\b/.test(text) ||
      /তারিখ|আজ কয় তারিখ|আজকের তারিখ|আজ কি বার|কোন বার|কোন তারিখ|কোই তারিখ|কয় তারিখ|কয়টা তারিখ|আজকের ডেট/.test(text) ||
      /\b(aaj ki tareekh|aaj ka date|tareekh|tarikh)\b/.test(text);
    if (asksDate) {
      const formattedDate = new Intl.DateTimeFormat(locale, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }).format(now);
      if (isBengali) return 'আজকের তারিখ ' + formattedDate + '। (আপনার স্থানীয় তারিখ)';
      if (isHindi || isRomanHindi) return 'Aaj ki tareekh ' + formattedDate + ' hai. (Aapki local date)';
      return 'Today is ' + formattedDate + ' (your local date).';
    }
    const asksTime = /\b(time|what time|current time|clock|kitna time|kitne baje|samay|waqt|abhi time|time kya)\b/.test(text) ||
      /সময়|সময়|কটা বাজে|কয়টা বাজে|কত বাজে|এখন কয়টা|এখন কত/.test(text) ||
      /\b(kitna|kitne|baje|baj rahe|samay|waqt|abhi)\b/.test(text);
    if (!asksTime) return '';
    const formatted = new Intl.DateTimeFormat(locale, {
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    }).format(now);
    if (isBengali) return 'এখন ' + formatted + ' বাজে। (স্থানীয় সময়)';
    if (isHindi || isRomanHindi) return 'Abhi ' + formatted + ' ho raha hai. (Aapka local time)';
    return 'It is ' + formatted + ' now. (Your local time)';
  }

  function buildImageEditPrompt(message) {
    const text = String(message || '').trim();
    if (/(background|back\\s*ground|ব্যাকগ্রাউন্ড|পেছনের দৃশ্য|পটভূমি|पृष्ठभूमि|fondo)/i.test(text)) {
      return "Edit the provided source photo. Replace ONLY the background with the background requested by the user: " + text +
        ". Preserve the original person or main subject exactly as much as possible, including face, identity, hair, clothing, pose, body proportions, and foreground objects. Keep the subject in the same position and scale. Make the new background look natural with matching perspective, lighting, shadows, and depth of field. Do not generate a new person, do not change the subject, and do not turn this into a standalone landscape.";
    }
    return text || 'Enhance this image while preserving the main subject and overall composition.';
  }

  function isBackgroundEditRequest(text) {
    return /(background|back\\s*ground|ব্যাক\\s*গ্রাউন্ড|বাগরাউন্ড|বেকগ্রাউন্ড|ব্যাকগ্রাউন্ড|পেছনের দৃশ্য|পটভূমি|पृष्ठभूमि|fondo)/i.test(text);
  }
  function isImageCreationRequest(text) {
    const subject = /(ছবি|ফটো|চবি|চিত্র|মেয়ের|মেয়ের|মেইয়ে|মেইয়ের|মাইয়ে|মাইয়ের|মেয়ে|মেয়ে|নারী|মহিলা|শাড়ি|শাড়ি|সারি|chobi|chhobi|photo|picture|image|tasveer|saree|sari|ladki|mujer|imagen|foto|ফুল|বিড়াল|বিড়াল|কুকুর|cat|dog|flower|rose|logo|লোগো|poster|পোস্টার|wallpaper|ওয়ালপেপার)/i.test(text);
    const action = /(দাও|দেখাও|বানাও|তৈরি|আঁকো|করো|চাই|পড়|পরা|পরানো|generate|create|make|draw|give|show|edit|চেঞ্জ|পরিবর্তন|সৃষ্টি)/i.test(text);
    const ageMention = /(?:18|19|২০?|১৮|১৯)\s*(?:বছর|year|boios|boyos|bochhor)(?:\s*(?:বয়স|বয়স|বয়সী|বয়সী|old))?/i.test(text);
    const shortPhotoRequest = /(ছবি|ফটো|চবি|চিত্র|photo|picture|image)/i.test(text) &&
      /(মেয়|মেয়ে|মেইয়ে|মেইয়ের|মাইয়ে|মাইয়ের|girl|woman|ladki|নারী|মহিলা)/i.test(text);
    return subject && (action || shortPhotoRequest || (ageMention && /(ছবি|ফটো|photo|picture|image)/i.test(text)));
  }
  function isImageFollowUp(text) {
    return /(সুন্দর|আরও ভালো|আরো ভালো|আরও সুন্দর|আরো সুন্দর|সাজাও|পরিবর্তন|বদলে|চেঞ্জ|ব্যাক\\s*গ্রাউন্ড|বাগরাউন্ড|ব্যাকগ্রাউন্ড|পেছনের দৃশ্য|শুধু মেয়ে|শুধু মেয়ে|শুধু মাইয়ে|শুধু মেইয়ে|শুধু মেয়েটা|শুধু মুখ|শাড়ি|শাড়ি|সারি|shundor|sundor|aro bhalo|aro sundor|make it|improve|enhance|edit|change|replace|remove|add|background|saree|sari)/i.test(text);
  }
  function makeDirectImagePrompt(text) {
    if (/(শাড়ি|শাড়ি|সারি|saree|sari)/i.test(text)) return "Create exactly what the user requested: a respectful, photorealistic portrait of a youthful adult South Asian woman aged 20–25 wearing a clearly visible traditional saree. She should look like a young adult, not middle-aged or elderly. Keep her face and saree clearly visible as the central subject; do not substitute a landscape. Avoid elderly facial features, grey hair, wrinkles, or an older woman. Details requested: " + text;
    if (/(?:18|19|১৮|১৯)\s*(?:বছর|year|boios|boyos|bochhor)/i.test(text) && /(মেয়|মেয়ে|মেইয়ে|মেইয়ের|মাইয়ে|মাইয়ের|girl|woman|ladki|নারী|মহিলা|meye|meiye)/i.test(text)) return "Create exactly what the user requested: a respectful, non-sexual, photorealistic portrait of a young adult South Asian woman, explicitly age 18–19, with a youthful adult appearance, natural expression and age-appropriate tasteful clothing. She must not look middle-aged or elderly. Keep her face clearly visible and central. Avoid grey hair, wrinkles, elderly facial features, scenery-only images, or unrelated subjects. Details requested: " + text;
    if (/(মেয়|মেয়ে|মেইয়ে|মাইয়ে|girl|woman|ladki)/i.test(text)) return "Create exactly what the user requested: a respectful, photorealistic portrait of an adult South Asian woman, clearly visible as the main subject, natural expression and tasteful clothing. Do not substitute scenery or unrelated objects. Details requested: " + text;
    return "Create an image that follows the user's exact request. Make the requested subject large, clear and central. Do not replace it with an unrelated landscape or subject. User request: " + text;
  }
  async function runDirectImageTask(userText, sourceImage) {
    const editing = Boolean(sourceImage);
    chatSend.disabled = true;
    chatSend.textContent = editing ? 'Editing…' : 'Creating…';
    setChatNotice(editing ? 'SYNORA আগের ছবিটি সম্পাদনা করছে…' : 'SYNORA আপনার ছবি তৈরি করছে…');
    try {
      const response = await fetch(editing ? '/api/image-edit' : '/api/image-generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(editing
          ? {image:sourceImage, prompt:"Edit the supplied image according to this exact instruction: " + userText + ". Preserve the same main subject, identity, face, pose and clothing unless the user explicitly asks to change them. Change only what the user requested. Do not replace the subject with an unrelated scene."}
          : {prompt:makeDirectImagePrompt(userText)})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Image service is unavailable.');
      if (typeof payload.image !== 'string' || !payload.image.startsWith('data:image/')) throw new Error('Image service returned no image.');
      lastGeneratedImage = payload.image;
      addChatBubble('assistant', editing ? 'আপনার সম্পাদিত ছবিটি তৈরি হয়েছে।' : 'আপনার ছবিটি তৈরি হয়েছে।');
      addChatImageBubble(payload.image);
      setChatNotice('ছবি তৈরি সম্পন্ন।', false);
    } catch (error) {
      addChatBubble('assistant', 'দুঃখিত, ছবিটি তৈরি/সম্পাদনা করা যায়নি। ' + (error.message || 'আবার চেষ্টা করুন।'));
      setChatNotice(error.message || 'Image generation failed.');
    } finally {
      chatSend.disabled = false;
      chatSend.textContent = 'Send ↗';
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    const imageToSend = chatImageData;
    if ((!message && !imageToSend) || chatSend.disabled) return;

    if (!imageToSend && message && isBackgroundEditRequest(message) && !lastGeneratedImage) {
      chatInput.value = '';
      addChatBubble('user', message);
      addChatBubble('assistant', 'যে ছবিটির ব্যাকগ্রাউন্ড বদলাতে চান, সেটি + বোতাম থেকে আপলোড করুন। তারপর শুধু নতুন ব্যাকগ্রাউন্ডের নাম লিখুন। আমি মূল ছবির মানুষ বা বিষয়টি অপরিবর্তিত রেখে ব্যাকগ্রাউন্ড বদলানোর চেষ্টা করব।');
      setChatNotice('প্রথমে মূল ছবি আপলোড করুন।', false);
      return;
    }
    if (!imageToSend && message && (isImageCreationRequest(message) || (lastGeneratedImage && isImageFollowUp(message)))) {
      chatInput.value = '';
      addChatBubble('user', message);
      await runDirectImageTask(message, lastGeneratedImage && isImageFollowUp(message) ? lastGeneratedImage : '');
      return;
    }

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
            prompt:buildImageEditPrompt(message),
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
    const localTimeReply = getLocalTimeReply(message);
    if (localTimeReply) {
      chatHistory.push({role:'user', content:message});
      chatHistory.push({role:'assistant', content:localTimeReply});
      chatHistory = chatHistory.slice(-10);
      addChatBubble('assistant', localTimeReply);
      persistChatState();
      setChatNotice('Answered using this device’s live local clock.', false);
      return;
    }
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
        ? message + movieContext + lineBreak + lineBreak + 'Continue from the exact next scene after the latest scene in the canonical story above. Preserve title, characters, facts, plot, tone, visual continuity and scene numbering. Do not repeat the outline or opening scene. Write the next 5–8 minutes as a complete screenplay section with scene headings, action and age-appropriate dialogue. Then add 6–10 standalone text-to-video prompts matching those exact new scenes; include subject, setting, action, camera, lighting, mood and continuity, and avoid copyrighted characters or existing movie styles. Add this section to the continuing screenplay. This is text and prompt preparation only, not rendered clips or an MP4. Keep the cumulative target runtime at exactly 120 minutes.'
        : (buildMovie
          ? message + lineBreak + lineBreak + 'Act as SYNORA AI Movie Studio. Target runtime is exactly 120 minutes (2 hours). This workflow is free planning and screenplay assistance only: do not claim that video clips or an MP4 have been rendered. Create a production-ready package in the user’s language: title, genre, 120-minute logline and premise, character bible, visual continuity guide, visual style, three-act timeline that adds to exactly 120 minutes, and a numbered scene list with scene numbers and durations that add to exactly 120 minutes. For each listed scene include a concise visual summary. Then write only the opening 5–8 minutes as a complete screenplay with scene headings, action and age-appropriate dialogue. After the screenplay, add a “FREE VIDEO CLIP PROMPTS” section with 6–10 short, standalone text-to-video prompts for the opening scenes; each prompt should specify subject, setting, action, camera framing/movement, lighting, mood, and continuity details, and should avoid copyrighted characters or existing movie styles. Clearly label all of this as a plan/script/prompt pack, not a finished movie. Explain that the user can generate short clips with a service’s free allowance, but free quotas and availability vary. Tell the user to type “পরের দৃশ্য” to continue with the next 5–8 minutes and its video prompts.'
          : message));
    chatHistory = cleanApiMessages(chatHistory);
    chatHistory.push({role:'user', content:requestContent.slice(0, 5000)});
    chatHistory = cleanApiMessages(chatHistory);
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
      const looksLikeLeakedToolJson = /^\s*\{[\s\S]{0,1200}"action"\s*:\s*"(?:dalle\.|image|tool)/i.test(payload.reply);
      if (looksLikeLeakedToolJson) {
        chatHistory.pop();
        addChatBubble('assistant', 'আমি আপনার অনুরোধ বুঝেছি, কিন্তু এই মুহূর্তে ছবির কাজটি সরাসরি সম্পন্ন করতে পারছি না। অনুগ্রহ করে আবার বলুন বা ছবিটি আপলোড করুন।');
        persistChatState();
        setChatNotice('অভ্যন্তরীণ টুল নির্দেশনা লুকানো হয়েছে; কোনো JSON দেখানো হবে না.', false);
        return;
      }
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

  // Chat-first home view; other workspaces open from the navigation menu.
  const homeLink = $('homeLink');
  const menuToggle = $('menuToggle');
  const navDropdown = $('navDropdown');
  function showChatHome() {
    document.body.classList.add('chat-home');
    if (navDropdown) navDropdown.hidden = true;
    if (menuToggle) menuToggle.setAttribute('aria-expanded','false');
    window.scrollTo({top:0,behavior:'smooth'});
    if (chatInput) setTimeout(() => chatInput.focus({preventScroll:true}),180);
  }
  function showWorkspaceFromMenu(hash) {
    document.body.classList.remove('chat-home');
    if (navDropdown) navDropdown.hidden = true;
    if (menuToggle) menuToggle.setAttribute('aria-expanded','false');
    const target = hash ? document.querySelector(hash) : null;
    if (target) setTimeout(() => target.scrollIntoView({behavior:'smooth',block:'start'}),40);
  }
  showChatHome();
  if (homeLink) homeLink.addEventListener('click',event=>{event.preventDefault();showChatHome();});
  if (navDropdown) navDropdown.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();showWorkspaceFromMenu(link.getAttribute('href'));
  }));
  if (menuToggle && navDropdown) menuToggle.addEventListener('click',()=>{
    const opening=navDropdown.hidden;navDropdown.hidden=!opening;menuToggle.setAttribute('aria-expanded',String(opening));
  });

})();