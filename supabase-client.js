// supabase-client.js
// Supabase Client for KRA PIN Checker Pro SaaS

// ============================================
// CONFIGURATION - Replace with your Supabase credentials
// ============================================
const SUPABASE_URL = 'https://sjkodtxkhoukpxfljgit.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Zjju86j4BqwteaGGBrhv1Q_PdUetjSM';

// Initialize Supabase Client
let supabase = null;

function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return supabase;
    } else {
        console.error('Supabase JS library not loaded. Include it in your HTML.');
        return null;
    }
}

// ============================================
// AUTHENTICATION
// ============================================

async function signUp(email, password, fullName, role = 'personal') {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role
            }
        }
    });
    
    if (error) throw error;
    
    // Update profile with role if signup succeeded
    if (data.user) {
        await supabase.from('profiles').update({ role }).eq('id', data.user.id);
    }
    
    return data;
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });
    
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ============================================
// USER PROFILE
// ============================================

async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) throw error;
    return data;
}

async function updateUserProfile(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// ============================================
// CREDITS & SUBSCRIPTIONS
// ============================================

async function getUserCredits(userId) {
    const profile = await getUserProfile(userId);
    return profile.credits;
}

async function deductCredit(userId) {
    const { data, error } = await supabase.rpc('deduct_credit', { user_id: userId });
    if (error) throw error;
    return data;
}

async function addCredits(userId, amount) {
    const { data, error } = await supabase.rpc('add_credits', { 
        user_id: userId, 
        credit_amount: amount 
    });
    if (error) throw error;
    return data;
}

async function checkSubscription(userId) {
    const profile = await getUserProfile(userId);
    
    if (profile.subscription_status === 'active') {
        const endDate = new Date(profile.subscription_end);
        if (endDate > new Date()) {
            return { active: true, expiresAt: profile.subscription_end };
        } else {
            // Subscription expired, update status
            await updateUserProfile(userId, { subscription_status: 'expired' });
            return { active: false };
        }
    }
    
    return { active: false };
}

// ============================================
// USAGE LOGGING
// ============================================

async function logPINCheck(userId, pinChecked, idNumber, resultStatus) {
    const { data, error } = await supabase
        .from('usage_logs')
        .insert({
            user_id: userId,
            pin_checked: pinChecked,
            id_number: idNumber,
            result_status: resultStatus
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function logCertificateGeneration(logId) {
    const { data, error } = await supabase
        .from('usage_logs')
        .update({ certificate_generated: true })
        .eq('id', logId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function getUserUsageHistory(userId, limit = 50) {
    const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) throw error;
    return data;
}

// ============================================
// TRANSACTIONS
// ============================================

async function createTransaction(userId, amount, type, phoneNumber) {
    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            amount: amount,
            type: type,
            phone_number: phoneNumber,
            status: 'pending'
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function updateTransactionStatus(transactionId, status, mpesaCode = null) {
    const updates = { status };
    if (mpesaCode) updates.mpesa_code = mpesaCode;
    
    const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function getUserTransactions(userId, limit = 50) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) throw error;
    return data;
}

// ============================================
// EXPORTS (for browser)
// ============================================

const ClientExport = {
    init: initSupabase,
    auth: {
        signUp,
        signIn,
        signOut,
        getCurrentUser,
        getSession,
        signInWithOAuth,
        onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback)
    },
    profile: {
        get: getUserProfile,
        update: updateUserProfile
    },
    credits: {
        get: getUserCredits,
        add: addCredits,
        deduct: deductCredit,
        checkSubscription
    },
    usage: {
        logCheck: logPINCheck,
        logCertificate: logCertificateGeneration,
        getHistory: getUserUsageHistory
    },
    transactions: {
        create: createTransaction,
        updateStatus: updateTransactionStatus,
        getHistory: getUserTransactions
    }
};

// Expose directly to window
window.SupabaseClient = ClientExport;

// Auto-initialize if Supabase is already loaded
if (typeof window !== 'undefined') {
    // Wait for Supabase JS to load if needed
    const checkSupabase = setInterval(() => {
        if (window.supabase) {
            clearInterval(checkSupabase);
            if (!supabase) initSupabase();
        }
    }, 100);
}
