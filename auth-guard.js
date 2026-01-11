// auth-guard.js
// Include this in all secondary pages (pricing, about, etc.) to enforce login

(function() {
    function checkAuth() {
        // ALLOW OAUTH REDIRECTS: If URL has access_token, let the page load (auth.js will handle it)
        if (window.location.hash && 
           (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'))) {
            return;
        }

        // 1. Check LocalStorage
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // 2. Check Supabase Session (if client available)
        // If strict sync is needed, we might rely on localStorage for speed 
        // to avoid FOUC, then verify with Supabase async.
        
        if (!user) {
            console.log("No user found. Redirecting to login...");
            // Redirect to index with a flag to open auth
            // Use replace to prevent back-button looping
            window.location.replace('index.html?auth=forced');
        } else {
            // User exists, show body if hidden
            document.body.style.display = 'block';
        }
    }

    // Run immediately
    checkAuth();
})();
