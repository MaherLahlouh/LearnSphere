class Accessibility {
    constructor() {
        this.init();
    }

    init() {
        this.addARIALabels();
        this.improveFocusIndicators();
        this.addSkipLinks();
        this.setupKeyboardNavigation();
        this.announcePageChanges();
    }

    addARIALabels() {
        // Add ARIA labels to buttons without text
        document.querySelectorAll('button:not([aria-label]):empty, button:not([aria-label]) i').forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                const iconClass = icon.className;
                let label = 'Button';
                
                if (iconClass.includes('fa-home')) label = 'Home';
                else if (iconClass.includes('fa-users')) label = 'Students';
                else if (iconClass.includes('fa-book')) label = 'Courses';
                else if (iconClass.includes('fa-calendar')) label = 'Schedule';
                else if (iconClass.includes('fa-cog')) label = 'Settings';
                else if (iconClass.includes('fa-sign-out')) label = 'Logout';
                else if (iconClass.includes('fa-sync')) label = 'Refresh';
                else if (iconClass.includes('fa-download')) label = 'Download';
                else if (iconClass.includes('fa-chart')) label = 'Analytics';
                else if (iconClass.includes('fa-filter')) label = 'Filter';
                else if (iconClass.includes('fa-bell')) label = 'Notifications';
                else if (iconClass.includes('fa-eye')) label = 'View Details';
                else if (iconClass.includes('fa-times')) label = 'Close';
                else if (iconClass.includes('fa-arrow-left')) label = 'Go Back';
                else if (iconClass.includes('fa-check')) label = 'Check Answer';
                else if (iconClass.includes('fa-arrow-right')) label = 'Next';
                
                button.setAttribute('aria-label', label);
            }
        });

        // Add ARIA labels to form inputs
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach(input => {
            if (!input.getAttribute('aria-label') && !input.id) {
                const placeholder = input.getAttribute('placeholder');
                if (placeholder) {
                    input.setAttribute('aria-label', placeholder);
                }
            }
        });

        // Add role attributes
        document.querySelectorAll('.nav-item').forEach(item => {
            item.setAttribute('role', 'menuitem');
        });

        // Add landmark roles
        const main = document.querySelector('main, .main-content');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }

        const nav = document.querySelector('nav, .sidebar, .nav-links');
        if (nav && !nav.getAttribute('role')) {
            nav.setAttribute('role', 'navigation');
        }
    }

    improveFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            *:focus-visible {
                outline: 3px solid #115879 !important;
                outline-offset: 2px !important;
                border-radius: 4px;
            }
            
            button:focus-visible,
            a:focus-visible,
            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
                outline: 3px solid #fcd40a !important;
                outline-offset: 2px !important;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: #115879;
                color: white;
                padding: 8px 16px;
                text-decoration: none;
                z-index: 10000;
                border-radius: 0 0 4px 0;
            }
            
            .skip-link:focus {
                top: 0;
            }
        `;
        document.head.appendChild(style);
    }

    addSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Ensure main content has ID
        const main = document.querySelector('main, .main-content');
        if (main && !main.id) {
            main.id = 'main-content';
        }
    }

    setupKeyboardNavigation() {
        // Improve tab navigation
        document.addEventListener('keydown', (e) => {
            // Tab navigation improvements
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Remove keyboard navigation class on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    announcePageChanges() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(liveRegion);

        window.announceToScreenReader = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };
    }
}

// Initialize accessibility on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Accessibility();
    });
} else {
    new Accessibility();
}


