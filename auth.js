// auth.js
// Supabase Client Initialization
// TODO: Replace with actual keys from .env or User Input
const SUPABASE_URL = 'https://sjkodtxkhoukpxfljgit.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Zjju86j4BqwteaGGBrhv1Q_PdUetgSM';

// State Management
let currentUser = null;
let currentSubscription = null;

// --- Access Control & Initialization ---

async function checkAuthOnLoad() {
    // CRITICAL FIX: Move modals to body to escape any hidden parent containers
    const authModal = document.getElementById('authModal');
    const pricingModal = document.getElementById('pricingModal');
    
    if (authModal && authModal.parentElement !== document.body) {
        document.body.appendChild(authModal);
    }
    if (pricingModal && pricingModal.parentElement !== document.body) {
        document.body.appendChild(pricingModal);
    }
    
    // 1. Try local storage for immediate UI update (avoids flicker)
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUser = user;
        updateUI(); 
    }

    // 2. Verify with Supabase (Persistent Login)
    if (window.SupabaseClient) {
        try {
            const { data: { session } } = await window.SupabaseClient.auth.getSession();
            if (session && session.user) {
                // Determine role (default to previous or 'personal')
                const role = (currentUser && currentUser.role) ? currentUser.role : 
                             (session.user.user_metadata.role || 'personal');
                
                // Fetch full profile to be sure
                let profile;
                try {
                     profile = await window.SupabaseClient.profile.get(session.user.id);
                } catch(e) { console.warn("Could not fetch profile on init", e); }

                currentUser = { 
                    ...session.user, 
                    role: role,
                    ...profile
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUI();
            } else if (!user) {
                // No local user and no session -> ensure UI shows logged out
                updateUI();
            }
        } catch (error) {
            console.error("Session check failed:", error);
        }
    }

    // Always unhide body after checks are done (if hidden by auth-guard style)
    document.body.style.display = 'block';
}

// Global Auth Functions
window.openAuth = function(force = false) {
    const modal = document.getElementById('authModal');
    if (!modal) {
        console.warn('Auth modal not found in DOM.');
        return;
    }
    
    if (currentUser && !force) {
        // Logout confirm
        Swal.fire({
            title: 'Logout?',
            text: "You will be signed out.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Logout'
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
            }
        });
        return;
    }

    if (force) {
        modal.classList.add('modal-unclosable');
        document.body.classList.add('auth-active-blur');
        
        window.onclick = function(event) {
            if (event.target == modal && modal.classList.contains('modal-unclosable')) {
                return;
            }
             if (event.target == document.getElementById('certModal')) {
                document.getElementById('certModal').style.display = 'none';
            }
             if (event.target == document.getElementById('pricingModal')) {
                 document.getElementById('pricingModal').style.display = 'none';
            }
        }
    } else {
        modal.classList.remove('modal-unclosable');
        document.body.classList.remove('auth-active-blur');
        
        window.onclick = function(event) {
            if (event.target == modal) {
                closeAuth();
            }
             if (event.target == document.getElementById('certModal')) {
                document.getElementById('certModal').style.display = 'none';
            }
             if (event.target == document.getElementById('pricingModal')) {
                 document.getElementById('pricingModal').style.display = 'none';
            }
        }
    }
    modal.style.display = 'block';
    
    // Hide 'Cancel' button if forced
    const cancelBtn = modal.querySelector('.btn-secondary'); 
    if(cancelBtn) {
        cancelBtn.style.display = force ? 'none' : 'block';
    }
    
    // Make modal active for new style
    if (modal.classList.contains('auth-modal')) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

window.closeAuth = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        if (!modal.classList.contains('modal-unclosable')) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            document.body.classList.remove('auth-active-blur');
            document.body.style.overflow = '';
        }
    }
}

function openPricing() {
    const pricingModal = document.getElementById('pricingModal');
    if (pricingModal) pricingModal.style.display = 'block';
}

