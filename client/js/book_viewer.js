//Configuration         
const params     = new URLSearchParams(window.location.search);
const BOOK_ID    = params.get('book')  || 'grade1';
const START_PAGE = parseInt(params.get('page') || '1');
const STUDENT_ID = localStorage.getItem('userId') || 'student_guest';

// Book Data
// Maps book IDs to their page image URLs and display titles.
const BOOK_PAGES = {
  grade1: [
    '/books/16.jpg',
    '/books/17.jpg',
    '/books/18.jpg',
  ],
};

const BOOK_TITLES = {
  grade1: 'كتاب الصف الأول — تقنية المعلومات',
};

// Image Bank
// All images students can drag onto book pages.
// Each item has a unique id, image src, and Arabic label.
const IMAGE_BANK = [
  { id: 'img_mouse',         src: '/books/mouse.png',         label: 'الفأرة'          },
  { id: 'img_keyboard',      src: '/books/keyboard.png',      label: 'لوحة المفاتيح'   },
  { id: 'img_screen',        src: '/books/screen.png',        label: 'الشاشة'          },
  { id: 'img_headphone',     src: '/books/headphone.png',     label: 'سماعة الرأس'     },
  { id: 'img_printer',       src: '/books/printer.png',       label: 'الطابعة'         },
  { id: 'img_scanner',       src: '/books/scanner.png',       label: 'الماسح الضوئي'  },
  { id: 'img_laptop',        src: '/books/laptop.png',        label: 'الحاسوب المحمول' },
  { id: 'img_small_printer', src: '/books/small_printer.png', label: 'طابعة صغيرة'    },
];

// Application State

// Current mode: 'teacher' can add/edit questions, 'student' answers them
let currentMode = 'teacher';

// Page navigation
let currentPage = START_PAGE;
let totalPages  = (BOOK_PAGES[BOOK_ID] || []).length || 1;

// Questions loaded from the server for the current page
let interactions = [];

// Student answers keyed by interaction ID: { answer, correct, ... }
let studentAnswers = {};

// Whether the student has submitted answers on this page
let submitted = false;

// Images placed on each page by the student.
// Format: { [pageNumber]: [{ instanceId, imageId, src, label, x, y, w, h }] }
let placedImages = {};

//Teacher drawing state 
let isDrawing    = false;
let drawStart    = null;
let pendingRect  = null;   // the drawn rectangle waiting to be saved as a question
let selectedType = 'fill'; // question type: 'fill' | 'mc' | 'click'
let mcOptions    = [];     // options array for multiple-choice questions
let editingId    = null;   // ID of an interaction being edited (reserved for future edit UI)

//MC popup state
let mcPopupInteraction = null; // the interaction object currently shown in the popup
let mcSelectedChoice   = null; // index of the option the student clicked

//Drag state
//Tracks which image bank item is being dragged onto the page
let draggingBankItem = null; // { imageId, src, label }

// INIT — runs once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bookTitle').textContent = BOOK_TITLES[BOOK_ID] || BOOK_ID;
  initMcOptions();
  buildImageBank();
  setupPageDropZone();
  loadPage(currentPage);
  setMode('teacher');
});

// PAGE LOADING
// Loads the book page image and fetches its questions.
async function loadPage(pageNum) {
  // Clamp page number to valid range
  currentPage = Math.max(1, Math.min(pageNum, totalPages));

  // Update pagination UI
  document.getElementById('currentPageNum').textContent = currentPage;
  document.getElementById('totalPagesNum').textContent  = totalPages;
  document.getElementById('prevPageBtn').disabled       = currentPage <= 1;
  document.getElementById('nextPageBtn').disabled       = currentPage >= totalPages;

  // Load the page image (or show a placeholder if no image exists)
  const pages  = BOOK_PAGES[BOOK_ID] || [];
  const imgSrc = pages[currentPage - 1];
  const imgEl  = document.getElementById('bookPageImage');
  const noImg  = document.getElementById('noImagePlaceholder');

  if (imgSrc) {
    imgEl.style.display = 'block';
    noImg.style.display = 'none';
    imgEl.src = imgSrc;
    // Wait for the image to fully load before rendering overlays
    await new Promise(resolve => {
      if (imgEl.complete && imgEl.naturalWidth > 0) { resolve(); return; }
      imgEl.onload  = resolve;
      imgEl.onerror = resolve;
    });
  } else {
    imgEl.style.display = 'none';
    noImg.style.display = 'flex';
  }

  // Reset page state
  submitted      = false;
  studentAnswers = {};
  cancelInteraction();

  // Fetch questions from server and render everything
  await fetchInteractions();
  renderInteractions();
  renderPlacedImages();
  renderSidebar();
  updateStudentProgress();
  updateImageBankUsed();
}

