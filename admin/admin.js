// admin.js - Admin Dashboard Logic
console.log("Admin.js loading...");

// Helper for Alerts (Robust against missing SweetAlert)
function showAlert(title, text, icon) {
    if (typeof Swal !== 'undefined') {
        Swal.fire(title, text, icon);
    } else {
        alert(`${title}: ${text}`);
    }
}

// 1. Verification Logic
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Admin Verification...");
    const btnVerify = document.getElementById('btnVerify');
    
    if (btnVerify) {
        btnVerify.addEventListener('click', async (e) => {
            e.preventDefault(); 
             console.log("Verify Button Clicked");
             
             // Check if KRA Client is available
             const client = window.kraClient || { 
                 checkPIN: typeof checkPIN !== 'undefined' ? checkPIN : null,
                 checkPINByPIN: typeof checkPINByPIN !== 'undefined' ? checkPINByPIN : null 
             };

            if (!client.checkPIN && !client.checkPINByPIN) {
                showAlert('System Error', 'KRA Client library not ready. Please refresh.', 'error');
                return;
            }
        
            const type = document.getElementById('verifyType').value;
            const inputField = document.getElementById('verifyInput');
            const value = inputField.value.trim();
        
            if (!value) {
                showAlert('Error', 'Please enter a value to verify', 'error');
                return;
            }
        
            const originalText = btnVerify.innerHTML;
            btnVerify.innerHTML = 'Verifying...';
            btnVerify.disabled = true;
        
            try {
                let result;
                if (type === 'PIN') {
                    if (client.checkPINByPIN) {
                         result = await client.checkPINByPIN(value);
                    } else { throw new Error("checkPINByPIN function missing"); }
                } else {
                    if (client.checkPIN) {
                        result = await client.checkPIN(type, value);
                    } else { throw new Error("checkPIN function missing"); }
                }
                
                console.log("Verification Result:", result);
        
                if (result && (result.TaxpayerName || result.Name)) {
                    // Auto-fill
                    const tName = result.TaxpayerName || result.Name;
                    const tPIN = result.TaxpayerPIN || result.KRAPIN || value;
                    
                    document.getElementById('genName').value = tName;
                    document.getElementById('genPIN').value = tPIN;
                    
                    // Set date to today
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('genDate').value = today;

                    showAlert('Verified & Found', `Loaded details for ${tName}`, 'success');
                } else {
                     throw new Error("Invalid response structure or no record found");
                }
            } catch (e) {
                console.error("Verification Error:", e);
                let msg = e.message || 'Could not find taxpayer details';
                if (msg.includes('fetch failed')) msg = "Connection Error. Ensure server is running.";
                showAlert('Verification Failed', msg, 'error');
            } finally {
                btnVerify.innerHTML = originalText;
                btnVerify.disabled = false;
            }
        });
    }
});