function switchAuthMode(mode) {
    const title = document.getElementById('authTitle');
    const roleGroup = document.getElementById('roleSelectGroup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const authForm = document.getElementById('authForm');

    if (title && roleGroup && submitBtn && tabLogin && tabRegister && authForm) {
        if (mode === 'register') {
            title.textContent = 'Create Account';
            roleGroup.style.display = 'block';
            submitBtn.textContent = 'Register & Start';
            tabLogin.classList.remove('active');
            tabRegister.classList.add('active');
            authForm.dataset.mode = 'register';
        } else {
            title.textContent = 'Welcome Back';
            roleGroup.style.display = 'none';
            submitBtn.textContent = 'Login';
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            authForm.dataset.mode = 'login';
        }
    }
}
window.switchAuthMode = switchAuthMode;


// Initialize on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    // FIRST: Check for OAuth redirect with access_token in URL hash
    if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('[Auth] OAuth redirect detected, parsing token from URL hash...');
        
        const cleanPath = window.location.pathname + window.location.search;
        history.replaceState(null, '', cleanPath);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const sessionResult = await window.SupabaseClient.auth.getSession();
            const session = sessionResult?.session || sessionResult;
            const user = session?.user;
            
            if (user) {
                console.log('[Auth] User authenticated:', user.email);
                try {
                    const profile = await window.SupabaseClient.profile.get(user.id);
                    currentUser = { ...user, ...profile, loggedIn: true };
                } catch (e) {
                    console.log('[Auth] No profile found, using basic user data');
                    currentUser = { 
                        ...user, 
                        loggedIn: true,
                        credits: 0,
                        role: 'personal'
                    };
                }
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUI();
                return;
            }
        } catch (err) {
            console.error('[Auth] Error processing OAuth hash:', err);
        }
    }
    
    checkAuthOnLoad();
    
    if (window.SupabaseClient && window.SupabaseClient.auth.onAuthStateChange) {
        window.SupabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                try {
                     const profile = await window.SupabaseClient.profile.get(session.user.id);
                     currentUser = { ...session.user, ...profile };
                     localStorage.setItem('currentUser', JSON.stringify(currentUser));
                     updateUI();
                     window.closeAuth();
                } catch (err) {
                    console.error("Error fetching profile on auth change:", err);
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                localStorage.removeItem('currentUser');
                updateUI();
            }
        });
    }

    // Check for cert generation gating
    const generateBtn = document.getElementById('generateCertBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', (e) => {
             if (!currentUser) {
                 e.preventDefault();
                 e.stopPropagation();
                 window.openAuth(true);
                 return;
             }
             window.dispatchEvent(new CustomEvent('certGenerationApproved'));
        });
    }
});

// Initialize Supabase if keys exist (mock for now if invalid)
// Initialize Supabase if keys exist (mock for now if invalid)
// NOTE: auth.js relies on window.SupabaseClient defined in supabase-client.js
// We do not need to initialize a separate client here.
// let supabase; 
// Removed to prevent "Invalid API key" errors from placeholders

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const authForm = document.getElementById('authForm');
    const mode = authForm.dataset.mode;
    const role = document.getElementById('authRole').value;
    const submitBtn = document.getElementById('authSubmitBtn');
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
        let authResult;
        
        if (mode === 'register') {
            const fullName = email.split('@')[0];
            authResult = await window.SupabaseClient.auth.signUp(email, password, fullName, role);
            if (authResult.error) throw authResult.error;
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: 'Please check your email (including spam) to confirm. If no email arrives, check Supabase SMTP settings.',
            });
        } else {
            authResult = await window.SupabaseClient.auth.signIn(email, password);
             if (authResult.error) throw authResult.error;
             const profile = await window.SupabaseClient.profile.get(authResult.user.id);
             currentUser = { ...authResult.user, ...profile };
             localStorage.setItem('currentUser', JSON.stringify(currentUser));
             updateUI();
             window.closeAuth();
             
             Swal.fire({
                icon: 'success',
                title: 'Welcome Back!',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        }
    } catch (error) {
        console.error("Auth Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Authentication Failed',
            text: error.message
        });
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// --- Dashboard Features ---

window.switchFeature = function(feature) {
    const generator = document.getElementById('generatorSection');
    const viewer = document.getElementById('viewerSection');
    const cardGen = document.getElementById('card-generator');
    const cardView = document.getElementById('card-viewer');
    const indGen = document.getElementById('indicator-generator');
    const indView = document.getElementById('indicator-viewer');

    if (!generator || !viewer) return;

    if (feature === 'generator') {
        generator.style.display = 'block';
        viewer.style.display = 'none';
        
        cardGen.style.borderColor = 'var(--color-primary)';
        cardView.style.borderColor = 'var(--color-border)';
        
        if(indGen) indGen.style.display = 'block';
        if(indView) indView.style.display = 'none';
    } else {
        generator.style.display = 'none';
        viewer.style.display = 'block';
        
        cardGen.style.borderColor = 'var(--color-border)';
        cardView.style.borderColor = '#3b82f6';
        
        if(indGen) indGen.style.display = 'none';
        if(indView) indView.style.display = 'block';
    }
}

window.handleQuickView = async function() {
    const pin = document.getElementById('viewerPinInput').value;
    const resultDiv = document.getElementById('viewerResult');
    const loadingDiv = document.getElementById('viewerLoading');
    
    if (!pin) {
        Swal.fire('Error', 'Please enter a KRA PIN', 'error');
        return;
    }

    if(loadingDiv) loadingDiv.style.display = 'block';
    if(resultDiv) resultDiv.style.display = 'none';

    try {
        const details = await window.fetchKraDetails(pin);
        
        if(loadingDiv) loadingDiv.style.display = 'none';
        if(resultDiv) {
             resultDiv.style.display = 'block';
             resultDiv.innerHTML = `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1.5rem; border-radius: 12px;">
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: #dcfce7; color: #166534; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="check" style="width: 20px;"></i>
                        </div>
                        <div>
                            <h3 style="color: #166534; margin: 0; font-size: 1.1rem;">PIN is Active</h3>
                            <p style="color: #15803d; font-size: 0.9rem;">${details.name}</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; border-top: 1px solid #bbf7d0; padding-top: 1rem;">
                        <div>
                            <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">KRA PIN</small>
                            <span style="font-weight: 600; color: #334155;">${details.pin}</span>
                        </div>
                        <div>
                            <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">Obligation</small>
                            <span style="font-weight: 600; color: #334155;">${details.taxObligation}</span>
                        </div>
                         <div>
                            <small style="color: #64748b; display: block; margin-bottom: 0.25rem;">Station</small>
                            <span style="font-weight: 600; color: #334155;">${details.station}</span>
                        </div>
                    </div>
                </div>
             `;
             lucide.createIcons();
        }

    } catch (error) {
        if(loadingDiv) loadingDiv.style.display = 'none';
        Swal.fire('Error', error.message || 'Failed to fetch details', 'error');
    }
}

// --- Profile Management ---
window.openProfile = function() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    // Populate
    if (currentUser) {
       document.getElementById('profileName').value = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
       document.getElementById('profileEmail').value = currentUser.email;
       document.getElementById('profileAvatarPreview').textContent = (currentUser.user_metadata?.full_name || currentUser.email).charAt(0).toUpperCase();
    }

    modal.style.display = 'block';
}

