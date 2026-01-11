// auth-guard.js
// Include this in all secondary pages (pricing, about, etc.) to enforce login

(function() {
    function checkAuth() {
        // ALLOW OAUTH REDIRECTS: 
        // 1. Hash Fragment (Implicit Flow) - access_token, refresh_token
        if (window.location.hash && 
           (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'))) {
            return;
        }
        // 2. Query Params (PKCE Flow) - code
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
            return;
        }

        // 1. Check LocalStorage
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // 2. Check Supabase Session (if client available)
        // If strict sync is needed, we might rely on localStorage for speed 
        // to avoid FOUC, then verify with Supabase async.
        
        if (!user) {
            console.log("No user found in localStorage. Checking Supabase session...");
            // Instead of immediate redirect, allow a short grace period for Supabase to restore session
            // if we are on a page that loads supabase-client.js
            
            // Set a timeout to redirect if Supabase doesn't verify quickly
            setTimeout(() => {
                const userCheck = JSON.parse(localStorage.getItem('currentUser'));
                if (!userCheck) {
                     window.location.replace('index.html?auth=forced');
                } else {
                     document.body.style.display = 'block';
                }
            }, 2000); // 2 second grace period
        } else {
            // User exists, show body if hidden
            document.body.style.display = 'block';
        }
    }

    // Run immediately
    checkAuth();
})();
