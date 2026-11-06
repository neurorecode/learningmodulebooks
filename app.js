(() => {
  const STORAGE_KEY = 'lmb.state.v1';
  const uid = () => Math.random().toString(36).slice(2, 10);

  const state = loadState() || { modules: [], activeId: null };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function parseYouTube(input) {
    if (!input) return null;
    const s = input.trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    try {
      const u = new URL(s);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        const id = u.pathname.slice(1);
        return /^[\w-]{11}$/.test(id) ? id : null;
      }
      if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
        if (u.searchParams.get('v')) {
          const id = u.searchParams.get('v');
          return /^[\w-]{11}$/.test(id) ? id : null;
        }
        const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/);
        if (m) return m[2];
      }
    } catch {}
    return null;
  }

  const el = {
    moduleList: document.getElementById('moduleList'),
    moduleCount: document.getElementById('moduleCount'),
    emptySidebar: document.getElementById('emptySidebar'),
    emptyState: document.getElementById('emptyState'),
    moduleDetail: document.getElementById('moduleDetail'),
    moduleTitle: document.getElementById('moduleTitle'),
    moduleDesc: document.getElementById('moduleDesc'),
    progressFill: document.getElementById('progressFill'),
    progressLabel: document.getElementById('progressLabel'),
    lessonList: document.getElementById('lessonList'),
    emptyLessons: document.getElementById('emptyLessons'),
    addLessonForm: document.getElementById('addLessonForm'),
    lessonUrl: document.getElementById('lessonUrl'),
    lessonTitle: document.getElementById('lessonTitle'),
    addLessonError: document.getElementById('addLessonError'),
    lessonTpl: document.getElementById('lessonTemplate'),
  };

  function getActive() {
    return state.modules.find(m => m.id === state.activeId) || null;
  }

  function createModule() {
    const m = { id: uid(), title: 'Untitled module', description: '', lessons: [], createdAt: Date.now() };
    state.modules.unshift(m);
    state.activeId = m.id;
    saveState(); render();
    setTimeout(() => { el.moduleTitle.focus(); el.moduleTitle.select(); }, 0);
  }

  function deleteModule(id) {
    const i = state.modules.findIndex(m => m.id === id);
    if (i < 0) return;
    if (!confirm(`Delete module "${state.modules[i].title || 'Untitled'}"? This cannot be undone.`)) return;
    state.modules.splice(i, 1);
    if (state.activeId === id) state.activeId = state.modules[0]?.id || null;
    saveState(); render();
  }

  function addLesson(url, title) {
    const m = getActive(); if (!m) return;
    const videoId = parseYouTube(url);
    if (!videoId) {
      el.addLessonError.textContent = 'That does not look like a YouTube URL or video ID.';
      el.addLessonError.hidden = false;
      return false;
    }
    el.addLessonError.hidden = true;
    m.lessons.push({
      id: uid(),
      videoId,
      title: (title || '').trim() || `Lesson ${m.lessons.length + 1}`,
      notes: '',
      done: false,
      open: false,
    });
    saveState(); render();
    return true;
  }

  function moveLesson(moduleId, lessonId, dir) {
    const m = state.modules.find(x => x.id === moduleId); if (!m) return;
    const i = m.lessons.findIndex(l => l.id === lessonId); if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= m.lessons.length) return;
    [m.lessons[i], m.lessons[j]] = [m.lessons[j], m.lessons[i]];
    saveState(); render();
  }

  function deleteLesson(moduleId, lessonId) {
    const m = state.modules.find(x => x.id === moduleId); if (!m) return;
    m.lessons = m.lessons.filter(l => l.id !== lessonId);
    saveState(); render();
  }

  function renderSidebar() {
    el.moduleCount.textContent = state.modules.length;
    el.moduleList.innerHTML = '';
    el.emptySidebar.hidden = state.modules.length > 0;
    state.modules.forEach(m => {
      const li = document.createElement('li');
      li.dataset.id = m.id;
      if (m.id === state.activeId) li.classList.add('active');
      const done = m.lessons.filter(l => l.done).length;
      li.innerHTML = `
        <span class="mod-title"></span>
        <span class="mod-meta">${m.lessons.length} lesson${m.lessons.length === 1 ? '' : 's'} · ${done} done</span>
      `;
      li.querySelector('.mod-title').textContent = m.title || 'Untitled module';
      li.addEventListener('click', () => { state.activeId = m.id; saveState(); render(); });
      el.moduleList.appendChild(li);
    });
  }

  function renderDetail() {
    const m = getActive();
    if (!m) {
      el.moduleDetail.hidden = true;
      el.emptyState.hidden = false;
      return;
    }
    el.emptyState.hidden = true;
    el.moduleDetail.hidden = false;

    if (document.activeElement !== el.moduleTitle) el.moduleTitle.value = m.title;
    if (document.activeElement !== el.moduleDesc) el.moduleDesc.value = m.description;

    const done = m.lessons.filter(l => l.done).length;
    const pct = m.lessons.length ? (done / m.lessons.length) * 100 : 0;
    el.progressFill.style.width = pct + '%';
    el.progressLabel.textContent = `${done} / ${m.lessons.length} complete`;

    el.lessonList.innerHTML = '';
    el.emptyLessons.hidden = m.lessons.length > 0;

    m.lessons.forEach((lesson, idx) => {
      const node = el.lessonTpl.content.firstElementChild.cloneNode(true);
      node.dataset.id = lesson.id;
      if (lesson.done) node.classList.add('done');

      const checkbox = node.querySelector('.done-check');
      checkbox.checked = lesson.done;
      checkbox.addEventListener('change', () => {
        lesson.done = checkbox.checked;
        saveState(); render();
      });

      const titleInput = node.querySelector('.lesson-title-input');
      titleInput.value = lesson.title;
      titleInput.addEventListener('input', () => { lesson.title = titleInput.value; saveState(); renderSidebar(); });

      const link = node.querySelector('.lesson-link');
      link.href = `https://www.youtube.com/watch?v=${lesson.videoId}`;

      const playerWrap = node.querySelector('.player-wrap');
      const iframe = node.querySelector('.player');
      const toggleBtn = node.querySelector('.toggle-player');

      const setOpen = (open) => {
        lesson.open = open;
        playerWrap.hidden = !open;
        toggleBtn.textContent = open ? 'Hide' : 'Play';
        if (open && !iframe.src) {
          iframe.src = `https://www.youtube-nocookie.com/embed/${lesson.videoId}?rel=0`;
        } else if (!open) {
          iframe.src = '';
        }
      };
      setOpen(!!lesson.open);
      toggleBtn.addEventListener('click', () => { setOpen(!lesson.open); saveState(); });

      const notes = node.querySelector('.lesson-notes');
      notes.value = lesson.notes || '';
      notes.addEventListener('input', () => { lesson.notes = notes.value; saveState(); });

      node.querySelector('.move-up').addEventListener('click', () => moveLesson(m.id, lesson.id, -1));
      node.querySelector('.move-down').addEventListener('click', () => moveLesson(m.id, lesson.id, 1));
      node.querySelector('.delete-lesson').addEventListener('click', () => {
        if (confirm('Remove this lesson?')) deleteLesson(m.id, lesson.id);
      });

      if (idx === 0) node.querySelector('.move-up').disabled = true;
      if (idx === m.lessons.length - 1) node.querySelector('.move-down').disabled = true;

      el.lessonList.appendChild(node);
    });
  }

  function render() {
    renderSidebar();
    renderDetail();
  }

  el.moduleTitle.addEventListener('input', () => {
    const m = getActive(); if (!m) return;
    m.title = el.moduleTitle.value;
    saveState(); renderSidebar();
  });
  el.moduleDesc.addEventListener('input', () => {
    const m = getActive(); if (!m) return;
    m.description = el.moduleDesc.value;
    saveState();
  });

  document.getElementById('newModuleBtn').addEventListener('click', createModule);
  document.getElementById('emptyNewModule').addEventListener('click', createModule);
  document.getElementById('deleteModuleBtn').addEventListener('click', () => {
    const m = getActive(); if (m) deleteModule(m.id);
  });

  el.addLessonForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (addLesson(el.lessonUrl.value, el.lessonTitle.value)) {
      el.lessonUrl.value = '';
      el.lessonTitle.value = '';
      el.lessonUrl.focus();
    }
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-modules-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const importFile = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const f = importFile.files?.[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.modules)) throw new Error('Invalid file');
      if (!confirm(`Import ${data.modules.length} module(s)? This will replace your current data.`)) return;
      state.modules = data.modules;
      state.activeId = data.activeId || data.modules[0]?.id || null;
      saveState(); render();
    } catch (e) {
      alert('Could not import: ' + e.message);
    } finally {
      importFile.value = '';
    }
  });

  if (!state.activeId && state.modules[0]) state.activeId = state.modules[0].id;
  render();
})();
