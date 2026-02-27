(function () {
  const adminGrade = document.getElementById('adminGrade');
  const adminUnit = document.getElementById('adminUnit');
  const adminLesson = document.getElementById('adminLesson');
  const loadQuestionsBtn = document.getElementById('loadQuestionsBtn');
  const existingQuestionsSection = document.getElementById('existingQuestionsSection');
  const existingQuestionsList = document.getElementById('existingQuestionsList');
  const questionType = document.getElementById('questionType');
  const questionText = document.getElementById('questionText');
  const questionExplanation = document.getElementById('questionExplanation');
  const questionOrder = document.getElementById('questionOrder');
  const typeMultipleChoice = document.getElementById('typeMultipleChoice');
  const typeImageSelection = document.getElementById('typeImageSelection');
  const typeDragDrop = document.getElementById('typeDragDrop');
  const typeMatching = document.getElementById('typeMatching');
  const mcAnswers = document.getElementById('mcAnswers');
  const addMcAnswer = document.getElementById('addMcAnswer');
  const correctAnswerIndex = document.getElementById('correctAnswerIndex');
  const imageOptions = document.getElementById('imageOptions');
  const addImageOption = document.getElementById('addImageOption');
  const dragDropItems = document.getElementById('dragDropItems');
  const dragDropZones = document.getElementById('dragDropZones');
  const matchingPairs = document.getElementById('matchingPairs');
  const saveQuestionBtn = document.getElementById('saveQuestionBtn');
  const saveStatus = document.getElementById('saveStatus');

  let unitsData = [];
  let lessonsData = [];
  let currentQuestions = [];

  function showStatus(msg, isError) {
    saveStatus.textContent = msg;
    saveStatus.classList.toggle('error', !!isError);
  }

  function showTypePanel() {
    const type = questionType.value;
    typeMultipleChoice.style.display = type === 'multiple-choice' ? 'block' : 'none';
    typeImageSelection.style.display = type === 'image-selection' ? 'block' : 'none';
    typeDragDrop.style.display = type === 'drag-drop' ? 'block' : 'none';
    typeMatching.style.display = type === 'matching' ? 'block' : 'none';
  }

  questionType.addEventListener('change', showTypePanel);

  async function fetchUnits(grade) {
    try {
      const res = await fetch('/api/units/' + encodeURIComponent(grade), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load units');
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async function fetchLessons(grade, unitNumber) {
    try {
      const res = await fetch('/api/units/' + encodeURIComponent(grade) + '/' + encodeURIComponent(unitNumber) + '/lessons', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load lessons');
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  adminGrade.addEventListener('change', async () => {
    adminUnit.innerHTML = '<option value="">-- Loading --</option>';
    adminLesson.innerHTML = '<option value="">-- Select unit first --</option>';
    unitsData = await fetchUnits(adminGrade.value);
    adminUnit.innerHTML = '<option value="">-- Select unit --</option>';
    unitsData.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.unit_number;
      opt.textContent = (u.title && u.title.en) ? u.title.en : 'Unit ' + u.unit_number;
      adminUnit.appendChild(opt);
    });
    existingQuestionsSection.style.display = 'none';
  });

  adminUnit.addEventListener('change', async () => {
    showStatus('');
    adminLesson.innerHTML = '<option value="">-- Loading --</option>';
    lessonsData = await fetchLessons(adminGrade.value, adminUnit.value);
    adminLesson.innerHTML = '<option value="">-- Select lesson --</option>';
    if (!Array.isArray(lessonsData)) lessonsData = [];
    lessonsData.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id != null ? l.id : '';
      opt.textContent = (l.title != null && l.title !== '') ? l.title : 'Lesson ' + (l.id != null ? l.id : '');
      adminLesson.appendChild(opt);
    });
    if (lessonsData.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- No lessons in this unit --';
      opt.disabled = true;
      adminLesson.appendChild(opt);
    }
    existingQuestionsSection.style.display = 'none';
  });

  adminLesson.addEventListener('change', () => showStatus(''));

  loadQuestionsBtn.addEventListener('click', async () => {
    const grade = adminGrade.value;
    const unit = adminUnit.value;
    const lesson = adminLesson.value;
    if (!grade || !unit || !lesson) {
      showStatus('Please select grade, unit, and lesson.', true);
      return;
    }
    try {
      const res = await fetch('/api/quizzes/' + encodeURIComponent(grade) + '/' + encodeURIComponent(unit) + '/' + encodeURIComponent(lesson), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load questions');
      const json = await res.json();
      currentQuestions = json.success && Array.isArray(json.data) ? json.data : [];
      existingQuestionsList.innerHTML = '';
      if (currentQuestions.length === 0) {
        existingQuestionsList.innerHTML = '<li class="q-preview">No questions yet for this lesson.</li>';
      } else {
        currentQuestions.forEach(q => {
          const li = document.createElement('li');
          const preview = (q.question || '').substring(0, 60) + (q.question && q.question.length > 60 ? '...' : '');
          li.innerHTML = '<span class="q-preview">' + escapeHtml(preview) + '</span><span class="q-type">' + (q.type || '') + '</span><button type="button" class="btn btn-danger delete-q" data-id="' + (q.id || '') + '">Delete</button>';
          existingQuestionsList.appendChild(li);
        });
        existingQuestionsList.querySelectorAll('.delete-q').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!id || !confirm('Delete this question?')) return;
            try {
              const delRes = await fetch('/api/quizzes/question/' + id, { method: 'DELETE' });
              const delJson = await delRes.json();
              if (delJson.success) {
                loadQuestionsBtn.click();
              } else {
                showStatus(delJson.message || 'Delete failed', true);
              }
            } catch (e) {
              showStatus('Delete failed: ' + e.message, true);
            }
          });
        });
      }
      existingQuestionsSection.style.display = 'block';
    } catch (e) {
      showStatus('Load failed: ' + e.message, true);
    }
  });

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  let mcCount = 0;
  function addMcRow() {
    const idx = mcCount++;
    const row = document.createElement('div');
    row.className = 'mc-answer-row';
    row.innerHTML = '<input type="text" placeholder="Answer option" data-idx="' + idx + '"><label><input type="radio" name="mcCorrect" value="' + idx + '"> Correct</label><button type="button" class="remove-mc">Remove</button>';
    mcAnswers.appendChild(row);
    row.querySelector('.remove-mc').addEventListener('click', () => row.remove());
  }
  addMcAnswer.addEventListener('click', addMcRow);
  addMcRow();
  addMcRow();

  let imageOptCount = 0;
  function addImageOptRow() {
    const idx = imageOptCount++;
    const row = document.createElement('div');
    row.className = 'image-option-row';
    row.innerHTML = '<input type="text" placeholder="Image URL" data-idx="' + idx + '" class="img-url"><input type="text" placeholder="Label" class="img-label"><label><input type="radio" name="imgCorrect" value="' + idx + '" class="is-correct"> Correct</label><button type="button" class="remove-img">Remove</button>';
    imageOptions.appendChild(row);
    row.querySelector('.remove-img').addEventListener('click', () => row.remove());
  }
  addImageOption.addEventListener('click', addImageOptRow);
  addImageOptRow();
  addImageOptRow();

  saveQuestionBtn.addEventListener('click', async () => {
    const grade = adminGrade.value;
    const unitId = adminUnit.value;
    const lessonId = adminLesson.value;
    const type = questionType.value;
    const text = questionText.value.trim();
    const explanation = questionExplanation.value.trim();
    const order = parseInt(questionOrder.value, 10) || 0;

    if (!grade || !unitId || !lessonId) {
      showStatus('Please select grade, unit, and lesson.', true);
      return;
    }
    if (!text) {
      showStatus('Please enter question text.', true);
      return;
    }

    const body = {
      grade,
      unitId,
      lessonId,
      questionType: type,
      questionText: text,
      explanation: explanation || null,
      questionOrder: order,
      language: 'en'
    };

    if (type === 'multiple-choice') {
      const rows = mcAnswers.querySelectorAll('.mc-answer-row');
      const answers = [];
      let correctIdx = 0;
      const checked = mcAnswers.querySelector('input[name="mcCorrect"]:checked');
      if (checked) {
        const row = checked.closest('.mc-answer-row');
        const allRows = mcAnswers.querySelectorAll('.mc-answer-row');
        correctIdx = Array.from(allRows).indexOf(row);
      }
      rows.forEach((row, i) => {
        const input = row.querySelector('input[type="text"]');
        const t = input && input.value.trim();
        if (t) answers.push({ text: t, isCorrect: i === correctIdx });
      });
      if (answers.length < 2) {
        showStatus('Add at least 2 multiple-choice options.', true);
        return;
      }
      body.answers = answers;
      body.correctAnswer = correctIdx;
    } else if (type === 'image-selection') {
      const rows = imageOptions.querySelectorAll('.image-option-row');
      const options = [];
      const checked = imageOptions.querySelector('input[name="imgCorrect"]:checked');
      const correctVal = checked ? parseInt(checked.value, 10) : 0;
      rows.forEach((row, i) => {
        const url = row.querySelector('.img-url').value.trim();
        const label = row.querySelector('.img-label').value.trim();
        if (url || label) options.push({ imageUrl: url, label, isCorrect: i === correctVal });
      });
      if (options.length < 2) {
        showStatus('Add at least 2 image options.', true);
        return;
      }
      body.answers = options;
    } else if (type === 'drag-drop') {
      const itemsText = dragDropItems.value.trim();
      const zonesText = dragDropZones.value.trim();
      const items = [];
      itemsText.split('\n').forEach(line => {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 2) items.push({ text: parts[0], category: parts[1] });
      });
      const zones = [];
      zonesText.split('\n').forEach(line => {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 2) zones.push({ id: parts[0], label: parts[1] });
      });
      if (items.length === 0 || zones.length === 0) {
        showStatus('Add at least one item and one zone for drag-drop.', true);
        return;
      }
      body.dragDropItems = items;
      body.dropZones = zones;
    } else if (type === 'matching') {
      const pairsText = matchingPairs.value.trim();
      const pairs = [];
      pairsText.split('\n').forEach(line => {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 2) pairs.push({ left: parts[0], right: parts[1] });
      });
      if (pairs.length === 0) {
        showStatus('Add at least one matching pair (left|right per line).', true);
        return;
      }
      body.matchingPairs = pairs;
    }

    try {
      const res = await fetch('/api/quizzes/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        showStatus('Question saved. It will appear on the student lesson page.');
        questionText.value = '';
        questionExplanation.value = '';
        loadQuestionsBtn.click();
      } else {
        showStatus(json.message || 'Save failed', true);
      }
    } catch (e) {
      showStatus('Save failed: ' + e.message, true);
    }
  });

  showTypePanel();
})();
