// Get saved language from localStorage or default to 'en'
let currentLang = localStorage.getItem('userLanguage') || 'en';
let translations = {};

/**
 * @param {string} lang - Language code (en/ar)
 */
async function loadTranslations(lang) {
    try {
        const response = await fetch(`../../lang/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}
//Apply translations to all elements with IDs
function applyTranslations() {
    // Page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && translations.title) {
        pageTitle.textContent = translations.title;
    }

    // Hero section
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && translations.hero_title) {
        heroTitle.innerHTML = translations.hero_title;
    }

    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroSubtitle && translations.hero_subtitle) {
        heroSubtitle.textContent = translations.hero_subtitle;
    }

    const heroBadge = document.getElementById('hero-badge');
    if (heroBadge && translations.hero_badge) {
        heroBadge.textContent = translations.hero_badge;
    }

    // Hero features
    const heroFeatures = document.getElementById('hero-features');
    if (heroFeatures && translations.feature1 && translations.feature2 && translations.feature3) {
        heroFeatures.innerHTML = `
            <li>${translations.feature1}</li>
            <li>${translations.feature2}</li>
            <li>${translations.feature3}</li>
        `;
    }

    // Footer
    const footerTagline = document.getElementById('footer-tagline');
    if (footerTagline && translations.footer_tagline) {
        footerTagline.textContent = translations.footer_tagline;
    }

    // Useful links
    const usefulLinksTitle = document.getElementById('useful-links');
    if (usefulLinksTitle && translations.useful_links) {
        usefulLinksTitle.textContent = translations.useful_links;
    }

    const usefulLinksList = document.getElementById('useful-links-list');
    if (usefulLinksList && translations.link_levels && translations.link_school_copy && 
        translations.link_terms && translations.link_privacy && translations.link_privacy_policy) {
        usefulLinksList.innerHTML = `
            <a href="#">${translations.link_levels}</a>
            <a href="#">${translations.link_school_copy}</a>
            <a href="#">${translations.link_terms}</a>
            <a href="#">${translations.link_privacy}</a>
            <a href="#">${translations.link_privacy_policy}</a>
        `;
    }

    // Contact section
    const contactUs = document.getElementById('contact-us');
    if (contactUs && translations.contact_us) {
        contactUs.textContent = translations.contact_us;
    }

    const address = document.getElementById('address');
    if (address && translations.address) {
        address.textContent = translations.address;
    }

    // Newsletter
    const newsletter = document.getElementById('newsletter');
    if (newsletter && translations.newsletter) {
        newsletter.textContent = translations.newsletter;
    }

    const subscribeText = document.getElementById('subscribe-text');
    if (subscribeText && translations.subscribe_text) {
        subscribeText.textContent = translations.subscribe_text;
    }

    const newsletterInput = document.getElementById('newsletter-input');
    if (newsletterInput && translations.newsletter_placeholder) {
        newsletterInput.placeholder = translations.newsletter_placeholder;
    }

    const newsletterBtn = document.getElementById('newsletter-btn');
    if (newsletterBtn && translations.newsletter_button) {
        newsletterBtn.textContent = translations.newsletter_button;
    }

    // Header buttons
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn && translations.login) {
        loginBtn.textContent = translations.login;
    }

    const langBtn = document.getElementById('lang-btn');
    if (langBtn && translations.lang_btn) {
        langBtn.textContent = translations.lang_btn;
    }

    // Update page direction based on language
    if (currentLang === 'ar') {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }
}
//Initialize the page on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Load translations
    loadTranslations(currentLang);

    // Language toggle button
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ar' : 'en';
            localStorage.setItem('userLanguage', currentLang);
            loadTranslations(currentLang);
        });
    }

    // Newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-input');
            if (emailInput && emailInput.value) {
                // TODO: Implement actual newsletter subscription
                alert('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            }
        });
    }

    // Play button interaction
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            // TODO: Implement actual play functionality
            console.log('Play button clicked');
        });
    }
});