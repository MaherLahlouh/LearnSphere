// ===== START OF JAVASCRIPT =====
document.addEventListener('DOMContentLoaded', function() {
    const htmlCode = document.getElementById('html-code');
    const cssCode = document.getElementById('css-code');
    const jsCode = document.getElementById('js-code');
    const pythonCode = document.getElementById('python-code');
    const outputFrame = document.getElementById('output-frame');
    const consoleOutput = document.getElementById('console-output');
    
    const tabs = document.querySelectorAll('.tab-btn');
    const editorSections = document.querySelectorAll('.editor-section');
    
    const runBtn = document.getElementById('runBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearConsoleBtn = document.getElementById('clearConsole');

    let currentTab = 'html';
    let autoRunTimeout;

    checkLessonCode();

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            currentTab = tabName;
            
            tabs.forEach(t => t.classList.remove('active'));
            editorSections.forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${tabName}-editor`).classList.add('active');
            
            if (tabName === 'python') updateOutput();
        });
    });

    [htmlCode, cssCode, jsCode].forEach(editor => {
        editor.addEventListener('input', function() {
            clearTimeout(autoRunTimeout);
            autoRunTimeout = setTimeout(() => {
                if (currentTab !== 'python') updateOutput();
            }, 1000);
        });
    });

    runBtn.addEventListener('click', updateOutput);
    refreshBtn.addEventListener('click', updateOutput);

    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all code?')) {
            htmlCode.value = '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>Start coding here...</p>\n</body>\n</html>';
            cssCode.value = 'body {\n    font-family: Arial, sans-serif;\n    margin: 20px;\n}\n\nh1 {\n    color: #333;\n}\n\np {\n    font-size: 16px;\n}';
            jsCode.value = '// Your JavaScript code here\nconsole.log("Hello from JavaScript!");';
            pythonCode.value = '# Python Code\nprint("Hello from Python!")\n\n# Your code here...';
            updateOutput();
        }
    });

    saveBtn.addEventListener('click', function() {
        const code = {
            html: htmlCode.value,
            css: cssCode.value,
            js: jsCode.value,
            python: pythonCode.value,
            timestamp: new Date().toLocaleString()
        };
        let savedCodes = JSON.parse(localStorage.getItem('savedCodes') || '[]');
        savedCodes.unshift(code);
        if (savedCodes.length > 10) savedCodes = savedCodes.slice(0, 10);
        localStorage.setItem('savedCodes', JSON.stringify(savedCodes));
        showMessage('Code saved successfully! ✅', 'success');
    });

    loadBtn.addEventListener('click', function() {
        const savedCodes = JSON.parse(localStorage.getItem('savedCodes') || '[]');
        if (savedCodes.length === 0) {
            showMessage('No saved codes found!', 'error');
            return;
        }
        const modal = createLoadModal(savedCodes);
        document.body.appendChild(modal);
    });

    clearConsoleBtn.addEventListener('click', function() {
        consoleOutput.innerHTML = '';
    });

    function checkLessonCode() {
        const lessonCodeData = localStorage.getItem('compilerLessonCode');
        if (lessonCodeData) {
            try {
                const data = JSON.parse(lessonCodeData);
                switch(data.language.toLowerCase()) {
                    case 'html': htmlCode.value = data.code; currentTab = 'html'; break;
                    case 'css': 
                        cssCode.value = data.code; currentTab = 'css';
                        activateTab('css');
                        break;
                    case 'javascript':
                    case 'js': 
                        jsCode.value = data.code; currentTab = 'js';
                        activateTab('js');
                        break;
                    case 'python': 
                        pythonCode.value = data.code; currentTab = 'python';
                        activateTab('python');
                        break;
                }
                localStorage.removeItem('compilerLessonCode');
                showMessage(`Code loaded from lesson (${data.language})! 🎓`, 'success');
                setTimeout(() => updateOutput(), 500);
            } catch (error) {
                console.error('Error loading lesson code:', error);
            }
        }
    }

    function activateTab(tabName) {
        tabs.forEach(t => t.classList.remove('active'));
        editorSections.forEach(s => s.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-editor`).classList.add('active');
    }

    function updateOutput() {
        consoleOutput.innerHTML = '';
        if (currentTab === 'python') {
            runPythonCode();
        } else {
            runWebCode();
        }
    }

    function runPythonCode() {
        // Safely check if Skulpt is loaded
        if (typeof Sk === 'undefined') {
            const errorEntry = document.createElement('div');
            errorEntry.className = 'console-error';
            errorEntry.textContent = '[ERROR] Skulpt failed to load. Python execution unavailable.';
            consoleOutput.appendChild(errorEntry);
            return;
        }

        const code = pythonCode.value;
        const iframe = outputFrame.contentDocument || outputFrame.contentWindow.document;
        iframe.open();
        iframe.write('<html><body style="font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4;"><h3 style="color: #4CAF50;">Python Output:</h3><pre id="python-output"></pre></body></html>');
        iframe.close();

        Sk.configure({
            output: function(text) {
                const logEntry = document.createElement('div');
                logEntry.className = 'console-log';
                logEntry.textContent = text;
                consoleOutput.appendChild(logEntry);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;

                const pythonOutput = iframe.getElementById('python-output');
                if (pythonOutput) pythonOutput.textContent += text;
            },
            read: function(filename) {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][filename] === undefined)
                    throw "File not found: '" + filename + "'";
                return Sk.builtinFiles["files"][filename];
            },
            __future__: Sk.python3
        });

        try {
            const myPromise = Sk.misceval.asyncToPromise(function() {
                return Sk.importMainWithBody("<stdin>", false, code, true);
            });
            myPromise.then(
                function(mod) {
                    if (consoleOutput.innerHTML.trim() === '') {
                        const logEntry2 = document.createElement('div');
                        logEntry2.className = 'console-log';
                        logEntry2.textContent = '[LOG] Code executed successfully (no output)';
                        consoleOutput.appendChild(logEntry2);
                    }
                },
                function(err) {
                    const errorEntry = document.createElement('div');
                    errorEntry.className = 'console-error';
                    errorEntry.textContent = `[ERROR] ${err.toString()}`;
                    consoleOutput.appendChild(errorEntry);
                    consoleOutput.scrollTop = consoleOutput.scrollHeight;
                }
            );
        } catch (err) {
            const errorEntry = document.createElement('div');
            errorEntry.className = 'console-error';
            errorEntry.textContent = `[ERROR] ${err.toString()}`;
            consoleOutput.appendChild(errorEntry);
        }
    }

    function runWebCode() {
        const html = htmlCode.value;
        const css = `<style>${cssCode.value}</style>`;
        const js = jsCode.value;

        const iframeContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                ${css}
            </head>
            <body>
                ${html}
                <script>
                    (function() {
                        const originalLog = console.log;
                        const originalError = console.error;
                        const originalWarn = console.warn;
                        
                        console.log = function(...args) {
                            originalLog.apply(console, args);
                            window.parent.postMessage({
                                type: 'log',
                                message: args.map(arg => 
                                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                                ).join(' ')
                            }, '*');
                        };
                        
                        console.error = function(...args) {
                            originalError.apply(console, args);
                            window.parent.postMessage({
                                type: 'error',
                                message: args.map(arg => String(arg)).join(' ')
                            }, '*');
                        };
                        
                        console.warn = function(...args) {
                            originalWarn.apply(console, args);
                            window.parent.postMessage({
                                type: 'warn',
                                message: args.map(arg => String(arg)).join(' ')
                            }, '*');
                        };
                        
                        window.addEventListener('error', function(e) {
                            window.parent.postMessage({
                                type: 'error',
                                message: e.message + ' (Line: ' + e.lineno + ')'
                            }, '*');
                        });
                    })();

                    try {
                        ${js}
                    } catch(e) {
                        console.error('JavaScript Error: ' + e.message);
                    }
                <\/script>
            </body>
            </html>
        `;

        const iframe = outputFrame.contentDocument || outputFrame.contentWindow.document;
        iframe.open();
        iframe.write(iframeContent);
        iframe.close();
    }

    window.addEventListener('message', function(e) {
        if (e.data && e.data.type) {
            const logEntry = document.createElement('div');
            logEntry.className = `console-${e.data.type}`;
            logEntry.textContent = `[${e.data.type.toUpperCase()}] ${e.data.message}`;
            consoleOutput.appendChild(logEntry);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    });

    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    function createLoadModal(savedCodes) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        let html = '<h2 style="margin-bottom: 20px; color: #333;">📂 Saved Codes</h2>';
        savedCodes.forEach((code, index) => {
            html += `
                <div style="
                    padding: 15px;
                    margin-bottom: 15px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " 
                onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.2)'"
                onmouseout="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'"
                onclick="window.loadSavedCode(${index})">
                    <div style="font-weight: 600; color: #495057; margin-bottom: 5px;">Save #${index + 1}</div>
                    <div style="font-size: 0.9em; color: #6c757d;">${code.timestamp}</div>
                    <div style="font-size: 0.85em; color: #adb5bd; margin-top: 5px;">Click to load</div>
                </div>
            `;
        });
        html += `<button onclick="this.closest('[style*=fixed]').remove()" style="width: 100%; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 8px; font-size: 1em; cursor: pointer; margin-top: 10px;">Close</button>`;
        content.innerHTML = html;
        modal.appendChild(content);
        window.loadSavedCode = function(index) {
            const code = savedCodes[index];
            htmlCode.value = code.html;
            cssCode.value = code.css;
            jsCode.value = code.js;
            if (code.python) pythonCode.value = code.python;
            updateOutput();
            modal.remove();
            showMessage('Code loaded successfully! ✅', 'success');
        };
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
        return modal;
    }

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            updateOutput();
        }
    });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    document.head.appendChild(style);

    updateOutput();
});
// ===== END OF JAVASCRIPT =====