// shared-components.js
// This file provides consistent header and footer across all pages

function handleGetStarted() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.onboarded) {
        window.location.href = 'dashboard.html';
    } else if (user && user.loggedIn) {
        window.location.href = 'onboarding.html';
    } else {
        window.location.href = 'login.html';
    }
}

function createHeader(activePage = 'home') {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const isLoggedIn = user && user.loggedIn;
    const userName = isLoggedIn ? (user.name || user.email.split('@')[0]) : null;
    
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
        <nav class="nav-glass">
            <div class="logo"><a href="index.html">AkubrecaH</a></div>
            <div class="nav-links">
                <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a>
                <a href="pricing.html" class="nav-link ${activePage === 'pricing' ? 'active' : ''}">Pricing</a>
                <a href="about.html" class="nav-link ${activePage === 'about' ? 'active' : ''}">About</a>
                <a href="contact.html" class="nav-link ${activePage === 'contact' ? 'active' : ''}">Contact</a>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
                ${isLoggedIn 
                    ? `<a href="dashboard.html" class="nav-link">${userName}</a>`
                    : `<a href="login.html" class="nav-link">Login</a>`
                }
                <button class="btn-primary" onclick="handleGetStarted()">Get Started</button>
            </div>
        </nav>
    `;
    return header;
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'fat-footer';
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-cta">
                <h2>Ready to <br>Get Started?</h2>
                <a href="javascript:handleGetStarted()" class="footer-btn">Launch App</a>
            </div>
            <div class="footer-links">
                <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <strong>Product</strong>
                    <a href="pricing.html" class="footer-link">Pricing</a>
                    <a href="about.html" class="footer-link">About</a>
                </div>
                <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <strong>Company</strong>
                    <a href="about.html" class="footer-link">About Us</a>
                    <a href="contact.html" class="footer-link">Contact</a>
                </div>
            </div>
        </div>
        <div class="copyright">
            &copy; 2026 Akubrecah Technologies.
        </div>
    `;
    return footer;
}

// Initialize page with consistent header/footer
function initPage(activePage) {
    // Insert header at start of body
    const existingHeader = document.querySelector('.site-header');
    if (existingHeader) existingHeader.remove();
    document.body.insertBefore(createHeader(activePage), document.body.firstChild);
    
    // Insert footer before closing body
    const existingFooter = document.querySelector('.fat-footer');
    if (existingFooter) existingFooter.remove();
    document.body.appendChild(createFooter());
    
    // Initialize icons
    if (window.lucide) lucide.createIcons();
}

// Expose functions globally
window.handleGetStarted = handleGetStarted;
window.initPage = initPage;
