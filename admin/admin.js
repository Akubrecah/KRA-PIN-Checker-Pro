// admin.js - Admin Dashboard Logic

console.log("Admin.js loading...");

/**
 * Verify Data (PIN or ID) and Autofill Form
 */
window.verifyAdminData = async () => {
    console.log("verifyAdminData called");
    
    // Safety check for KRA Client
    if (!window.kraClient) {
        console.error("KRA Client not loaded");
        Swal.fire('System Error', 'KRA Client library missing. Try refreshing.', 'error');
        return;
    }

    const type = document.getElementById('verifyType').value;
    const inputField = document.getElementById('verifyInput');
    const value = inputField.value.trim();
    const btn = document.getElementById('btnVerify');
    
    console.log(`Verifying: ${type} - ${value}`);

    if (!value) {
        Swal.fire('Error', 'Please enter a value to verify', 'error');
        return;
    }

    const originalText = btn.textContent;
    btn.textContent = 'Verifying...';
    btn.disabled = true;

    try {
        let result;
        if (type === 'PIN') {
            result = await window.kraClient.checkPINByPIN(value);
        } else {
            result = await window.kraClient.checkPIN(type, value);
        }
        
        console.log("Verification Result:", result);

        if (result && result.TaxpayerName) {
            // Auto-fill
            document.getElementById('genName').value = result.TaxpayerName;
            document.getElementById('genPIN').value = result.TaxpayerPIN || value; // Fallback if PIN not in response
            
            // Set date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('genDate').value = today;

            Swal.fire({
                icon: 'success',
                title: 'Verified & Found',
                text: `Loaded details for ${result.TaxpayerName}`,
                timer: 1500,
                showConfirmButton: false
            });
        } else {
             throw new Error("Invalid response structure or no record found");
        }
    } catch (e) {
        console.error("Verification Error:", e);
        let msg = e.message || 'Could not find taxpayer details';
        if (msg.includes('fetch failed')) msg = "Connection Error. Ensure server is running.";
        Swal.fire('Verification Failed', msg, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

window.logoutAdmin = async () => {
    if (window.SupabaseClient) {
        await window.SupabaseClient.auth.signOut();
    }
    window.location.href = '../index.html';
};

// Initialize Supabase
const supabase = window.SupabaseClient ? window.SupabaseClient.init() : null;

// Check if user is admin
async function checkAdminAuth() {
    if (!supabase) {
        console.warn("Supabase not init in checkAdminAuth");
        return; // Or handle error
    }

    const user = await window.SupabaseClient.auth.getCurrentUser();
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to view this page.'
        }).then(() => {
            window.location.href = '../index.html';
        });
        return;
    }
    
    document.getElementById('adminName').innerText = user.email;
    loadDashboardData();
}

/**
 * Loads overview statistics and recent transactions
 */
async function loadDashboardData() {
    try {
        // 1. Fetch Revenue (Total of completed transactions)
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('status', 'completed');
            
        if (!transError) {
            const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
            document.getElementById('statRevenue').innerText = `KES ${totalRevenue.toLocaleString()}`;
        }

        // 2. Count Active Users (Total profiles)
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (!userError) document.getElementById('statUsers').innerText = userCount;

        // 3. Count PIN Checks
        const { count: checkCount, error: checkError } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true });
        
        if (!checkError) document.getElementById('statChecks').innerText = checkCount;

        // 4. Count Certificates
        const { count: certCount, error: certError } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('certificate_generated', true);
            
        if (!certError) document.getElementById('statCerts').innerText = certCount;

        // Load Tables
        loadRecentTransactions();
        loadAllUsers();
        loadAuditLogs();

    } catch (e) {
        console.error("Dashboard Load Error:", e);
    }
}

async function loadRecentTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            id, amount, type, status, created_at, mpesa_code,
            profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    const tbody = document.getElementById('recentTransactionsTable');
    tbody.innerHTML = '';

    if (error || !data) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load</td></tr>';
        return;
    }

    data.forEach(t => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';
        const userEmail = t.profiles ? t.profiles.email : 'Unknown';
        const date = new Date(t.created_at).toLocaleDateString() + ' ' + new Date(t.created_at).toLocaleTimeString();
        
        const statusColors = {
            'completed': 'text-green-600 bg-green-100',
            'pending': 'text-yellow-600 bg-yellow-100',
            'failed': 'text-red-600 bg-red-100'
        };
        const statusClass = statusColors[t.status] || 'text-gray-600 bg-gray-100';

        row.innerHTML = `
            <td class="px-6 py-4">#${t.id}</td>
            <td class="px-6 py-4 font-medium text-gray-900">${userEmail}</td>
            <td class="px-6 py-4">KES ${t.amount}</td>
            <td class="px-6 py-4"><span class="capitalize">${t.type.replace('_', ' ')}</span></td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">${t.status}</span></td>
            <td class="px-6 py-4 text-gray-500">${date}</td>
        `;
        tbody.appendChild(row);
    });

    // Also populate full table (for now just duplication for demo)
    const fullTbody = document.getElementById('allTransactionsTable');
    if(fullTbody) fullTbody.innerHTML = tbody.innerHTML;
}