// Previous / Next page buttons
document.getElementById('prevPageBtn').addEventListener('click', () => loadPage(currentPage - 1));
document.getElementById('nextPageBtn').addEventListener('click', () => loadPage(currentPage + 1));

// Server Calls
// Fetch all interactions (questions) for the current book page
async function fetchInteractions() {
  try {
    const res  = await fetch(`/api/book/interactions?book=${BOOK_ID}&page=${currentPage}`);
    const data = await res.json();
    interactions = data.interactions || [];
  } catch (e) {
    console.error('fetchInteractions failed:', e);
    interactions = [];
  }
}

// Fetch previously saved answers for this student on the current page
async function fetchStudentAnswers() {
  try {
    const res  = await fetch(`/api/book/answers?studentId=${STUDENT_ID}&book=${BOOK_ID}&page=${currentPage}`);
    const data = await res.json();
    // Merge server answers into local state without overwriting any already-set answers
    Object.entries(data.answers || {}).forEach(([id, record]) => {
      if (!studentAnswers[id]) {
        studentAnswers[id] = { answer: record.answer, correct: null };
      }
    });
  } catch (e) {
    console.error('fetchStudentAnswers failed:', e);
  }
}

// Mode Switching — Teacher vs Student
function setMode(mode) {
  currentMode = mode;

  const teacherBtn  = document.getElementById('teacherModeBtn');
  const studentBtn  = document.getElementById('studentModeBtn');
  const addBtn      = document.getElementById('addInteractionBtn');
  const submitBtn   = document.getElementById('submitAnswersBtn');
  const teacherSide = document.getElementById('teacherSidebar');
  const studentSide = document.getElementById('studentSidebar');

  if (mode === 'teacher') {
    teacherBtn.classList.add('active');
    studentBtn.classList.remove('active');
    addBtn.style.display      = 'inline-flex';
    submitBtn.style.display   = 'none';
    teacherSide.style.display = 'block';
    studentSide.style.display = 'none';
    stopDrawing();
  } else {
    studentBtn.classList.add('active');
    teacherBtn.classList.remove('active');
    addBtn.style.display      = 'none';
    submitBtn.style.display   = 'inline-flex';
    teacherSide.style.display = 'none';
    studentSide.style.display = 'block';
    document.getElementById('submitAnswersBtn').disabled    = false;
    document.getElementById('resultsSummary').style.display = 'none';
    stopDrawing();
    fetchStudentAnswers();
  }

  // Re-render everything to reflect the new mode
  renderInteractions();
  renderPlacedImages();
  renderSidebar();
}

// Image Bank — Build sidebar grid and handle drag-from-bank
function buildImageBank() {
  const container = document.getElementById('imageBankGrid');
  if (!container) return;

  // Render each image as a draggable card
  container.innerHTML = IMAGE_BANK.map(img => `
    <div class="bank-item"
         id="bank_${img.id}"
         draggable="true"
         data-image-id="${img.id}"
         data-src="${img.src}"
         data-label="${img.label}"
         title="${img.label}">
      <img src="${img.src}" alt="${img.label}" draggable="false" />
      <span class="bank-label">${img.label}</span>
    </div>
  `).join('');

  // Attach HTML5 drag events to each card
  container.querySelectorAll('.bank-item').forEach(item => {
    item.addEventListener('dragstart', onBankDragStart);
    item.addEventListener('dragend',   onBankDragEnd);
  });
}

// Store the item being dragged so the drop zone knows what to place
function onBankDragStart(e) {
  draggingBankItem = {
    imageId: e.currentTarget.dataset.imageId,
    src:     e.currentTarget.dataset.src,
    label:   e.currentTarget.dataset.label,
  };
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.imageId);
}

// Clean up visual state after drag ends
function onBankDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  draggingBankItem = null;
}

// Page Drop Zone — Accept images dragged from the bank
function setupPageDropZone() {
  const wrapper = document.getElementById('bookPageWrapper');

  wrapper.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    wrapper.classList.add('drop-active');
  });

  wrapper.addEventListener('dragleave', e => {
    // Only remove the highlight when leaving the wrapper entirely
    if (!wrapper.contains(e.relatedTarget)) {
      wrapper.classList.remove('drop-active');
    }
  });

  wrapper.addEventListener('drop', e => {
    e.preventDefault();
    wrapper.classList.remove('drop-active');

    if (!draggingBankItem) return;

    // Only students can place images
    if (currentMode !== 'student') {
      showNotification('الإلصاق متاح فقط في وضع الطالب', 'error');
      return;
    }

    // Convert drop coordinates to percentage of wrapper size
    const rect = wrapper.getBoundingClientRect();
    const x    = ((e.clientX - rect.left) / rect.width)  * 100;
    const y    = ((e.clientY - rect.top)  / rect.height) * 100;

    placeImage(draggingBankItem.imageId, draggingBankItem.src, draggingBankItem.label, x, y);
    draggingBankItem = null;
  });
}

