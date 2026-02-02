

class Analytics {
    constructor() {
        // Set your Google Analytics ID here (format: G-XXXXXXXXXX)
        // To get your ID: https://analytics.google.com/
        this.gaId = null; // Example: 'G-XXXXXXXXXX'
        this.events = [];
        this.performanceMetrics = {};
        this.init();
    }

    init() {
        // Initialize Google Analytics if ID is provided
        if (this.gaId) {
            this.initGoogleAnalytics();
        }

        // Track page views
        this.trackPageView();

        // Track performance
        this.trackPerformance();

        // Track errors
        this.trackErrors();

        // Track user interactions
        this.trackInteractions();
    }

    initGoogleAnalytics() {
        // Google Analytics 4 (gtag.js)
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
        document.head.appendChild(script1);

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', this.gaId, {
            page_path: window.location.pathname
        });
        window.gtag = gtag;
    }

    trackPageView(page = null) {
        const pageData = {
            page: page || window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString()
        };

        this.events.push({
            type: 'pageview',
            ...pageData
        });

        if (window.gtag) {
            gtag('event', 'page_view', {
                page_path: pageData.page,
                page_title: pageData.title
            });
        }

        console.log('📊 Page View:', pageData);
    }

    trackEvent(category, action, label = '', value = null) {
        const eventData = {
            category,
            action,
            label,
            value,
            timestamp: new Date().toISOString()
        };

        this.events.push({
            type: 'event',
            ...eventData
        });

        if (window.gtag) {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }

        console.log('📊 Event:', eventData);
    }

    trackConversion(conversionType, value = null) {
        this.trackEvent('conversion', conversionType, '', value);

        if (window.gtag) {
            gtag('event', 'conversion', {
                send_to: `${this.gaId}/${conversionType}`,
                value: value,
                currency: 'USD'
            });
        }
    }

    trackPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.timing;
                    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                    const connectTime = perfData.responseEnd - perfData.requestStart;

                    this.performanceMetrics = {
                        pageLoadTime,
                        domReadyTime,
                        connectTime,
                        timestamp: new Date().toISOString()
                    };

                    this.trackEvent('performance', 'page_load', '', Math.round(pageLoadTime));

                    // Track Core Web Vitals if available
                    if ('PerformanceObserver' in window) {
                        this.trackWebVitals();
                    }
                }, 0);
            });
        }
    }

    trackWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.trackEvent('performance', 'LCP', '', Math.round(lastEntry.renderTime || lastEntry.loadTime));
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.trackEvent('performance', 'FID', '', Math.round(entry.processingStart - entry.startTime));
            });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.trackEvent('performance', 'CLS', '', Math.round(clsValue * 1000) / 1000);
        }).observe({ entryTypes: ['layout-shift'] });
    }

    trackErrors() {
        window.addEventListener('error', (event) => {
            this.trackEvent('error', 'javascript_error', event.message, null);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('error', 'unhandled_promise_rejection', event.reason, null);
        });
    }

    trackInteractions() {
        // Track button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, a, [role="button"]');
            if (button) {
                const buttonText = button.textContent.trim() || button.getAttribute('aria-label') || 'Unknown';
                this.trackEvent('interaction', 'click', buttonText);
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.trackEvent('interaction', 'form_submit', form.id || 'form');
            }
        });
    }

    // Specific tracking methods
    trackLogin(method = 'email') {
        this.trackEvent('authentication', 'login', method);
        this.trackConversion('login');
    }

    trackSignup(method = 'email') {
        this.trackEvent('authentication', 'signup', method);
        this.trackConversion('signup');
    }

    trackLessonStart(lessonId, lessonTitle) {
        this.trackEvent('lesson', 'start', lessonTitle, lessonId);
    }

    trackLessonComplete(lessonId, lessonTitle, score = null) {
        this.trackEvent('lesson', 'complete', lessonTitle, lessonId);
        if (score !== null) {
            this.trackEvent('quiz', 'score', lessonTitle, score);
        }
    }

    trackQuizAnswer(lessonId, isCorrect) {
        this.trackEvent('quiz', isCorrect ? 'correct_answer' : 'wrong_answer', lessonId);
    }

    trackCodeExecution(language) {
        this.trackEvent('code', 'execute', language);
    }

    trackExport(type) {
        this.trackEvent('export', 'download', type);
    }

    getEvents() {
        return this.events;
    }

    getPerformanceMetrics() {
        return this.performanceMetrics;
    }

    clearEvents() {
        this.events = [];
    }
}

// Initialize analytics
const analytics = new Analytics();
window.analytics = analytics;

// Make tracking methods globally available
window.trackEvent = (category, action, label, value) => analytics.trackEvent(category, action, label, value);
window.trackConversion = (type, value) => analytics.trackConversion(type, value);

