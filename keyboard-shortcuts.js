
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.registerDefaultShortcuts();
    }

    register(key, callback, description = '') {
        this.shortcuts.set(key, { callback, description });
    }

    unregister(key) {
        this.shortcuts.delete(key);
    }

    handleKeyPress(event) {
        if (!this.enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = event.target;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.isContentEditable) {
            return;
        }

        const key = this.getKeyString(event);
        const shortcut = this.shortcuts.get(key);

        if (shortcut) {
            event.preventDefault();
            shortcut.callback(event);
        }
    }

    getKeyString(event) {
        const parts = [];
        if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        parts.push(event.key);
        return parts.join('+');
    }

    registerDefaultShortcuts() {
        // Navigation shortcuts
        this.register('Ctrl+Home', () => {
            if (window.location.pathname.includes('dashboard')) return;
            window.location.href = './dashboard.html';
        }, 'Go to Dashboard');

        this.register('Ctrl+ArrowLeft', () => {
            if (window.history.length > 1) {
                window.history.back();
            }
        }, 'Go Back');

        this.register('Ctrl+ArrowRight', () => {
            window.history.forward();
        }, 'Go Forward');

        // Search shortcut
        this.register('Ctrl+k', (e) => {
            const searchInput = document.querySelector('input[type="search"], #search-input, input[placeholder*="Search"]');
            if (searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }, 'Focus Search');

        // Escape to close modals
        this.register('Escape', () => {
            const modals = document.querySelectorAll('.modal.show, .student-details-modal.show, .analytics-modal, .notifications-modal');
            modals.forEach(modal => {
                const closeBtn = modal.querySelector('.close-modal, [onclick*="remove"]');
                if (closeBtn) closeBtn.click();
            });
        }, 'Close Modal');

        // Help shortcut
        this.register('Ctrl+?', () => {
            this.showShortcutsHelp();
        }, 'Show Keyboard Shortcuts');
    }

    showShortcutsHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'shortcuts-help-modal';
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        const shortcutsList = Array.from(this.shortcuts.entries())
            .map(([key, { description }]) => `
                <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #64748b;">${description || 'Shortcut'}</span>
                    <kbd style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #115879;">${key}</kbd>
                </div>
            `).join('');

        helpModal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; position: relative;">
                <button onclick="this.closest('.shortcuts-help-modal').remove()" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 24px; cursor: pointer; color: #64748b;">&times;</button>
                <h2 style="color: #115879; margin-bottom: 24px; font-size: 24px;">⌨️ Keyboard Shortcuts</h2>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${shortcutsList}
                </div>
                <button onclick="this.closest('.shortcuts-help-modal').remove()" style="width: 100%; margin-top: 24px; padding: 12px; background: #115879; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Close</button>
            </div>
        `;

        document.body.appendChild(helpModal);
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.remove();
        });
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

// Initialize keyboard shortcuts
const keyboardShortcuts = new KeyboardShortcuts();
window.keyboardShortcuts = keyboardShortcuts;