// Placed Images — Add, render, move, and remove images on page
// Add a new image instance to the current page at the given position
function placeImage(imageId, src, label, xPct, yPct) {
  if (!placedImages[currentPage]) placedImages[currentPage] = [];

  const instanceId = `placed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const w = 12; // default width as % of page
  const h = 12; // default height as % of page

  // Center the image on the drop point and keep it within bounds
  const x = Math.max(0, Math.min(88, xPct - w / 2));
  const y = Math.max(0, Math.min(88, yPct - h / 2));

  placedImages[currentPage].push({ instanceId, imageId, src, label, x, y, w, h });
  renderPlacedImages();
  updateImageBankUsed();
}

// Re-render all placed images for the current page into the DOM layer
function renderPlacedImages() {
  const layer = document.getElementById('placedImagesLayer');
  if (!layer) return;
  layer.innerHTML = '';

  (placedImages[currentPage] || []).forEach(item => {
    const el = document.createElement('div');
    el.className        = 'placed-image-wrapper';
    el.dataset.instance = item.instanceId;
    el.style.left       = item.x + '%';
    el.style.top        = item.y + '%';
    el.style.width      = item.w + '%';

    // Show remove button only for students
    el.innerHTML = `
      <img src="${item.src}" alt="${item.label}" draggable="false" />
      ${currentMode === 'student' ? `
        <button class="placed-remove-btn" title="إزالة" onclick="removePlacedImage('${item.instanceId}')">✕</button>
      ` : ''}
    `;

    // Students can drag placed images to reposition them
    if (currentMode === 'student') {
      makePlacedImageDraggable(el, item);
    }

    layer.appendChild(el);
  });
}

// Allow a placed image to be repositioned by mouse drag
function makePlacedImageDraggable(el, item) {
  let startMouseX, startMouseY, startItemX, startItemY;
  let isDraggingPlaced = false;

  el.addEventListener('mousedown', e => {
    // Don't interfere with the remove button
    if (e.target.classList.contains('placed-remove-btn')) return;
    e.preventDefault();
    e.stopPropagation();

    isDraggingPlaced = true;
    const wrapper = document.getElementById('bookPageWrapper');
    const wRect   = wrapper.getBoundingClientRect();

    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startItemX  = item.x;
    startItemY  = item.y;

    el.style.zIndex  = '50';
    el.style.opacity = '0.85';

    function onMove(e) {
      if (!isDraggingPlaced) return;
      // Convert pixel delta to percentage delta
      const dx = ((e.clientX - startMouseX) / wRect.width)  * 100;
      const dy = ((e.clientY - startMouseY) / wRect.height) * 100;
      const nx = Math.max(0, Math.min(88, startItemX + dx));
      const ny = Math.max(0, Math.min(88, startItemY + dy));

      el.style.left = nx + '%';
      el.style.top  = ny + '%';
      item.x = nx;
      item.y = ny;
    }

    function onUp() {
      isDraggingPlaced = false;
      el.style.zIndex  = '';
      el.style.opacity = '1';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// Remove a single placed image by its instance ID
function removePlacedImage(instanceId) {
  if (!placedImages[currentPage]) return;
  placedImages[currentPage] = placedImages[currentPage].filter(i => i.instanceId !== instanceId);
  renderPlacedImages();
  updateImageBankUsed();
}

// Highlight bank items that are already used on this page,
// and show a count badge if the same image is used more than once
function updateImageBankUsed() {
  document.querySelectorAll('.bank-item').forEach(item => {
    const id    = item.dataset.imageId;
    const count = (placedImages[currentPage] || []).filter(i => i.imageId === id).length;
    item.classList.toggle('used', count > 0);

    let badge = item.querySelector('.use-count');
    if (count > 1) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'use-count';
        item.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  });
}

// Drawing Mode — Teacher drags a box to define a question area
function startDrawing() {
  isDrawing = true;
  document.getElementById('viewerPanel').classList.add('drawing-mode');
  document.getElementById('drawingGuide').style.display    = 'none';
  document.getElementById('interactionForm').style.display = 'block';
  showNotification('ارسم مربعاً بالماوس فوق موقع السؤال على الصفحة', '');

  const wrapper = document.getElementById('bookPageWrapper');
  wrapper.addEventListener('mousedown', onMouseDown);
  wrapper.addEventListener('mousemove', onMouseMove);
  wrapper.addEventListener('mouseup',   onMouseUp);
}

function stopDrawing() {
  isDrawing = false;
  document.getElementById('viewerPanel').classList.remove('drawing-mode');
  document.getElementById('selectionBox').style.display = 'none';

  const wrapper = document.getElementById('bookPageWrapper');
  wrapper.removeEventListener('mousedown', onMouseDown);
  wrapper.removeEventListener('mousemove', onMouseMove);
  wrapper.removeEventListener('mouseup',   onMouseUp);
}

// Convert a mouse event to a position as a percentage of the page wrapper
function getRelativePos(e) {
  const wrapper = document.getElementById('bookPageWrapper');
  const rect    = wrapper.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width)  * 100)),
    y: Math.max(0, Math.min(100, ((e.clientY - rect.top)  / rect.height) * 100)),
  };
}

function onMouseDown(e) {
  if (!isDrawing) return;
  e.preventDefault();
  drawStart = getRelativePos(e);
  const box = document.getElementById('selectionBox');
  box.style.display = 'block';
  box.style.left    = drawStart.x + '%';
  box.style.top     = drawStart.y + '%';
  box.style.width   = '0';
  box.style.height  = '0';
}

function onMouseMove(e) {
  if (!isDrawing || !drawStart) return;
  e.preventDefault();
  const pos = getRelativePos(e);
  const x   = Math.min(drawStart.x, pos.x);
  const y   = Math.min(drawStart.y, pos.y);
  const w   = Math.abs(pos.x - drawStart.x);
  const h   = Math.abs(pos.y - drawStart.y);
  const box = document.getElementById('selectionBox');
  box.style.left   = x + '%';
  box.style.top    = y + '%';
  box.style.width  = w + '%';
  box.style.height = h + '%';
}

function onMouseUp(e) {
  if (!isDrawing || !drawStart) return;
  e.preventDefault();
  const pos = getRelativePos(e);
  const x   = Math.min(drawStart.x, pos.x);
  const y   = Math.min(drawStart.y, pos.y);
  const w   = Math.abs(pos.x - drawStart.x);
  const h   = Math.abs(pos.y - drawStart.y);

  // Ignore tiny accidental clicks
  if (w < 2 || h < 1) { drawStart = null; return; }

  pendingRect = { x, y, w, h };
  drawStart   = null;
  stopDrawing();
  showNotification('تم تحديد الموقع ✅ — اختر نوع السؤال وأدخل البيانات', 'success');
}

// Question Type Selector
// Switches the form fields shown based on selected question type
function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  document.getElementById('fillFields').style.display  = type === 'fill'  ? 'block' : 'none';
  document.getElementById('mcFields').style.display    = type === 'mc'    ? 'block' : 'none';
  document.getElementById('clickFields').style.display = type === 'click' ? 'block' : 'none';
}

// Multiple Choice Options Builder
// Set up a default 3-option MC form
function initMcOptions() {
  mcOptions = [
    { text: '', correct: true  },
    { text: '', correct: false },
    { text: '', correct: false },
  ];
  renderMcOptions();
}

// Re-render the MC options list in the form
function renderMcOptions() {
  const list = document.getElementById('mcOptionsList');
  if (!list) return;
  list.innerHTML = mcOptions.map((opt, i) => `
    <div class="mc-option-row">
      <input type="radio" name="mcCorrect" value="${i}" ${opt.correct ? 'checked' : ''}
             onchange="setCorrectOption(${i})" />
      <span class="radio-label">صح</span>
      <input type="text" value="${escHtml(opt.text)}" placeholder="الخيار ${i + 1}"
             oninput="mcOptions[${i}].text = this.value" />
      ${mcOptions.length > 2 ? `<button class="remove-opt" onclick="removeMcOption(${i})">✕</button>` : ''}
    </div>
  `).join('');
}

function addMcOption() {
  if (mcOptions.length >= 6) return;
  mcOptions.push({ text: '', correct: false });
  renderMcOptions();
}

function removeMcOption(i) {
  if (mcOptions.length <= 2) return;
  mcOptions.splice(i, 1);
  // Make sure there's always exactly one correct option
  if (!mcOptions.some(o => o.correct)) mcOptions[0].correct = true;
  renderMcOptions();
}

function setCorrectOption(i) {
  mcOptions.forEach((o, idx) => o.correct = idx === i);
}

//Save / Cancel Interaction (Teacher)
async function saveInteraction() {
  // Must draw a box first (unless editing an existing interaction)
  if (!pendingRect && !editingId) {
    showNotification('ارسم مربعاً أولاً على الصفحة ثم أدخل بيانات السؤال', 'error');
    return;
  }

  let interaction = {};

  if (selectedType === 'fill') {
    const label  = document.getElementById('fillLabel').value.trim();
    const answer = document.getElementById('fillAnswer').value.trim();
    const hint   = document.getElementById('fillPlaceholder').value.trim();
    if (!answer) { showNotification('أدخل الإجابة الصحيحة للفراغ', 'error'); return; }
    interaction = { type: 'fill', label, answer, placeholder: hint || 'اكتب هنا...' };

  } else if (selectedType === 'mc') {
    const question = document.getElementById('mcQuestion').value.trim();
    if (!question) { showNotification('أدخل نص السؤال', 'error'); return; }
    const filledOptions = mcOptions.filter(o => o.text.trim());
    if (filledOptions.length < 2) { showNotification('أدخل خيارين على الأقل', 'error'); return; }
    if (!filledOptions.some(o => o.correct)) { showNotification('حدد الإجابة الصحيحة', 'error'); return; }
    interaction = { type: 'mc', question, options: filledOptions.map(o => ({ text: o.text, correct: o.correct })) };

  } else if (selectedType === 'click') {
    const label   = document.getElementById('clickLabel').value.trim();
    const correct = document.getElementById('clickCorrect').value === 'true';
    if (!label) { showNotification('أدخل وصف منطقة النقر', 'error'); return; }
    interaction = { type: 'click', label, correct };
  }

  try {
    if (editingId) {
      // Update an existing interaction
      await fetch(`/api/book/interactions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: BOOK_ID, page: currentPage, updates: interaction }),
      });
      showNotification('تم تحديث السؤال ✅', 'success');
    } else {
      // Create a new interaction with the drawn position attached
      interaction.position = pendingRect;
      await fetch('/api/book/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: BOOK_ID, page: currentPage, interaction }),
      });
      showNotification('تم حفظ السؤال ✅', 'success');
    }
  } catch (e) {
    showNotification('خطأ في الحفظ — تأكد أن الخادم يعمل', 'error');
    return;
  }

  await fetchInteractions();
  cancelInteraction();
  renderInteractions();
  renderSidebar();
}

