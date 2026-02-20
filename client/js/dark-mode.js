class DarkMode {
    constructor() {
        this.storageKey = 'darkMode';
        this.isDark = false;
        this.init();
    }

    init() {
        // Check for saved preference or system preference
        const saved = localStorage.getItem(this.storageKey);
        if (saved !== null) {
            this.isDark = saved === 'true';
        } else {
            // Check system preference
            this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        this.applyTheme();
        this.setupSystemPreferenceListener();
    }

    setupSystemPreferenceListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem(this.storageKey) === null) {
                this.isDark = e.matches;
                this.applyTheme();
            }
        });
    }

    toggle() {
        this.isDark = !this.isDark;
        localStorage.setItem(this.storageKey, this.isDark.toString());
        this.applyTheme();
        
        window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDark: this.isDark } }));
        
        return this.isDark;
    }

    set(isDark) {
        this.isDark = isDark;
        localStorage.setItem(this.storageKey, this.isDark.toString());
        this.applyTheme();
    }

    // Add or remove .dark-mode so CSS can style the page
    applyTheme() {
        if (this.isDark) {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
        }
    }

    isEnabled() {
        return this.isDark;
    }
}

// One global instance - other scripts can call window.darkMode.toggle()
const darkMode = new DarkMode();
window.darkMode = darkMode;


