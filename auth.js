// auth.js
// Supabase Client Initialization
// TODO: Replace with actual keys from .env or User Input
const SUPABASE_URL = 'https://PLACEHOLDER_URL.supabase.co';
const SUPABASE_KEY = 'PLACEHOLDER_KEY';

// State Management
let currentUser = null;
let currentSubscription = null;

// --- Access Control & Initialization ---

function checkAuthOnLoad() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUser = user;
        updateUI(); // Call the existing updateUI function
    } else {
        // No user found, FORCE LOGIN
        openAuth(true); // true = force/unclosable
    }
}

// Explicitly expose openAuth to handle the 'force' parameter
window.openAuth = function(force = false) {
    // Prefer the new styled auth modal from shared-components
    const newModal = document.getElementById('authModal');
    if (newModal && newModal.classList.contains('auth-modal')) {
        newModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        return;
    }
    
    // Fallback to old modal if new one not available
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    if (force) {
        modal.classList.add('modal-unclosable');
        document.body.classList.add('auth-active-blur'); // Apply blur
        // Override close behaviors
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
        document.body.classList.remove('auth-active-blur'); // Remove blur
         // Restore standard window click behavior
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
}

// Override closeAuth to respect forcing
window.closeAuth = function() {
    const modal = document.getElementById('authModal');
    if (!modal.classList.contains('modal-unclosable')) {
        modal.style.display = 'none';
        document.body.classList.remove('auth-active-blur');
    }
}


// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthOnLoad();
    
    // Check for cert generation gating
    const generateBtn = document.getElementById('generateCertBtn');
    if (generateBtn) {
        console.log("Attaching listener to #generateCertBtn");
        generateBtn.addEventListener('click', (e) => {
             console.log("#generateCertBtn clicked, checking auth...");
             // Logic: Must be logged in
             if (!currentUser) {
                 console.log("No user logged in, forcing auth modal.");
                 e.preventDefault();
                 e.stopPropagation();
                 openAuth(true);
                 return;
             }
             
             // Gating Logic Relaxed: Allow ALL logged-in users 
             console.log("Auth check passed, dispatching certGenerationApproved.");
             window.dispatchEvent(new CustomEvent('certGenerationApproved'));
        });
    }
});

// Initialize Supabase if keys exist (mock for now if invalid)
let supabase;
try {
    if (SUPABASE_URL.includes('PLACEHOLDER')) {
        console.warn('Supabase Keys missing. Auth flows will simulate success.');
    } else {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error('Supabase init failed:', e);
}

// UI Elements
const authModal = document.getElementById('authModal');
const paymentModal = document.getElementById('paymentModal'); // Will add this
const pricingModal = document.getElementById('pricingModal');
const userBadge = document.getElementById('userBadge');
const authBtn = document.getElementById('authBtn');

// --- Auth Functions --- //

function openAuth() {
    if (currentUser) {
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
    } else {
        authModal.style.display = 'block';
    }
}

function closeAuth() {
    authModal.style.display = 'none';
}

function openPricing() {
    pricingModal.style.display = 'block';
}

function switchAuthMode(mode) {
    const title = document.getElementById('authTitle');
    const roleGroup = document.getElementById('roleSelectGroup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

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

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const mode = document.getElementById('authForm').dataset.mode;
    const role = document.getElementById('authRole').value;

    // Simulation for Demo (Replace with Supabase Logic)
    Swal.fire({
        title: 'Authenticating...',
        timer: 1000,
        didOpen: () => Swal.showLoading()
    }).then(() => {
        // Mock Success
        currentUser = {
            email: email,
            role: mode === 'register' ? role : 'personal', // Default to personal for login mock
            credits: 0
        };
        
        updateUI();
        closeAuth();
        
        if (mode === 'register' && role === 'cyber') {
            openPricing(); // Prompt payment immediately for Cyber
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Logged in as ${currentUser.role.toUpperCase()} User`,
            timer: 1500,
            showConfirmButton: false
        });
    });
}

function logout() {
    currentUser = null;
    updateUI();
    window.location.reload();
}

function updateUI() {
    const toolSection = document.getElementById('tool');
    const heroSection = document.querySelector('.hero-section');
    
    if (currentUser) {
        userBadge.textContent = currentUser.role.toUpperCase();
        userBadge.classList.remove('hidden');
        authBtn.textContent = 'Logout';
        if (toolSection) toolSection.style.display = 'block';
        // Optional: Hide hero or adjust it? keeping it for now.
    } else {
        userBadge.classList.add('hidden');
        authBtn.textContent = 'Login / Register';
        if (toolSection) toolSection.style.display = 'none';
    }
}

// --- Payment & Gating Logic --- //

// --- Payment & Gating Logic --- //

window.checkAccess = async function() {
    if (!currentUser) {
        Swal.fire({
            icon: 'info',
            title: 'Login Required',
            text: 'Please login or register to use the PIN Checker.',
            confirmButtonText: 'Login Now'
        }).then((res) => {
            if(res.isConfirmed) openAuth();
        });
        return false;
    }

    // Refresh user data to get latest credits/subscription
    try {
        const freshUser = await window.SupabaseClient.credits.get(currentUser.id);
        if (freshUser) {
            currentUser.credits = freshUser.credits;
            currentUser.subscription_status = freshUser.subscription_status;
            updateUI(); // Reflect changes in badge etc
        }
    } catch (e) {
        console.warn("Failed to refresh user credits:", e);
    }

    // Cyber Subscription Check
    if (currentUser.role === 'cyber') {
        if (currentUser.subscription_status === 'active') {
            return true;
        } else {
            openPricing();
            return false;
        }
    }

    // Personal Credit Check
    if (currentUser.role === 'personal') {
        if (currentUser.credits > 0) {
            return true;
        } else {
            // Show Pay-per-use Prompt
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
        openAuth();
        return;
    }

    pricingModal.style.display = 'none';
    let amount = plan === 'personal' ? 100 : (plan === 'cyber_monthly' ? 2500 : 800);
    let type = plan === 'personal' ? 'credit_purchase' : 'subscription';
    
    // Prompt for Phone Number
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
    const maxAttempts = 60; // 2 minutes (assuming 2s interval)
    
    const interval = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(`/api/pay/status/${checkoutRequestID}`);
            const data = await res.json();
            
            if (data.status === 'completed') {
                clearInterval(interval);
                
                // Refresh User Data
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

// Deprecated Mock Process Function
function processPayment(amount) {
    console.warn("processPayment is deprecated. Use startPayment.");
}

// Event Listeners
document.getElementById('authForm').addEventListener('submit', handleAuth);

// Hijack the "Start Verification" button in Hero
// We need to attach this safely
document.addEventListener('DOMContentLoaded', () => {
    // Override the verify buttons to check access first
    const submitBtnID = document.getElementById('submitBtnID');
    const originalIDClick = submitBtnID.onclick;
    
    // We intercept form submission instead
    document.getElementById('checkerFormID').addEventListener('submit', (e) => {
        if (!window.checkAccess()) {
            e.stopImmediatePropagation();
            e.preventDefault();
        } else {
            // Deduct credit if personal
             if (currentUser.role === 'personal') currentUser.credits--; 
        }
    }, true); // Capture phase
    
    document.getElementById('checkerFormPIN').addEventListener('submit', (e) => {
        if (!window.checkAccess()) {
            e.stopImmediatePropagation();
            e.preventDefault();
        } else {
             if (currentUser.role === 'personal') currentUser.credits--;
        }
    }, true);
});