//Reset the interaction form back to its initial state
function cancelInteraction() {
  pendingRect = null;
  editingId   = null;
  document.getElementById('interactionForm').style.display = 'none';
  document.getElementById('drawingGuide').style.display    = 'block';
  document.getElementById('selectionBox').style.display    = 'none';
  ['fillLabel', 'fillAnswer', 'fillPlaceholder', 'mcQuestion', 'clickLabel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  initMcOptions();
  selectType('fill');
  stopDrawing();
}

//Delete Interaction (Teacher)
async function deleteInteraction(id) {
  if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
  try {
    await fetch(`/api/book/interactions/${id}?book=${BOOK_ID}&page=${currentPage}`, { method: 'DELETE' });
    showNotification('تم حذف السؤال', 'success');
  } catch (e) {
    showNotification('خطأ في الحذف', 'error');
    return;
  }
  await fetchInteractions();
  renderInteractions();
  renderSidebar();
}

//Render Question Overlays On The Page
function renderInteractions() {
  const layer = document.getElementById('interactionsLayer');
  layer.innerHTML = '';

  interactions.forEach(interaction => {
    const pos = interaction.position || { x: 5, y: 5, w: 20, h: 6 };
    const el  = document.createElement('div');
    el.className       = 'interaction-widget';
    el.dataset.id      = interaction.id;
    el.style.left      = pos.x + '%';
    el.style.top       = pos.y + '%';
    el.style.width     = pos.w + '%';
    el.style.minHeight = pos.h + '%';

    if      (interaction.type === 'fill')  renderFillWidget(el, interaction);
    else if (interaction.type === 'mc')    renderMcWidget(el, interaction);
    else if (interaction.type === 'click') renderClickWidget(el, interaction);

    // In teacher mode, add drag-to-move and delete controls
    if (currentMode === 'teacher') addTeacherHandles(el, interaction);

    layer.appendChild(el);
  });
}

//Fill-in-the-blank: render a text input inside the widget
function renderFillWidget(el, interaction) {
  el.classList.add('widget-fill');
  const ans = studentAnswers[interaction.id];
  if (ans?.correct === true)  el.classList.add('correct');
  if (ans?.correct === false) el.classList.add('incorrect');

  const input = document.createElement('input');
  input.type        = 'text';
  input.placeholder = interaction.placeholder || 'اكتب هنا...';
  input.value       = ans?.answer || '';
  input.disabled    = currentMode === 'teacher' || submitted;
  input.setAttribute('data-id', interaction.id);

  input.addEventListener('input', () => {
    if (!studentAnswers[interaction.id]) studentAnswers[interaction.id] = {};
    studentAnswers[interaction.id].answer  = input.value;
    studentAnswers[interaction.id].correct = null; // mark as unevaluated until submit
    updateStudentProgress();
  });

  el.appendChild(input);
}

//Multiple choice: render a clickable widget that opens a popup
function renderMcWidget(el, interaction) {
  el.classList.add('widget-mc');
  const ans = studentAnswers[interaction.id];
  if (ans?.correct === true)  el.classList.add('answered');
  if (ans?.correct === false) el.classList.add('incorrect');

  const icon   = ans?.correct === true ? '✅' : ans?.correct === false ? '❌' : '☑️';
  const shortQ = interaction.question.length > 20
    ? interaction.question.substring(0, 20) + '...'
    : interaction.question;

  el.innerHTML = `<span style="font-size:1rem;">${icon}</span><span style="font-size:0.72rem;font-weight:700;">${shortQ}</span>`;

  if (currentMode === 'student' && !submitted) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => openMcPopup(interaction));
  }
}