window.closeProfile = function() {
    document.getElementById('profileModal').style.display = 'none';
}

window.handleProfileUpdate = async function(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value;
    const password = document.getElementById('profilePassword').value;
    const btn = document.getElementById('profileSubmitBtn');
    
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    try {
        const updates = {
            data: { full_name: name }
        };
        
        if (password) {
            updates.password = password;
        }
        
        const { data, error } = await window.SupabaseClient.auth.updateUser(updates);
        
        if (error) throw error;
        
        // Update local state
        currentUser = { ...currentUser, ...data.user };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUI();
        closeProfile();
        
        Swal.fire('Success', 'Profile updated successfully', 'success');
        
    } catch (err) {
        console.error(err);
        Swal.fire('Error', err.message, 'error');
    } finally {
        btn.textContent = 'Save Changes';
        btn.disabled = false;
    }
}

// Global Google Login Handler
window.googleLogin = async function() {
    console.log("window.googleLogin called");
    try {
        const btn = document.querySelector('.btn-google');
        let originalContent = '';
        if (btn) {
           originalContent = btn.innerHTML;
           btn.innerHTML = 'Redirecting...';
           btn.disabled = true;
        }

        const { data, error } = await window.SupabaseClient.auth.signInWithOAuth('google');
        if (error) throw error;
        
    } catch (error) {
        console.error('Google Sign-In error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Connection Failed',
            text: 'Ensure Google OAuth is configured in Supabase Dashboard -> Authentication -> Providers.',
            footer: '<a href="https://supabase.com/docs/guides/auth/social-login/auth-google" target="_blank">View Configuration Guide</a>'
        });
        const btn = document.querySelector('.btn-google');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent || 'Log in with Google'; 
        }
    }
}

function logout() {
    currentUser = null;
    updateUI();
    window.location.reload();
}

function updateUI() {
    const toolSection = document.getElementById('tool');
    const userBadge = document.getElementById('userBadge');
    const authBtn = document.getElementById('authBtn');
    
    // Check if elements exist before using them
    if (!authBtn) return; // Basic requirement
    if (!userBadge && currentUser) return;

    if (currentUser) {
        if (userBadge) {
            userBadge.textContent = currentUser.role ? currentUser.role.toUpperCase() : 'USER';
            userBadge.classList.remove('hidden');
        }
        authBtn.textContent = 'Logout';
        if (toolSection) toolSection.style.display = 'block';
    } else {
        if (userBadge) userBadge.classList.add('hidden');
        authBtn.textContent = 'Login / Register';
        if (toolSection) toolSection.style.display = 'none';
    }
}

