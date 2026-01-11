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
    
    const homeLink = isLoggedIn ? 'dashboard.html' : 'index.html';
    const homeText = isLoggedIn ? 'Dashboard' : 'Home';
    
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
        <nav class="nav-glass">
            <div class="logo"><a href="${homeLink}">AkubrecaH</a></div>
            <div class="nav-links">
                <a href="${homeLink}" class="nav-link ${activePage === 'home' ? 'active' : ''}">${homeText}</a>
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

function createAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'modal auth-modal'; // Add specific class
    modal.style.display = 'none';

    modal.innerHTML = `
        <div class="modal-content auth-content">
            <div class="auth-header">
                <h2 id="authTitle">Welcome Back</h2>
                <span class="close-modal" onclick="closeAuth()">&times;</span>
            </div>
            
            <div class="auth-tabs">
                <button id="tabLogin" class="auth-tab active" onclick="switchAuthMode('login')">Login</button>
                <button id="tabRegister" class="auth-tab" onclick="switchAuthMode('register')">Register</button>
            </div>

            <form id="authForm" class="auth-form" data-mode="login">
                <div class="form-group">
                    <label>Email Address</label>
                    <div class="input-icon-wrapper">
                        <i data-lucide="mail"></i>
                        <input type="email" id="authEmail" required placeholder="you@company.com">
                    </div>
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <div class="input-icon-wrapper">
                        <i data-lucide="lock"></i>
                        <input type="password" id="authPassword" required placeholder="••••••••">
                    </div>
                </div>

                <div class="form-group" id="roleSelectGroup" style="display: none;">
                    <label>Account Type</label>
                    <div class="input-icon-wrapper">
                        <i data-lucide="user"></i>
                        <select id="authRole">
                            <option value="personal">Personal User (Pay-per-use)</option>
                            <option value="cyber">Cyber Cafe / Business</option>
                        </select>
                    </div>
                </div>

                <button type="submit" id="authSubmitBtn" class="btn-primary full-width">Login</button>
            
                <div class="auth-divider">
                    <span>Or continue with</span>
                </div>

                <button type="button" class="btn-google full-width" onclick="window.googleLogin()">
                   <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.799 L -6.714 42.339 C -8.804 40.389 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                   Sign in with Google
                </button>
            </form>
        </div>
    `;
    
    return modal;
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
window.createAuthModal = createAuthModal;