// Click zone: a tappable region the teacher marks as correct or incorrect
function renderClickWidget(el, interaction) {
  el.classList.add('widget-click');
  const ans = studentAnswers[interaction.id];
  if (ans?.clicked) el.classList.add(interaction.correct ? 'clicked-correct' : 'clicked-incorrect');

  if (currentMode === 'teacher') {
    el.innerHTML = `<span style="font-size:0.7rem;color:var(--purple);font-weight:700;pointer-events:none;padding:4px;">${interaction.correct ? '✅' : '❌'} ${interaction.label.substring(0, 20)}</span>`;
  }

  if (currentMode === 'student' && !submitted) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      studentAnswers[interaction.id] = { clicked: true, answer: 'clicked', correct: interaction.correct };
      showNotification(
        interaction.correct ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة، حاول مرة أخرى',
        interaction.correct ? 'success' : 'error'
      );
      renderInteractions();
      updateStudentProgress();
    });
  }
}

// Add delete button and drag-to-move behavior to a widget in teacher mode
function addTeacherHandles(el, interaction) {
  const delBtn     = document.createElement('button');
  delBtn.className = 'widget-delete-btn';
  delBtn.innerHTML = '✕';
  delBtn.title     = 'حذف';
  delBtn.addEventListener('click', e => { e.stopPropagation(); deleteInteraction(interaction.id); });
  el.appendChild(delBtn);

  el.style.cursor = 'move';
  makeDraggable(el, interaction);
}