// 2. Generator Logic
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Admin Generator...");
    const certForm = document.getElementById('adminCertForm');
    
    if (certForm) {
        certForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Generate Submitted");
            
            const btn = document.getElementById('btnGenerate');
            const submitBtn = btn || e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Get Values
            const getValue = (id) => {
                const el = document.getElementById(id);
                return el ? el.value : '';
            };

            const name = getValue('genName');
            const pin = getValue('genPIN');
            const email = getValue('genEmail');
            const date = getValue('genDate');
            
            // Address Extras
            const lr = getValue('genLR');
            const building = getValue('genBuilding');
            const street = getValue('genStreet');
            const city = getValue('genCity');
            const county = getValue('genCounty');
            const district = getValue('genDistrict');
            const taxArea = getValue('genTaxArea');
            const station = getValue('genStation');
            const box = getValue('genBox');
            const postal = getValue('genPostal');
            const obligation = getValue('genObligation');

            if (!name || !pin || !date) {
                showAlert('Error', 'Please fill at least Name, PIN and Date', 'error');
                return;
            }
            
            try {
                submitBtn.innerHTML = 'Generating PDF...';
                submitBtn.disabled = true;

                // Populate Template (Using CORRECT IDs matching admin/index.html)
                const setContent = (id, val) => {
                    const el = document.getElementById(id);
                    if(el) el.textContent = val;
                };

                // CamelCase IDs for high-fidelity template
                setContent('certName', name.toUpperCase());
                setContent('certPin', pin.toUpperCase());
                setContent('certDate', new Date().toLocaleDateString('en-GB'));
                setContent('certFromDate', new Date(date).toLocaleDateString('en-GB'));
                setContent('certEmail', email || 'N/A');
                
                // Populate Address Tables
                const certTable = document.querySelectorAll('.kra-cert-table')[1]; 
                if(certTable) {
                    const setRow = (r, c, label, val) => {
                        if(certTable.rows[r] && certTable.rows[r].cells[c]) {
                            certTable.rows[r].cells[c].innerHTML = `<strong>${label} :</strong> ${val}`;
                        }
                    };
                    setRow(0, 0, 'L.R. Number', lr);
                    setRow(0, 1, 'Building', building);
                    setRow(1, 0, 'Street/Road', street);
                    setRow(1, 1, 'City/Town', city);
                    setRow(2, 0, 'County', county);
                    setRow(2, 1, 'District', district);
                    setRow(3, 0, 'Tax Area', taxArea);
                    setRow(3, 1, 'Station', station);
                    setRow(4, 0, 'P. O. Box', box);
                    setRow(4, 1, 'Postal Code', postal);
                }
                
                // Populate Obligation
                const obTable = document.querySelector('.kra-obligation-table tbody');
                if(obTable && obTable.rows[0]) {
                    obTable.rows[0].cells[1].textContent = obligation;
                    obTable.rows[0].cells[2].textContent = new Date(date).toLocaleDateString('en-GB');
                }
                
                // Generate PDF
                const element = document.getElementById('certificate-template');
                element.style.display = 'block'; 

                const filename = `KRA_PIN_Certificate_${pin.toUpperCase()}.pdf`;
                const opt = {
                    margin: 0,
                    filename: filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true, scrollY: 0 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: 'avoid-all' }
                };
                
                if (typeof html2pdf === 'undefined') {
                    throw new Error("html2pdf library is missing!");
                }

                await html2pdf().set(opt).from(element.querySelector('.kra-cert-container')).save();
                element.style.display = 'none';

                // Log Usage
                if (typeof window.supabase !== 'undefined' && window.supabase) {
                    const user = await window.SupabaseClient.auth.getCurrentUser();
                    if (user) {
                        await window.supabase.from('usage_logs').insert([{
                            user_id: user.id,
                            activity_type: 'admin_certificate_generated',
                            target_pin: pin,
                            certificate_generated: true
                        }]);
                    }
                }

                showAlert('Certificate Generated', `PDF for ${pin} has been downloaded.`, 'success');

            } catch (err) {
                console.error("Generation Error:", err);
                showAlert('Generation Failed', err.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    } else {
         console.error("adminCertForm not found");
    }
});

// 3. Admin Auth & Dashboard Logic (Supabase)
window.logoutAdmin = async () => {
    if (window.SupabaseClient) {
        await window.SupabaseClient.auth.signOut();
    }
    window.location.href = '../index.html';
};

// Initialize Supabase
const supabase = window.SupabaseClient ? window.SupabaseClient.init() : null;

// Start logic (Auth Check)
document.addEventListener('DOMContentLoaded', () => {
    if (supabase) {
        checkAdminAuth();
    } else {
        console.warn("Supabase not initialized (Auth Check)");
    }
});

// Check if user is admin
async function checkAdminAuth() {
    if (!supabase) return;

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
        showAlert('Access Denied', 'You do not have permission to view this page.', 'error');
        setTimeout(() => window.location.href = '../index.html', 2000);
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
    if (typeof Swal !== 'undefined') {
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
    } else {
         const credits = prompt("Enter credits to add:");
         if(credits) {
             const { error } = await supabase.rpc('add_credits', {
                user_id: userId,
                credit_amount: parseInt(credits)
            });
            if (error) alert(error.message);
            else { alert('Credits added'); loadAllUsers(); }
         }
    }
};
