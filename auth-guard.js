// auth-guard.js
// Include this in all secondary pages (pricing, about, etc.) to enforce login

(function() {
    function checkAuth() {
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
        }
    }

    // Run immediately
    checkAuth();
})();