// Allow teacher to drag a widget to reposition it, saving the new position to the server
function makeDraggable(el, interaction) {
  let startX, startY, startLeft, startTop;

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('widget-delete-btn')) return;
    e.preventDefault();

    const wrapper = document.getElementById('bookPageWrapper');
    const wRect   = wrapper.getBoundingClientRect();
    startX    = e.clientX;
    startY    = e.clientY;
    startLeft = interaction.position.x;
    startTop  = interaction.position.y;

    function onMove(e) {
      const dx = ((e.clientX - startX) / wRect.width)  * 100;
      const dy = ((e.clientY - startY) / wRect.height) * 100;
      const nx = Math.max(0, Math.min(95, startLeft + dx));
      const ny = Math.max(0, Math.min(95, startTop  + dy));
      el.style.left = nx + '%';
      el.style.top  = ny + '%';
      interaction.position.x = nx;
      interaction.position.y = ny;
    }

    async function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      // Persist the new position to the server
      try {
        await fetch(`/api/book/interactions/${interaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book: BOOK_ID, page: currentPage, updates: { position: interaction.position } }),
        });
      } catch (e) { console.error(e); }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// MULTIPLE CHOICE POPUP
function openMcPopup(interaction) {
  mcPopupInteraction = interaction;
  mcSelectedChoice   = null;

  document.getElementById('mcPopupQuestion').textContent  = interaction.question;
  document.getElementById('mcFeedback').style.display     = 'none';
  document.getElementById('mcSubmitBtn').style.display    = 'inline-flex';
  document.getElementById('mcPopupOverlay').style.display = 'flex';

  const letters    = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
  const choicesEl  = document.getElementById('mcPopupChoices');
  const prevAnswer = studentAnswers[interaction.id];

  choicesEl.innerHTML = interaction.options.map((opt, i) => {
    let cls = 'mc-choice';
    if (prevAnswer) {
      cls += ' disabled';
      if (opt.correct) cls += ' correct';
      else if (prevAnswer.choiceIndex === i && !opt.correct) cls += ' incorrect';
    }
    return `<div class="${cls}" data-index="${i}" onclick="selectMcChoice(this,${i})">
      <span class="mc-choice-letter">${letters[i] || (i + 1)}</span>
      <span>${escHtml(opt.text)}</span>
    </div>`;
  }).join('');

  // If the student already answered, show the result immediately
  if (prevAnswer) {
    document.getElementById('mcSubmitBtn').style.display = 'none';
    showMcFeedback(prevAnswer.correct);
  }
}

// Highlight the option the student clicked
function selectMcChoice(el, index) {
  if (el.classList.contains('disabled')) return;
  document.querySelectorAll('.mc-choice').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  mcSelectedChoice = index;
}

// Evaluate the student's MC selection and show feedback
function submitMcAnswer() {
  if (mcSelectedChoice === null) { showNotification('اختر إجابة أولاً', 'error'); return; }

  const interaction = mcPopupInteraction;
  const correct     = interaction.options[mcSelectedChoice].correct;

  // Save the answer to local state
  studentAnswers[interaction.id] = {
    answer:      interaction.options[mcSelectedChoice].text,
    choiceIndex: mcSelectedChoice,
    correct,
  };

  // Reveal correct/incorrect styling on all options
  document.querySelectorAll('.mc-choice').forEach((el, i) => {
    el.classList.add('disabled');
    if (interaction.options[i].correct) el.classList.add('correct');
    else if (i === mcSelectedChoice && !correct) el.classList.add('incorrect');
  });

  document.getElementById('mcSubmitBtn').style.display = 'none';
  showMcFeedback(correct);
  updateStudentProgress();
  renderInteractions();
}

// Show the feedback banner at the bottom of the MC popup
function showMcFeedback(correct) {
  const fb     = document.getElementById('mcFeedback');
  fb.style.display = 'flex';
  fb.className     = 'feedback-banner ' + (correct ? 'correct' : 'incorrect');
  fb.innerHTML     = correct
    ? '✅ إجابة صحيحة! أحسنت 🎉'
    : '❌ إجابة خاطئة — انظر الإجابة الصحيحة باللون الأخضر';
}

// Close popup only when clicking the dark overlay backdrop
function closeMcPopup(e) {
  if (e.target.id === 'mcPopupOverlay') closeMcPopupDirect();
}

function closeMcPopupDirect() {
  document.getElementById('mcPopupOverlay').style.display = 'none';
  mcPopupInteraction = null;
  mcSelectedChoice   = null;
}

//Submit All Answers (Student)
async function submitAllAnswers() {
  if (submitted) return;
  submitted = true;

  // Evaluate fill-in-the-blank answers (case-insensitive trim comparison)
  interactions.forEach(interaction => {
    if (interaction.type === 'fill') {
      const ans = studentAnswers[interaction.id];
      if (ans && ans.answer !== undefined) {
        ans.correct = ans.answer.trim().toLowerCase() === interaction.answer.trim().toLowerCase();
      } else {
        studentAnswers[interaction.id] = { answer: '', correct: false };
      }
    }
  });

  // Persist all answers to the server
  for (const interaction of interactions) {
    const ans = studentAnswers[interaction.id];
    if (ans) {
      try {
        await fetch('/api/book/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId:     STUDENT_ID,
            interactionId: interaction.id,
            answer:        ans.answer || '',
            book:          BOOK_ID,
            page:          currentPage,
          }),
        });
      } catch (e) { console.error(e); }
    }
  }

  renderInteractions();
  updateStudentProgress(true);
  showNotification('تم تسليم إجاباتك! 🎉', 'success');
  document.getElementById('submitAnswersBtn').disabled = true;
}

//Student Progress Bar & Score
function updateStudentProgress(showResults = false) {
  const total    = interactions.length;
  const answered = Object.keys(studentAnswers)
    .filter(id => studentAnswers[id]?.answer !== undefined || studentAnswers[id]?.clicked).length;
  const correct  = Object.values(studentAnswers).filter(a => a.correct === true).length;
  const pct      = total > 0 ? Math.round((answered / total) * 100) : 0;

  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('statAnswered').textContent  = `${answered} / ${total} سؤال`;

  if (showResults || submitted) {
    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
    document.getElementById('statScore').textContent         = `النتيجة: ${scorePct}%`;
    document.getElementById('resultsSummary').style.display  = 'block';
    document.getElementById('resultScore').textContent       = scorePct + '%';
    document.getElementById('resultDetail').textContent      = `${correct} من ${total} إجابة صحيحة`;
    document.getElementById('resultEmoji').textContent       = scorePct >= 80 ? '🎉' : scorePct >= 50 ? '💪' : '📚';
  } else {
    document.getElementById('statScore').textContent = 'النتيجة: —';
  }

  renderStudentList();
}

//Render the per-question status list in the student sidebar
function renderStudentList() {
  const list = document.getElementById('studentInteractionsList');
  if (!list) return;

  if (interactions.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد أسئلة في هذه الصفحة</p></div>`;
    return;
  }

  const typeIcons = { fill: '✏️', mc: '☑️', click: '👆' };

  list.innerHTML = interactions.map(interaction => {
    const ans  = studentAnswers[interaction.id];
    let chip   = '<span class="result-chip pending">لم تجب بعد</span>';
    if (ans) {
      if      (ans.correct === true)  chip = '<span class="result-chip correct">✅ صحيح</span>';
      else if (ans.correct === false) chip = '<span class="result-chip incorrect">❌ خاطئ</span>';
      else                            chip = '<span class="result-chip pending">⏳ بانتظار التسليم</span>';
    }
    const label = interaction.type === 'mc'
      ? interaction.question
      : (interaction.label || interaction.answer || '');

    return `<div class="interaction-card">
      <span class="card-icon">${typeIcons[interaction.type] || '❓'}</span>
      <div class="card-info">
        <div class="card-label">${escHtml(label.substring(0, 28))}${label.length > 28 ? '...' : ''}</div>
        ${chip}
      </div>
    </div>`;
  }).join('');
}

