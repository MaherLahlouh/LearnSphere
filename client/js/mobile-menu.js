class MobileMenu {
    constructor() {
        this.menuOpen = false;
        this.init();
    }

    init() {
        this.createMobileMenu();
        this.setupEventListeners();
    }

    createMobileMenu() {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const navLinks = document.querySelector('.nav-links');
            
            if (sidebar && !document.getElementById('mobile-menu-toggle')) {
                const hamburger = document.createElement('button');
                hamburger.id = 'mobile-menu-toggle';
                hamburger.className = 'mobile-menu-toggle';
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
                hamburger.setAttribute('aria-label', 'Toggle menu');
                hamburger.setAttribute('aria-expanded', 'false');
                
                sidebar.parentNode.insertBefore(hamburger, sidebar);
                
                const overlay = document.createElement('div');
                overlay.className = 'mobile-menu-overlay';
                overlay.id = 'mobile-menu-overlay';
                document.body.appendChild(overlay);
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-menu-close';
                closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                closeBtn.setAttribute('aria-label', 'Close menu');
                sidebar.insertBefore(closeBtn, sidebar.firstChild);
            }
        }
    }

    setupEventListeners() {
        const toggle = document.getElementById('mobile-menu-toggle');
        const overlay = document.getElementById('mobile-menu-overlay');
        const sidebar = document.querySelector('.sidebar');
        const closeBtn = document.querySelector('.mobile-menu-close');
        
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleMenu());
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => this.closeMenu());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMenu());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menuOpen) {
                this.closeMenu();
            }
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.menuOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-menu-overlay');
        const toggle = document.getElementById('mobile-menu-toggle');
        
        if (sidebar) {
            sidebar.classList.add('mobile-open');
            this.menuOpen = true;
        }
        
        if (overlay) {
            overlay.classList.add('active');
        }
        
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.innerHTML = '<i class="fas fa-times"></i>';
        }
        
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-menu-overlay');
        const toggle = document.getElementById('mobile-menu-toggle');
        
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            this.menuOpen = false;
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
        
        document.body.style.overflow = '';
    }
}

// Initialize mobile menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MobileMenu();
    });
} else {
    new MobileMenu();
}