window.checkAccess = async function() {
    if (!currentUser) {
        Swal.fire({
            icon: 'info',
            title: 'Login Required',
            text: 'Please login or register to use the PIN Checker.',
            confirmButtonText: 'Login Now'
        }).then((res) => {
            if(res.isConfirmed) window.openAuth();
        });
        return false;
    }

    try {
        const freshUser = await window.SupabaseClient.credits.get(currentUser.id);
        if (freshUser) {
            currentUser.credits = freshUser.credits;
            currentUser.subscription_status = freshUser.subscription_status;
            updateUI();
        }
    } catch (e) {
        console.warn("Failed to refresh user credits:", e);
    }

    if (currentUser.role === 'cyber') {
        if (currentUser.subscription_status === 'active') {
            return true;
        } else {
            openPricing();
            return false;
        }
    }

    if (currentUser.role === 'personal') {
        if (currentUser.credits > 0) {
            return true;
        } else {
            Swal.fire({
                title: 'Insufficient Credits',
                text: "You need 1 credit to perform this check. Cost: 100 KES.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Pay 100 KES',
                confirmButtonColor: '#10b981'
            }).then((result) => {
                if (result.isConfirmed) {
                    startPayment('personal');
                }
            });
            return false;
        }
    }
    return false;
};

function startPayment(plan) {
    if (!currentUser) {
        window.openAuth();
        return;
    }

    const pricingModal = document.getElementById('pricingModal');
    if (pricingModal) pricingModal.style.display = 'none';
    
    let amount = plan === 'personal' ? 100 : (plan === 'cyber_monthly' ? 2500 : 800);
    let type = plan === 'personal' ? 'credit_purchase' : 'subscription';
    
    Swal.fire({
        title: 'M-PESA Payment',
        text: `Enter your M-PESA phone number to pay ${amount} KES`,
        input: 'tel',
        inputPlaceholder: 'e.g., 0712345678',
        showCancelButton: true,
        confirmButtonText: 'Pay Now',
        showLoaderOnConfirm: true,
        preConfirm: (phone) => {
            if (!phone) {
                Swal.showValidationMessage('Please enter a phone number');
            }
            return fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: phone,
                    amount: amount,
                    userId: currentUser.id,
                    type: type
                })
            })
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .catch(error => {
                Swal.showValidationMessage(`Request failed: ${error}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value && result.value.success) {
            const checkoutReqID = result.value.checkoutRequestID;
            Swal.fire({
                title: 'Payment Initiated',
                text: 'Check your phone for the M-PESA prompt. Waiting for confirmation...',
                icon: 'info',
                showConfirmButton: false,
                allowOutsideClick: false,
                willOpen: () => {
                    Swal.showLoading();
                    pollPaymentStatus(checkoutReqID);
                }
            });
        }
    });
}

function pollPaymentStatus(checkoutRequestID) {
    let attempts = 0;
    const maxAttempts = 60;
    
    const interval = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(`/api/pay/status/${checkoutRequestID}`);
            const data = await res.json();
            
            if (data.status === 'completed') {
                clearInterval(interval);
                const freshUser = await window.SupabaseClient.credits.get(currentUser.id);
                if (freshUser) {
                    currentUser.credits = freshUser.credits;
                    currentUser.subscription_status = freshUser.subscription_status;
                    updateUI();
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Payment Successful!',
                    text: 'Your credits/subscription have been updated.',
                    timer: 3000
                });
            } else if (data.status === 'failed') {
                 clearInterval(interval);
                 Swal.fire('Payment Failed', 'The transaction was cancelled or failed.', 'error');
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                Swal.fire('Timeout', 'Payment confirmation timed out. Please check your balance later.', 'warning');
            }
        } catch (e) {
            console.error("Polling error:", e);
        }
    }, 3000);
}

// Event Listeners with Safe Guards
const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', handleAuth);
}

document.addEventListener('DOMContentLoaded', () => {
    // Override the verify buttons to check access first
    const submitBtnID = document.getElementById('submitBtnID');
    if (submitBtnID) {
        const originalIDClick = submitBtnID.onclick;
        
        const checkerFormID = document.getElementById('checkerFormID');
        if (checkerFormID) {
            checkerFormID.addEventListener('submit', (e) => {
                if (!window.checkAccess()) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                } else {
                    if (currentUser && currentUser.role === 'personal') currentUser.credits--; 
                }
            }, true);
        }
    }
    
    const checkerFormPIN = document.getElementById('checkerFormPIN');
    if (checkerFormPIN) {
        checkerFormPIN.addEventListener('submit', (e) => {
            if (!window.checkAccess()) {
                e.stopImmediatePropagation();
                e.preventDefault();
            } else {
                 if (currentUser && currentUser.role === 'personal') currentUser.credits--;
            }
        }, true);
    }
});

