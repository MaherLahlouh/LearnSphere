class MobileGestures {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.init();
    }

    init() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.setupSwipeGestures();
            this.setupTouchFeedback();
        }
    }

    setupSwipeGestures() {
        let touchStartTime = 0;

        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
            touchStartTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            const touchDuration = Date.now() - touchStartTime;

            // Only process if touch was quick (< 300ms)
            if (touchDuration < 300) {
                this.handleSwipe();
            }
        }, { passive: true });
    }

    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Determine if horizontal or vertical swipe
        if (absDeltaX > absDeltaY && absDeltaX > this.minSwipeDistance) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        } else if (absDeltaY > absDeltaX && absDeltaY > this.minSwipeDistance) {
            // Vertical swipe
            if (deltaY > 0) {
                this.onSwipeDown();
            } else {
                this.onSwipeUp();
            }
        }
    }

    onSwipeLeft() {
        // Go forward or next lesson
        const nextBtn = document.querySelector('.next-btn, .next-question-btn, [aria-label*="next" i]');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
            this.showSwipeFeedback('Next');
        }
    }

    onSwipeRight() {
        // Go back or previous lesson
        const backBtn = document.querySelector('.back-btn, .prev-btn, .previous-btn, [aria-label*="back" i], [aria-label*="previous" i]');
        if (backBtn) {
            backBtn.click();
            this.showSwipeFeedback('Back');
        } else if (window.history.length > 1) {
            window.history.back();
            this.showSwipeFeedback('Back');
        }
    }

    onSwipeUp() {
        // Scroll to top or close modal
        const modals = document.querySelectorAll('.modal.show, .student-details-modal.show');
        if (modals.length > 0) {
            const closeBtn = modals[modals.length - 1].querySelector('.close-modal, [onclick*="remove"]');
            if (closeBtn) closeBtn.click();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    onSwipeDown() {
        // Scroll to bottom or refresh
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    showSwipeFeedback(direction) {
        if (window.toast) {
            window.toast.info(`Swiped ${direction}`, 'info', 1000);
        }
    }

    setupTouchFeedback() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('button, a, .nav-item, .lesson-item, .card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            }, { passive: true });

            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.opacity = '';
                }, 150);
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.style.opacity = '';
            }, { passive: true });
        });
    }
}

// Initialize mobile gestures
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    new MobileGestures();
}


