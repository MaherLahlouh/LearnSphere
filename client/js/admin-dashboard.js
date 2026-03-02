/**
 * لوحة تحكم الأدمن - تحميل البيانات وإدارة الوحدات والدروس والاختبارات
 * كل استدعاءات API تتضمن توكن الأدمن في رأس Authorization
 */

(function () {
    // تخزين آمن للتوكن
    var safeStorage = (function () {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return {
                    getItem: function (k) { return window.localStorage.getItem(k); },
                    setItem: function (k, v) { window.localStorage.setItem(k, v); },
                    removeItem: function (k) { window.localStorage.removeItem(k); }
                };
            }
        } catch (e) {}
        var o = {};
        return {
            getItem: function (k) { return o[k] ?? null; },
            setItem: function (k, v) { o[k] = v; },
            removeItem: function (k) { delete o[k]; }
        };
    })();

    var token = safeStorage.getItem('adminToken');
    var dashboardEl = document.querySelector('.admin-dashboard');
    var unauthorizedEl = document.querySelector('.unauthorized');

    // التحقق من وجود التوكن وعرض الواجهة المناسبة
    if (!token) {
        if (dashboardEl) dashboardEl.style.display = 'none';
        if (unauthorizedEl) unauthorizedEl.style.display = 'block';
        return;
    }
    if (dashboardEl) dashboardEl.style.display = 'block';
    if (unauthorizedEl) unauthorizedEl.style.display = 'none';

    // إرجاع رؤوس الطلبات مع التوكن
    function authHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };
    }

    // عرض رسالة في عنصر msg
    function showMsg(id, text, isError) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = text || '';
        el.className = 'msg ' + (isError ? 'error' : 'success');
        el.style.display = text ? 'block' : 'none';
    }

    // ========== التبويبات ==========
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var tab = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
            this.classList.add('active');
            var content = document.getElementById('tab-' + tab);
            if (content) content.classList.add('active');
            if (tab === 'lessons') loadLessonsAndUnits();
            if (tab === 'quizzes') loadQuizzesAndDropdowns();
        });
    });

    // ========== تسجيل الخروج ==========
    document.getElementById('admin-logout-btn').addEventListener('click', function () {
        safeStorage.removeItem('adminToken');
        window.location.href = '/admin-login.html';
    });

    // ========== الوحدات ==========
    function loadUnits() {
        fetch('/api/admin/units', { headers: authHeaders() })
            .then(function (r) {
                if (r.status === 401) { window.location.href = '/admin-login.html'; return null; }
                return r.json();
            })
            .then(function (data) {
                if (!data) return;
                var tbody = document.getElementById('units-tbody');
                tbody.innerHTML = '';
                if (data.success && data.data && data.data.length) {
                    data.data.forEach(function (u) {
                        var tr = document.createElement('tr');
                        tr.innerHTML =
                            '<td>' + u.unit_id + '</td>' +
                            '<td>' + (u.grade_level || '') + '</td>' +
                            '<td>' + (u.unit_number || '') + '</td>' +
                            '<td>' + (u.unit_title || u.title || '') + '</td>' +
                            '<td><button type="button" class="btn btn-danger btn-small unit-delete" data-id="' + u.unit_id + '">حذف</button></td>';
                        tbody.appendChild(tr);
                    });
                    tbody.querySelectorAll('.unit-delete').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            if (!confirm('حذف هذه الوحدة؟')) return;
                            deleteUnit(this.getAttribute('data-id'));
                        });
                    });
                }
                // تحديث قائمة الوحدات في تبويب الدروس والاختبارات
                updateUnitDropdowns(data.success ? data.data : []);
            })
            .catch(function (err) {
                console.error('Load units error:', err);
                showMsg('units-msg', 'فشل تحميل الوحدات', true);
            });
    }

    function deleteUnit(id) {
        fetch('/api/admin/units/' + id, { method: 'DELETE', headers: authHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                showMsg('units-msg', data.message || (data.success ? 'تم الحذف' : 'فشل الحذف'), !data.success);
                loadUnits();
                loadLessonsAndUnits();
            })
            .catch(function () { showMsg('units-msg', 'خطأ في الحذف', true); });
    }

    document.getElementById('unit-add-btn').addEventListener('click', function () {
        var grade = document.getElementById('unit-grade').value;
        var unitNumber = document.getElementById('unit-number').value;
        var title = document.getElementById('unit-title').value;
        var description = document.getElementById('unit-description').value;
        if (!title) { showMsg('units-msg', 'أدخل عنوان الوحدة', true); return; }
        fetch('/api/admin/units', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                grade_level: parseInt(grade, 10),
                unit_number: parseInt(unitNumber, 10),
                unit_title: title,
                unit_description: description || null
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                showMsg('units-msg', data.message || (data.success ? 'تمت الإضافة' : 'فشل'), !data.success);
                if (data.success) {
                    document.getElementById('unit-title').value = '';
                    document.getElementById('unit-description').value = '';
                    loadUnits();
                }
            })
            .catch(function () { showMsg('units-msg', 'خطأ في الإضافة', true); });
    });

    // ========== الدروس ==========
    var unitsCache = [];

    function updateUnitDropdowns(units) {
        unitsCache = units || unitsCache;
        var options = '<option value="">-- اختر الوحدة --</option>';
        unitsCache.forEach(function (u) {
            options += '<option value="' + u.unit_id + '">' + (u.unit_title || u.title || '') + ' (id:' + u.unit_id + ')</option>';
        });
        var lessonUnit = document.getElementById('lesson-unit-id');
        var quizUnit = document.getElementById('quiz-unit-id');
        if (lessonUnit) lessonUnit.innerHTML = options;
        if (quizUnit) quizUnit.innerHTML = options;
    }

    function loadLessonsAndUnits() {
        fetch('/api/admin/units', { headers: authHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success && data.data) updateUnitDropdowns(data.data);
            });
        loadLessons();
    }

    function loadLessons() {
        fetch('/api/admin/lessons', { headers: authHeaders() })
            .then(function (r) {
                if (r.status === 401) { window.location.href = '/admin-login.html'; return null; }
                return r.json();
            })
            .then(function (data) {
                if (!data) return;
                var tbody = document.getElementById('lessons-tbody');
                tbody.innerHTML = '';
                if (data.success && data.data && data.data.length) {
                    data.data.forEach(function (l) {
                        var tr = document.createElement('tr');
                        tr.innerHTML =
                            '<td>' + l.lesson_id + '</td>' +
                            '<td>' + l.unit_id + '</td>' +
                            '<td>' + (l.lesson_number || '') + '</td>' +
                            '<td>' + (l.lesson_title || '') + '</td>' +
                            '<td>' + (l.video_url ? (l.video_url.substring(0, 30) + '...') : '') + '</td>' +
                            '<td><button type="button" class="btn btn-danger btn-small lesson-delete" data-id="' + l.lesson_id + '">حذف</button></td>';
                        tbody.appendChild(tr);
                    });
                    tbody.querySelectorAll('.lesson-delete').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            if (!confirm('حذف هذا الدرس؟')) return;
                            deleteLesson(this.getAttribute('data-id'));
                        });
                    });
                }
            })
            .catch(function (err) {
                console.error('Load lessons error:', err);
                showMsg('lessons-msg', 'فشل تحميل الدروس', true);
            });
    }

    function deleteLesson(id) {
        fetch('/api/admin/lessons/' + id, { method: 'DELETE', headers: authHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                showMsg('lessons-msg', data.message || (data.success ? 'تم الحذف' : 'فشل الحذف'), !data.success);
                loadLessons();
                loadQuizzesAndDropdowns();
            })
            .catch(function () { showMsg('lessons-msg', 'خطأ في الحذف', true); });
    }

    document.getElementById('lesson-add-btn').addEventListener('click', function () {
        var unitId = document.getElementById('lesson-unit-id').value;
        var grade = document.getElementById('lesson-grade').value;
        var lessonNumber = document.getElementById('lesson-number').value;
        var title = document.getElementById('lesson-title').value;
        var description = document.getElementById('lesson-description').value;
        var videoUrl = document.getElementById('lesson-video-url').value;
        if (!unitId || !title) { showMsg('lessons-msg', 'اختر الوحدة وأدخل العنوان', true); return; }
        fetch('/api/admin/lessons', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                unit_id: parseInt(unitId, 10),
                grade_level: grade ? parseInt(grade, 10) : null,
                lesson_number: parseInt(lessonNumber, 10),
                lesson_title: title,
                lesson_description: description || null,
                video_url: videoUrl || null
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                showMsg('lessons-msg', data.message || (data.success ? 'تمت الإضافة' : 'فشل'), !data.success);
                if (data.success) {
                    document.getElementById('lesson-title').value = '';
                    document.getElementById('lesson-description').value = '';
                    document.getElementById('lesson-video-url').value = '';
                    loadLessons();
                    loadQuizzesAndDropdowns();
                }
            })
            .catch(function () { showMsg('lessons-msg', 'خطأ في الإضافة', true); });
    });

    // عند تغيير الوحدة في تبويب الدروس نملأ الصف إن أردت (اختياري)
    document.getElementById('lesson-unit-id').addEventListener('change', function () {
        var id = this.value;
        var u = unitsCache.find(function (x) { return String(x.unit_id) === String(id); });
        if (u && u.grade_level && document.getElementById('lesson-grade')) {
            document.getElementById('lesson-grade').value = u.grade_level;
        }
    });

    // ========== الاختبارات ==========
    function loadQuizzesAndDropdowns() {
        fetch('/api/admin/units', { headers: authHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success && data.data) updateUnitDropdowns(data.data);
            });
        fetch('/api/admin/quizzes', { headers: authHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data || !data.success) return;
                var list = data.data || [];
                var opts = '<option value="">-- اختر اختبارًا --</option>';
                var optsView = '<option value="">-- اختر quiz_id --</option>';
                list.forEach(function (q) {
                    opts += '<option value="' + q.quiz_id + '">quiz ' + q.quiz_id + ' (lesson ' + q.lesson_id + ')</option>';
                    optsView += '<option value="' + q.quiz_id + '">' + q.quiz_id + '</option>';
                });
                document.getElementById('question-quiz-id').innerHTML = opts;
                document.getElementById('view-questions-quiz-id').innerHTML = optsView;
            });

        // ملء دروس الوحدة المختارة
        document.getElementById('quiz-unit-id').addEventListener('change', function () {
            var unitId = this.value;
            var sel = document.getElementById('quiz-lesson-id');
            sel.innerHTML = '<option value="">-- اختر الدرس --</option>';
            if (!unitId) return;
            fetch('/api/admin/lessons?unit_id=' + unitId, { headers: authHeaders() })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.success && data.data) {
                        data.data.forEach(function (l) {
                            sel.innerHTML += '<option value="' + l.lesson_id + '">' + (l.lesson_title || '') + ' (id:' + l.lesson_id + ')</option>';
                        });
                    }
                });
        });
    }

    document.getElementById('quiz-create-btn').addEventListener('click', function () {
        var unitId = document.getElementById('quiz-unit-id').value;
        var lessonId = document.getElementById('quiz-lesson-id').value;
        var grade = document.getElementById('quiz-grade').value;
        if (!unitId || !lessonId) { showMsg('quizzes-msg', 'اختر الوحدة والدرس', true); return; }
        fetch('/api/admin/quizzes', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                grade_level: grade ? parseInt(grade, 10) : null,
                unit_id: parseInt(unitId, 10),
                lesson_id: parseInt(lessonId, 10)
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                showMsg('quizzes-msg', data.message || (data.success ? 'تم إنشاء الاختبار' : 'فشل'), !data.success);
                if (data.success) loadQuizzesAndDropdowns();
            })
            .catch(function () { showMsg('quizzes-msg', 'خطأ في الإنشاء', true); });
    });

    document.getElementById('question-add-btn').addEventListener('click', function () {
        var quizId = document.getElementById('question-quiz-id').value;
        var text = document.getElementById('question-text').value;
        var type = document.getElementById('question-type').value;
        var correctIndex = parseInt(document.getElementById('correct-answer-index').value, 10) || 0;
        var answersText = document.getElementById('question-answers-text').value;
        if (!quizId || !text) { showMsg('quizzes-msg', 'اختر الاختبار وأدخل نص السؤال', true); return; }
        var lines = answersText.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        var answers = lines.map(function (line, i) {
            return { answer_text: line, is_correct: i === correctIndex };
        });
        fetch('/api/admin/quizzes/' + quizId + '/questions', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                question_type: type || 'multiple-choice',
                question_text: text,
                correct_answer: correctIndex,
                answers: answers.length ? answers : [{ answer_text: 'نعم', is_correct: true }, { answer_text: 'لا', is_correct: false }]
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                showMsg('quizzes-msg', data.message || (data.success ? 'تمت إضافة السؤال' : 'فشل'), !data.success);
                if (data.success) {
                    document.getElementById('question-text').value = '';
                    document.getElementById('question-answers-text').value = '';
                    var qid = document.getElementById('view-questions-quiz-id').value;
                    if (qid === quizId) loadQuizQuestions(quizId);
                }
            })
            .catch(function () { showMsg('quizzes-msg', 'خطأ في الإضافة', true); });
    });

    document.getElementById('view-questions-quiz-id').addEventListener('change', function () {
        var id = this.value;
        if (id) loadQuizQuestions(id); else document.getElementById('quiz-questions-list').innerHTML = '';
    });

    function loadQuizQuestions(quizId) {
        fetch('/api/admin/quizzes/' + quizId + '/questions', { headers: authHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var list = document.getElementById('quiz-questions-list');
                list.innerHTML = '';
                if (data.success && data.data && data.data.length) {
                    data.data.forEach(function (q) {
                        var li = document.createElement('li');
                        li.innerHTML = '<span>' + (q.question_text || '') + '</span>' +
                            '<button type="button" class="btn btn-danger btn-small q-del" data-id="' + q.question_id + '">حذف</button>';
                        list.appendChild(li);
                        li.querySelector('.q-del').addEventListener('click', function () {
                            if (!confirm('حذف هذا السؤال؟')) return;
                            fetch('/api/admin/quizzes/questions/' + q.question_id, { method: 'DELETE', headers: authHeaders() })
                                .then(function () { loadQuizQuestions(quizId); });
                        });
                    });
                }
            })
            .catch(function () { document.getElementById('quiz-questions-list').innerHTML = ''; });
    }

    // تحميل أولي
    loadUnits();
    loadLessons();
    loadQuizzesAndDropdowns();
})();
