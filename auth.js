// auth.js
// Supabase Client Initialization
// TODO: Replace with actual keys from .env or User Input
const SUPABASE_URL = 'https://PLACEHOLDER_URL.supabase.co';
const SUPABASE_KEY = 'PLACEHOLDER_KEY';

// State Management
let currentUser = null;
let currentSubscription = null;

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
    if (currentUser) {
        userBadge.textContent = currentUser.role.toUpperCase();
        userBadge.classList.remove('hidden');
        authBtn.textContent = 'Logout';
    } else {
        userBadge.classList.add('hidden');
        authBtn.textContent = 'Login / Register';
    }
}

// --- Payment & Gating Logic --- //

window.checkAccess = function() {
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

    if (currentUser.role === 'personal') {
        if (currentUser.credits > 0) {
            return true;
        } else {
            // Show Pay-per-use Prompt
            Swal.fire({
                title: 'Payment Required',
                text: "Pay 100 KES to perform this check and generate a certificate.",
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Pay 100 KES',
                confirmButtonColor: '#10b981'
            }).then((result) => {
                if (result.isConfirmed) {
                    processPayment(100);
                }
            });
            return false;
        }
    } else if (currentUser.role === 'cyber') {
        if (currentSubscription === 'active') {
            return true;
        } else {
            openPricing();
            return false;
        }
    }
    return false;
};

function startPayment(plan) {
    pricingModal.style.display = 'none';
    let amount = plan === 'personal' ? 100 : (plan === 'cyber_monthly' ? 2500 : 800);
    
    // Simulate Payment Modal
    Swal.fire({
        title: `Pay ${amount} KES`,
        text: "Simulating M-PESA STK Push...",
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Simulate Success',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }).then((result) => {
        if (result.isConfirmed) {
            processPayment(amount);
        }
    });
}

function processPayment(amount) {
    // Mock Update Logic
    if (currentUser.role === 'personal') {
        currentUser.credits += 1;
    } else {
        currentSubscription = 'active';
    }
    
    Swal.fire('Payment Successful', 'You can now proceed.', 'success');
    
    // If waiting on the tool, scroll to it
    document.getElementById('tool').scrollIntoView({ behavior: 'smooth' });
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