async function loadAllUsers() {
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';

    if (error || !users) return;

    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';
        
        row.innerHTML = `
            <td class="px-6 py-4 font-medium">${user.email}</td>
            <td class="px-6 py-4 capitalize">${user.role}</td>
            <td class="px-6 py-4">${user.credits}</td>
            <td class="px-6 py-4">
                ${user.subscription_status === 'active' ? 
                '<span class="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">Active</span>' : 
                '<span class="text-gray-400 text-xs">None</span>'}
            </td>
            <td class="px-6 py-4">
                <button onclick="editUser('${user.id}')" class="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2">Edit</button>
                <button onclick="addCreditsPrompt('${user.id}')" class="text-emerald-500 hover:text-emerald-700 text-sm font-medium">Add Credits</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadAuditLogs() {
    const { data, error } = await supabase
        .from('usage_logs')
        .select(`
            created_at, pin_checked, result_status, certificate_generated,
            profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
        
    const tbody = document.getElementById('logsTable');
    tbody.innerHTML = '';
    
    if (error || !data) return;
    
    data.forEach(log => {
        const row = document.createElement('tr');
        const userEmail = log.profiles ? log.profiles.email : 'Unknown';
        const activity = log.certificate_generated ? 'Generated Certificate' : 'Checked PIN';
        const date = new Date(log.created_at).toLocaleString();
        
        row.innerHTML = `
            <td class="px-6 py-4 text-gray-500">${date}</td>
            <td class="px-6 py-4 font-medium">${userEmail}</td>
            <td class="px-6 py-4">${activity}</td>
            <td class="px-6 py-4 font-mono text-xs">${log.pin_checked}</td>
            <td class="px-6 py-4"><span class="${log.result_status === 'valid' ? 'text-green-600' : 'text-red-500'}">${log.result_status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Admin Actions
window.addCreditsPrompt = async (userId) => {
    const { value: credits } = await Swal.fire({
        title: 'Add Credits',
        input: 'number',
        inputLabel: 'Amount of credits to add',
        inputPlaceholder: 'e.g. 50',
        showCancelButton: true
    });

    if (credits) {
        const { error } = await supabase.rpc('add_credits', {
            user_id: userId,
            credit_amount: parseInt(credits)
        });
        
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire('Success', 'Credits added successfully', 'success');
            loadAllUsers();
        }
    }
};

// Expose functions globally for HTML access
// window.addCredits = addCredits; // This line seems to be a leftover from a previous edit or a misunderstanding. 'addCredits' is not defined.

// --- Certificate Generation Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const certForm = document.getElementById('adminCertForm');
    if (certForm) {
        certForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Generating PDF...';

            try {
                // 1. Capture Data
                const name = document.getElementById('genName').value;
                const pin = document.getElementById('genPIN').value;
                const date = document.getElementById('genDate').value;

                // 2. Populate Template
                document.getElementById('cert-name').textContent = name;
                document.getElementById('cert-pin').textContent = pin;
                document.getElementById('cert-date').textContent = date;

                // 3. Prepare Element
                const element = document.getElementById('certificate-template');
                
                // Clone to ensure we don't mess up the hidden authentic template or dealing with display:none issues
                // html2pdf can render elements that are off-screen but visible (like our left: -9999px setup)
                // However, cloning is safer for repeated use.
                
                // 4. Generate PDF
                const opt = {
                    margin: 10,
                    filename: `KRA_Certificate_${pin}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                await html2pdf().set(opt).from(element).save();

                // 5. Success Feedback
                // Only if Swal is loaded, otherwise alert
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Certificate Generated',
                        text: `PDF for ${pin} has been downloaded.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    alert('Certificate Generated Successfully!');
                }

            } catch (err) {
                console.error('Generation Error:', err);
                alert('Failed to generate certificate: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
});

// Start logic
document.addEventListener('DOMContentLoaded', () => {
    if (supabase) {
        checkAdminAuth();
    } else {
        console.error("Supabase not initialized, bypassing auth check (unsafe for prod, debugging only)");
         // In prod, redirect: window.location.href = '../index.html';
    }
});