//Teacher Sidebar — List of questions with delete controls
function renderSidebar() {
  if (currentMode !== 'teacher') return;

  const list  = document.getElementById('interactionsList');
  const badge = document.getElementById('interactionCountBadge');
  if (!list || !badge) return;

  badge.textContent = interactions.length;

  if (interactions.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد أسئلة بعد على هذه الصفحة.<br/>اضغط "أضف سؤالاً" للبدء.</p></div>`;
    return;
  }

  const typeIcons  = { fill: '✏️', mc: '☑️', click: '👆' };
  const typeLabels = { fill: 'تعبئة فراغ', mc: 'اختيار متعدد', click: 'منطقة النقر' };

  list.innerHTML = interactions.map(interaction => {
    const label = interaction.type === 'mc'
      ? interaction.question
      : (interaction.label || interaction.answer || '');

    return `<div class="interaction-card" onclick="highlightInteraction('${interaction.id}')">
      <span class="card-icon">${typeIcons[interaction.type] || '❓'}</span>
      <div class="card-info">
        <div class="card-type">${typeLabels[interaction.type] || ''}</div>
        <div class="card-label">${escHtml(label.substring(0, 28))}${label.length > 28 ? '...' : ''}</div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn del" onclick="event.stopPropagation();deleteInteraction('${interaction.id}')" title="حذف">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

// Flash a highlight border on a widget when the teacher clicks it in the sidebar
function highlightInteraction(id) {
  const el = document.querySelector(`.interaction-widget[data-id="${id}"]`);
  if (!el) return;
  el.style.outline = '3px solid var(--accent)';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { el.style.outline = ''; }, 2000);
}

//Clear All Placed Images (Student)
function clearAllPlacedImages() {
  if (!placedImages[currentPage] || placedImages[currentPage].length === 0) {
    showNotification('لا توجد صور مُلصقة على هذه الصفحة', '');
    return;
  }
  if (!confirm('هل تريد مسح كل الصور المُلصقة على هذه الصفحة؟')) return;
  placedImages[currentPage] = [];
  renderPlacedImages();
  updateImageBankUsed();
  showNotification('تم مسح كل الصور', 'success');
}

//Utilities
//Escape special HTML characters to prevent XSS when injecting user content into innerHTML
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Show a toast notification that auto-hides after 3 seconds
let notificationTimer;
function showNotification(msg, type = '') {
  const el     = document.getElementById('notification');
  el.textContent = msg;
  el.className   = 'notification show' + (type ? ' ' + type : '');
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => el.classList.remove('show'), 3000);
}