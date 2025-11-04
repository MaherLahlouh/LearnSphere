// Live Code Editor JavaScript with Python Support
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
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

    // Check if code was passed from lesson page
    checkLessonCode();

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            currentTab = tabName;
            
            // Remove active class from all tabs and sections
            tabs.forEach(t => t.classList.remove('active'));
            editorSections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(`${tabName}-editor`).classList.add('active');
            
            // Update output if Python
            if (tabName === 'python') {
                updateOutput();
            }
        });
    });

    // Auto-run on input with debounce
    [htmlCode, cssCode, jsCode].forEach(editor => {
        editor.addEventListener('input', function() {
            clearTimeout(autoRunTimeout);
            autoRunTimeout = setTimeout(() => {
                if (currentTab !== 'python') {
                    updateOutput();
                }
            }, 1000);
        });
    });

    // Python doesn't auto-run, only on manual run
    pythonCode.addEventListener('input', function() {
        // Python requires manual run
    });

    // Manual run button
    runBtn.addEventListener('click', updateOutput);

    // Refresh button
    refreshBtn.addEventListener('click', updateOutput);

    // Clear button
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all code?')) {
            htmlCode.value = '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>Start coding here...</p>\n</body>\n</html>';
            cssCode.value = 'body {\n    font-family: Arial, sans-serif;\n    margin: 20px;\n}\n\nh1 {\n    color: #333;\n}\n\np {\n    font-size: 16px;\n}';
            jsCode.value = '// Your JavaScript code here\nconsole.log("Hello from JavaScript!");';
            pythonCode.value = '# Python Code\nprint("Hello from Python!")\n\n# Your code here...';
            updateOutput();
        }
    });

    // Save code to localStorage
    saveBtn.addEventListener('click', function() {
        const code = {
            html: htmlCode.value,
            css: cssCode.value,
            js: jsCode.value,
            python: pythonCode.value,
            timestamp: new Date().toLocaleString()
        };
        
        // Get existing saved codes
        let savedCodes = JSON.parse(localStorage.getItem('savedCodes') || '[]');
        
        // Add new code
        savedCodes.unshift(code);
        
        // Keep only last 10 saves
        if (savedCodes.length > 10) {
            savedCodes = savedCodes.slice(0, 10);
        }
        
        localStorage.setItem('savedCodes', JSON.stringify(savedCodes));
        
        // Show success message
        showMessage('Code saved successfully! ✅', 'success');
    });

    // Load code from localStorage
    loadBtn.addEventListener('click', function() {
        const savedCodes = JSON.parse(localStorage.getItem('savedCodes') || '[]');
        
        if (savedCodes.length === 0) {
            showMessage('No saved codes found!', 'error');
            return;
        }
        
        // Create modal to show saved codes
        const modal = createLoadModal(savedCodes);
        document.body.appendChild(modal);
    });

    // Clear console
    clearConsoleBtn.addEventListener('click', function() {
        consoleOutput.innerHTML = '';
    });

    // Check for lesson code
    function checkLessonCode() {
        const lessonCodeData = localStorage.getItem('compilerLessonCode');
        
        if (lessonCodeData) {
            try {
                const data = JSON.parse(lessonCodeData);
                
                // Load code based on language
                switch(data.language.toLowerCase()) {
                    case 'html':
                        htmlCode.value = data.code;
                        currentTab = 'html';
                        break;
                    case 'css':
                        cssCode.value = data.code;
                        currentTab = 'css';
                        // Switch to CSS tab
                        tabs.forEach(t => t.classList.remove('active'));
                        editorSections.forEach(s => s.classList.remove('active'));
                        document.querySelector('[data-tab="css"]').classList.add('active');
                        document.getElementById('css-editor').classList.add('active');
                        break;
                    case 'javascript':
                    case 'js':
                        jsCode.value = data.code;
                        currentTab = 'js';
                        // Switch to JS tab
                        tabs.forEach(t => t.classList.remove('active'));
                        editorSections.forEach(s => s.classList.remove('active'));
                        document.querySelector('[data-tab="js"]').classList.add('active');
                        document.getElementById('js-editor').classList.add('active');
                        break;
                    case 'python':
                        pythonCode.value = data.code;
                        currentTab = 'python';
                        // Switch to Python tab
                        tabs.forEach(t => t.classList.remove('active'));
                        editorSections.forEach(s => s.classList.remove('active'));
                        document.querySelector('[data-tab="python"]').classList.add('active');
                        document.getElementById('python-editor').classList.add('active');
                        break;
                }
                
                // Clear the stored lesson code
                localStorage.removeItem('compilerLessonCode');
                
                // Show message
                showMessage(`Code loaded from lesson (${data.language})! 🎓`, 'success');
                
                // Run the code
                setTimeout(() => updateOutput(), 500);
                
            } catch (error) {
                console.error('Error loading lesson code:', error);
            }
        }
    }

    // Update output function
    function updateOutput() {
        consoleOutput.innerHTML = '';
        
        if (currentTab === 'python') {
            runPythonCode();
        } else {
            runWebCode();
        }
    }

    // Run Python code using Skulpt
    function runPythonCode() {
        const code = pythonCode.value;
        
        // Clear output frame for Python
        const iframe = outputFrame.contentDocument || outputFrame.contentWindow.document;
        iframe.open();
        iframe.write('<html><body style="font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4;"><h3 style="color: #4CAF50;">Python Output:</h3><pre id="python-output"></pre></body></html>');
        iframe.close();
        
        // Configure Skulpt
        Sk.configure({
            output: function(text) {
                // Output to console
                const logEntry = document.createElement('div');
                logEntry.className = 'console-log';
                logEntry.textContent = text;
                consoleOutput.appendChild(logEntry);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
                
                // Output to iframe
                const pythonOutput = iframe.getElementById('python-output');
                if (pythonOutput) {
                    pythonOutput.textContent += text;
                }
            },
            read: function(filename) {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][filename] === undefined) {
                    throw "File not found: '" + filename + "'";
                }
                return Sk.builtinFiles["files"][filename];
            },
            __future__: Sk.python3
        });
        
        // Run the code
        try {
            const myPromise = Sk.misceval.asyncToPromise(function() {
                return Sk.importMainWithBody("<stdin>", false, code, true);
            });
            
            myPromise.then(
                function(mod) {
                    // Success
                    if (consoleOutput.innerHTML.trim() === '') {
                        const logEntry = document.createElement('div');
                        logEntry.className = 'console-log';
                        logEntry.textContent = '[LOG] Code executed successfully (no output)';
                        consoleOutput.appendChild(logEntry);
                    }
                },
                function(err) {
                    // Error
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

    // Run HTML/CSS/JS code
    function runWebCode() {
        const html = htmlCode.value;
        const css = `<style>${cssCode.value}</style>`;
        const js = jsCode.value;
        
        // Create iframe content with console capture
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
                    // Capture console.log
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
                        
                        // Capture errors
                        window.addEventListener('error', function(e) {
                            window.parent.postMessage({
                                type: 'error',
                                message: e.message + ' (Line: ' + e.lineno + ')'
                            }, '*');
                        });
                    })();
                    
                    // User code
                    try {
                        ${js}
                    } catch(e) {
                        console.error('JavaScript Error: ' + e.message);
                    }
                <\/script>
            </body>
            </html>
        `;
        
        // Write to iframe
        const iframe = outputFrame.contentDocument || outputFrame.contentWindow.document;
        iframe.open();
        iframe.write(iframeContent);
        iframe.close();
    }

    // Listen for console messages from iframe
    window.addEventListener('message', function(e) {
        if (e.data && e.data.type) {
            const logEntry = document.createElement('div');
            logEntry.className = `console-${e.data.type}`;
            logEntry.textContent = `[${e.data.type.toUpperCase()}] ${e.data.message}`;
            consoleOutput.appendChild(logEntry);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    });

    // Helper function to show messages
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

    // Create load modal
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
                    <div style="font-weight: 600; color: #495057; margin-bottom: 5px;">
                        Save #${index + 1}
                    </div>
                    <div style="font-size: 0.9em; color: #6c757d;">
                        ${code.timestamp}
                    </div>
                    <div style="font-size: 0.85em; color: #adb5bd; margin-top: 5px;">
                        Click to load
                    </div>
                </div>
            `;
        });
        
        html += `
            <button onclick="this.closest('[style*=fixed]').remove()" style="
                width: 100%;
                padding: 12px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1em;
                cursor: pointer;
                margin-top: 10px;
            ">Close</button>
        `;
        
        content.innerHTML = html;
        modal.appendChild(content);
        
        // Make loadSavedCode globally accessible
        window.loadSavedCode = function(index) {
            const code = savedCodes[index];
            htmlCode.value = code.html;
            cssCode.value = code.css;
            jsCode.value = code.js;
            if (code.python) {
                pythonCode.value = code.python;
            }
            updateOutput();
            modal.remove();
            showMessage('Code loaded successfully! ✅', 'success');
        };
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
        }
        
        // Ctrl/Cmd + Enter to run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            updateOutput();
        }
    });

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Initial run
    updateOutput();
});