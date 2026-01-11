// admin.js - Admin Dashboard Logic
console.log("Admin.js - Starting Load...");

// Global Error Handler for initial debugging
window.addEventListener('error', function(event) {
    console.error("ADMIN.JS GLOBAL ERROR:", event.message, "at", event.filename, ":", event.lineno);
});

// Helper for Alerts (Robust against missing SweetAlert)
function showAlert(title, text, icon) {
    if (typeof Swal !== 'undefined') {
        Swal.fire(title, text, icon);
    } else {
        alert(`${title}: ${text}`);
    }
}

// ---------------------------------------------------------
// DATASETS (Kenya Administrative Units)
// ---------------------------------------------------------
const kenyaData = {
    "MOMBASA": ["Mvita", "Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni"],
    "KWALE": ["Msambweni", "Lunga Lunga", "Matuga", "Kinango"],
    "KILIFI": ["Kilifi North", "Kilifi South", "Kaloleni", "Rabai", "Ganze", "Malindi", "Magarini"],
    "TANA RIVER": ["Garsen", "Galole", "Bura"],
    "LAMU": ["Lamu East", "Lamu West"],
    "TAITA TAVETA": ["Taveta", "Wundanyi", "Mwatate", "Voi"],
    "GARISSA": ["Garissa Township", "Balambala", "Lagdera", "Dadaab", "Fafi", "Ijara"],
    "WAJIR": ["Wajir North", "Wajir East", "Tarbaj", "Wajir West", "Eldas", "Wajir South"],
    "MANDERA": ["Mandera West", "Banissa", "Mandera North", "Mandera South", "Mandera East", "Lafey"],
    "MARSABIT": ["Moyale", "North Horr", "Saku", "Laisamis"],
    "ISIOLO": ["Isiolo North", "Isiolo South"],
    "MERU": ["Igembe South", "Igembe Central", "Igembe North", "Tigania West", "Tigania East", "North Imenti", "Buuri", "Central Imenti", "South Imenti"],
    "THARAKA-NITHI": ["Maara", "Chuka/Igambang'ombe", "Tharaka"],
    "EMBU": ["Manyatta", "Runyenjes", "Mbeere North", "Mbeere South"],
    "KITUI": ["Mwingi North", "Mwingi West", "Mwingi Central", "Kitui West", "Kitui Rural", "Kitui Central", "Kitui East", "Kitui South"],
    "MACHAKOS": ["Masinga", "Yatta", "Kangundo", "Matungulu", "Kathiani", "Mavoko", "Machakos Town", "Mwala"],
    "MAKUENI": ["Mbooni", "Kilome", "Kaiti", "Makueni", "Kibwezi West", "Kibwezi East"],
    "NYANDARUA": ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Joro Orok", "Ndaragwa"],
    "NYERI": ["Tetu", "Kieni", "Mathira", "Othaya", "Mukurweini", "Nyeri Town"],
    "KIRINYAGA": ["Mwea", "Gichugu", "Ndia", "Kirinyaga Central"],
    "MURANG'A": ["Kangema", "Mathioya", "Kiharu", "Kigumo", "Maragwa", "Kandara", "Gatanga"],
    "KIAMBU": ["Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", "Githunguri", "Kiambu", "Kiambaa", "Kabete", "Kikuyu", "Limuru", "Lari"],
    "TURKANA": ["Turkana North", "Turkana West", "Turkana Central", "Loima", "Turkana South", "Turkana East"],
    "WEST POKOT": ["Kapenguria", "Sigor", "Kacheliba", "Pokot South"],
    "SAMBURU": ["Samburu West", "Samburu North", "Samburu East"],
    "TRANS NZOIA": ["Kwanza", "Endebess", "Saboti", "Kiminini", "Cherangany"],
    "UASIN GISHU": ["Soy", "Turbo", "Moiben", "Ainabkoi", "Kapseret", "Kesses"],
    "ELGEYO-MARAKWET": ["Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South"],
    "NANDI": ["Tinderet", "Aldai", "Nandi Hills", "Chesumei", "Emgwen", "Mosop"],
    "BARINGO": ["Tiaty", "Baringo  North", "Baringo Central", "Baringo South", "Mogotio", "Eldama Ravine"],
    "LAIKIPIA": ["Laikipia West", "Laikipia East", "Laikipia North"],
    "NAKURU": ["Molo", "Njoro", "Naivasha", "Gilgil", "Kuresoi South", "Kuresoi North", "Subukia", "Rongai", "Bahati", "Nakuru Town West", "Nakuru Town East"],
    "NAROK": ["Kilgoris", "Emurua Dikirr", "Narok North", "Narok East", "Narok South", "Narok West"],
    "KAJIADO": ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
    "KERICHO": ["Kipkelion East", "Kipkelion West", "Ainamoi", "Bureti", "Belgut", "Sigowet/Soin"],
    "BOMET": ["Sotik", "Chepalungu", "Bomet East", "Bomet Central", "Konoin"],
    "KAKAMEGA": ["Lugari", "Likuyani", "Malava", "Lurambi", "Navakholo", "Mumias West", "Mumias East", "Matungu", "Butere", "Khwisero", "Shinyalu", "Ikolomani"],
    "VIHIGA": ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"],
    "BUNGOMA": ["Mt. Elgon", "Sirisia", "Kabuchai", "Bumula", "Kanduyi", "Webuye East", "Webuye West", "Kimilili", "Tongaren"],
    "BUSIA": ["Teso North", "Teso South", "Nambale", "Matayos", "Butula", "Funyula", "Budalangi"],
    "SIAYA": ["Ugenya", "Ugunja", "Alego Usonga", "Gem", "Bondo", "Rarieda"],
    "KISUMU": ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
    "HOMA BAY": ["Kasipul", "Kabondo Kasipul", "Karachuonyo", "Rangwe", "Homa Bay Town", "Ndhiwa", "Suba North", "Suba South"],
    "MIGORI": ["Rongo", "Awendo", "Suna East", "Suna West", "Uriri", "Nyatike", "Kuria West", "Kuria East"],
    "KISII": ["Bonchari", "South Mugirango", "Bomachoge Borabu", "Bobasi", "Bomachoge Chache", "Nyaribari Masaba", "Nyaribari Chache", "Kitutu Chache North", "Kitutu Chache South"],
    "NYAMIRA": ["Kitutu Masaba", "West Mugirango", "North Mugirango", "Borabu"],
    "NAIROBI CITY": ["Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", "Kamukunji", "Starehe", "Mathare"]
};

// KRA Stations Mapping Removed as per user request (User will type manually)

const postalCodes = [
    "00100 - Nairobi GPO", "00200 - City Square", "00300 - Ronald Ngala", "00500 - Industrial Area", "00501 - JKIA", 
    "00502 - Karen", "00511 - Ongata Rongai", "00515 - Buruburu", "00516 - Dandora", "00600 - Ngara", 
    "00603 - Lavington", "00606 - Sarit Centre", "00610 - Eastleigh", "00618 - Ruaraka", "00623 - Parklands", 
    "00800 - Westlands", "00900 - Kiambu", "00902 - Kikuyu", "01000 - Thika", "01020 - Kenol", "00216 - Githunguri",
    "00217 - Limuru", "00219 - Karuri", "00221 - Matathia", "00222 - Uplands", "00223 - Kagwe",
    "10100 - Nyeri", "10101 - Karatina", "10102 - Kiganjo", "10103 - Mukurweini", "10104 - Mweiga", "10105 - Naromoru", "10106 - Othaya",
    "10200 - Murang'a", "10201 - Kangema", "10202 - Kangari", "10203 - Kigumo", "10204 - Kiriaini", "10205 - Maragua",
    "10300 - Kerugoya", "10301 - Kianyaga", "10302 - Kutus", "10303 - Wanguru", "10304 - Kagio",
    "10400 - Nanyuki", "10406 - Timau", 
    "20100 - Nakuru", "20103 - Eldama Ravine", "20106 - Molo", "20107 - Njoro", "20115 - Egerton", "20117 - Naivasha", "20119 - Gilgil",
    "20200 - Kericho", "20203 - Londiani", "20205 - Litein", "20210 - Sotik",
    "20300 - Nyahururu", "20301 - Miharati", "20302 - Ol Joro Orok", "20303 - Ol Kalou",
    "20400 - Bomet", "20402 - Longisa", "20406 - Mulot",
    "30100 - Eldoret", "30103 - Soy", "30104 - Iten", "30105 - Kaptagat", "30106 - Turbo", "30108 - Timboroa",
    "30200 - Kitale", "30202 - Moi's Bridge", "30209 - Kimilili", 
    "30300 - Kapsabet", "30303 - Kabiyet", "30307 - Mosoriot", "30301 - Nandi Hills",
    "30400 - Kabarnet", "30401 - Kabartonjo", "30403 - Marigat",
    "30500 - Lodwar", "30501 - Kakuma", "30502 - Lokichoggio",
    "40100 - Kisumu", "40101 - Ahero", "40102 - Kombewa", "40105 - Maseno", "40107 - Muhoroni", "40109 - Sondu",
    "40200 - Kisii", "40202 - Keroka", "40203 - Nyamira", "40204 - Ogembo", "40206 - Nyansiongo",
    "40300 - Homa Bay", "40301 - Kendu Bay", "40302 - Ndhiwa", "40303 - Rangwe", "40304 - Rodi Kopany", "40305 - Mbita",
    "40400 - Migori", "40401 - Awendo", "40402 - Rongo", "40404 - Rare", "40405 - Suna",
    "40500 - Nyamira", "40502 - Nyansiongo", "40506 - Kebirigo",
    "40600 - Siaya", "40601 - Bondo", "40602 - Ndori", "40605 - Sidindi", "40611 - Nyilima",
    "50100 - Kakamega", "50101 - Butere", "50102 - Mumias", "50103 - Malava", "50104 - Khayega", "50105 - Bukura",
    "50200 - Bungoma", "50201 - Cheptais", "50204 - Kimilili", "50205 - Webuye",
    "50300 - Maragoli", "50301 - Vihiga", "50307 - Luanda", "50308 - Serem", "50309 - Kaimosi",
    "50400 - Busia", "50403 - Amagoro", "50404 - Bumala", "50409 - Nambale", "50410 - Port Victoria",
    "60100 - Embu", "60101 - Manyatta", "60102 - Ishiara", "60103 - Runyenjes", "60104 - Siakago",
    "60200 - Meru", "60202 - Nkubu", "60205 - Githongo", "60300 - Isiolo", 
    "60400 - Chuka", "60401 - Chogoria", "60402 - Igoji", 
    "60500 - Marsabit", "60501 - Laisamis", "60502 - Moyale",
    "70100 - Garissa", "70101 - Hola", "70103 - Dadaab", "70105 - Masalani",
    "70200 - Wajir", "70300 - Mandera", 
    "80100 - Mombasa", "80102 - Changamwe", "80103 - Malindi", "80105 - Kaloleni",
    "80200 - Malindi", "80202 - Watamu", "80205 - Gongoni",
    "80300 - Voi", "80302 - Taveta", "80303 - Werugha", "80305 - Mwatate",
    "80400 - Ukunda", "80401 - Msambweni", "80403 - Kwale",
    "80500 - Lamu", "80501 - Faza", "80503 - Mpeketoni",
    "90100 - Machakos", "90101 - Masii", "90102 - Kathiani", "90103 - Wamunyu",
    "90200 - Kitui", "90201 - Mutomo", "90202 - Mwingi", "90204 - Kibwezi",
    "90300 - Makueni", "90302 - Kathonzweni", "90305 - Kilome", "90400 - Mwingi"
];

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------

/**
 * Main initialization function to be called when DOM is ready
 */
async function initAdminDashboard() {
    console.log("Admin.js - Initializing Dashboard...");
    
    // 1. Attach Listeners IMMEDIATELY (Critical to ensure buttons work)
    setupGeneratorListeners();
    populateAddressDropdowns(); // Populate Dropdowns
    
    // 2. Setup Supabase (with safety check)
    if (!window.SupabaseClient) {
        console.warn("SupabaseClient not found on window object. Some features may be disabled.");
        // Try to proceed with UI setup anyway, assuming auth might be handled elsewhere or not needed for verify
    }
    
    let supabase = null;
    try {
        if (window.SupabaseClient) {
            supabase = window.SupabaseClient.init();
        }
    } catch(err) {
        console.error("Supabase init failed:", err);
    }

    if (!supabase) {
        console.warn("Supabase failed to initialize. Dashboard stats will not load.");
        // Continue anyway - custom admin login handles auth
    } else {
        // Skip Supabase auth check - custom admin login overlay handles authentication
        // Just load data if admin is logged in via custom login
        const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
        if (isAdminLoggedIn) {
            // Update UI with admin name
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) adminNameEl.innerText = 'Akubrecah';
            
            // Load Data
            loadDashboardData(supabase);
        }
    }
    
    console.log("Admin.js - Initialization Complete.");
}

/**
 * Populate Dropdowns and setup Change Listeners
 */
function populateAddressDropdowns() {
    const countySelect = document.getElementById('genCounty');
    const districtSelect = document.getElementById('genDistrict');
    const postalList = document.getElementById('postalCodes');

    // Populate Counties
    if (countySelect) {
        Object.keys(kenyaData).sort().forEach(county => {
            const opt = document.createElement('option');
            opt.value = county;
            opt.textContent = county;
            countySelect.appendChild(opt);
        });

// Change Listener
        countySelect.addEventListener('change', () => {
             const selectedCounty = countySelect.value;
             
             // Reset District
             districtSelect.innerHTML = '<option value="">Select District</option>';

             if (selectedCounty) {
                 // 1. Populate Districts
                 if (districtSelect && kenyaData[selectedCounty]) {
                     districtSelect.disabled = false;
                     kenyaData[selectedCounty].sort().forEach(dist => {
                         const opt = document.createElement('option');
                         opt.value = dist;
                         opt.textContent = dist;
                         districtSelect.appendChild(opt);
                     });
                 }
             } else {
                 if(districtSelect) {
                    districtSelect.disabled = true;
                    districtSelect.innerHTML = '<option value="">Select County First</option>';
                 }
             }
        });
    }

    // Populate Postal Codes
    if (postalList) {
        postalCodes.sort().forEach(code => {
            const opt = document.createElement('option');
            opt.value = code;
            postalList.appendChild(opt);
        });
    }
}

/**
 * Setup Event Listeners for the Certificate Generator
 */
function setupGeneratorListeners(supabase) {
    console.log("Admin.js - Setting up Generator Listeners...");
    
    // Verify & Autofill Button
    const btnVerify = document.getElementById('btnVerify');
    if (btnVerify) {
        // Remove valid existing listener to avoid duplicates if re-run?? No, simple addEventListener is fine
        // Using "e" => handleVerification()
        btnVerify.onclick = async (e) => {
             e.preventDefault(); 
            console.log("Verify Button Clicked");
            await handleVerification();
        };
    } else {
        console.warn("Warning: #btnVerify not found in DOM");
    }

    // Generate Form Submit
    const certForm = document.getElementById('adminCertForm');
    if (certForm) {
        certForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("Generate Form Submitted");
            await handleGeneration(supabase);
        };
    } else {
        console.warn("Warning: #adminCertForm not found in DOM");
    }
}

// ---------------------------------------------------------
// CORE HANDLERS
// ---------------------------------------------------------

async function handleVerification() {
    const btnVerify = document.getElementById('btnVerify');
    const type = document.getElementById('verifyType').value;
    const inputField = document.getElementById('verifyInput');
    const value = inputField.value.trim();

    if (!value) {
        showAlert('Error', 'Please enter a value to verify', 'error');
        return;
    }

    // Check if KRA Client is available
    const client = window.kraClient;
    if (!client) {
        showAlert('System Error', 'KRA API Client not loaded. Please refresh.', 'error');
        return;
    }

    const originalText = btnVerify.innerHTML;
    btnVerify.innerHTML = 'Verifying...';
    btnVerify.disabled = true;

    try {
        let result;
        if (type === 'PIN') {
            result = await client.checkPINByPIN(value);
        } else {
            result = await client.checkPIN(type, value);
        }
        
        console.log("Verification Result:", result);

        if (result && (result.TaxpayerName || result.Name)) {
            const tName = (result.TaxpayerName || result.Name || '').toUpperCase();
            const tPIN = result.TaxpayerPIN || result.KRAPIN || value;
            
            document.getElementById('genName').value = tName;
            document.getElementById('genPIN').value = tPIN;
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('genDate').value = today;

            showAlert('Verified & Found', `Loaded details for ${tName}`, 'success');
        } else {
             throw new Error("Invalid response structure or no record found");
        }
    } catch (e) {
        console.error("Verification Error:", e);
        showAlert('Verification Failed', e.message || 'Could not find taxpayer details', 'error');
    } finally {
        btnVerify.innerHTML = originalText;
        btnVerify.disabled = false;
    }
}

async function handleGeneration(supabase) {
    const submitBtn = document.getElementById('btnGenerate');
    const originalText = submitBtn.innerHTML;
    
    const getValue = (id) => document.getElementById(id)?.value || '';

    const data = {
        name: getValue('genName'),
        pin: getValue('genPIN'),
        email: getValue('genEmail'),
        date: getValue('genDate'),
        lr: getValue('genLR'),
        building: getValue('genBuilding'),
        street: getValue('genStreet'),
        city: getValue('genCity'),
        county: getValue('genCounty'),
        district: getValue('genDistrict'),
        taxArea: getValue('genTaxArea'),
        station: getValue('genStation'),
        box: getValue('genBox'),
        postal: getValue('genPostal'),
        obligation: getValue('genObligation')
    };

    if (!data.name || !data.pin || !data.date) {
        showAlert('Error', 'Please fill at least Name, PIN and Date', 'error');
        return;
    }
    
    try {
        submitBtn.innerHTML = 'Generating PDF...';
        submitBtn.disabled = true;

        // Populate Template
        const setContent = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.textContent = val;
        };

        setContent('certName', data.name.toUpperCase());
        setContent('certPin', data.pin.toUpperCase());
        setContent('certDate', new Date().toLocaleDateString('en-GB'));
        setContent('certFromDate', new Date(data.date).toLocaleDateString('en-GB'));
        setContent('certEmail', (data.email || 'N/A').toUpperCase());
        
        // Address Table
        const certTable = document.querySelectorAll('.kra-cert-table')[1]; 
        if(certTable) {
            const setRow = (r, c, label, val) => {
                if(certTable.rows[r] && certTable.rows[r].cells[c]) {
                    certTable.rows[r].cells[c].innerHTML = `<strong>${label} :</strong> ${val}`;
                }
            };
            setRow(0, 0, 'L.R. Number', data.lr); setRow(0, 1, 'Building', data.building);
            setRow(1, 0, 'Street/Road', data.street); setRow(1, 1, 'City/Town', data.city);
            setRow(2, 0, 'County', data.county); setRow(2, 1, 'District', data.district);
            setRow(3, 0, 'Tax Area', data.taxArea); setRow(3, 1, 'Station', data.station);
            setRow(4, 0, 'P. O. Box', data.box); setRow(4, 1, 'Postal Code', data.postal);
        }
        
        // Obligation Table
        const obTable = document.querySelector('.kra-obligation-table tbody');
        if(obTable && obTable.rows[0]) {
            obTable.rows[0].cells[1].textContent = data.obligation;
            obTable.rows[0].cells[2].textContent = new Date(data.date).toLocaleDateString('en-GB');
        }
        
        // PDF Options
        const element = document.getElementById('certificate-template');
        element.style.display = 'block'; 

        const opt = {
            margin: 0,
            filename: `KRA_PIN_Certificate_${data.pin.toUpperCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: 'avoid-all' }
        };
        
        if (typeof html2pdf === 'undefined') {
            throw new Error("html2pdf library missing. Check script includes.");
        }

        await html2pdf().set(opt).from(element.querySelector('.kra-cert-container')).save();
        element.style.display = 'none';

        // Log to Supabase (only if available)
        if (supabase && window.SupabaseClient) {
            const user = await window.SupabaseClient.auth.getCurrentUser();
            if (user) {
                await supabase.from('usage_logs').insert([{
                    user_id: user.id,
                    activity_type: 'admin_certificate_generated',
                    target_pin: data.pin,
                    certificate_generated: true
                }]);
            }
        }

        showAlert('Certificate Generated', `PDF has been downloaded.`, 'success');

    } catch (err) {
        console.error("Generation Error:", err);
        showAlert('Generation Failed', err.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ---------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------

async function loadDashboardData(supabase) {
    try {
        // Revenue
        const { data: trans } = await supabase.from('transactions').select('amount').eq('status', 'completed');
        if (trans) {
            const revenue = trans.reduce((s, t) => s + t.amount, 0);
            document.getElementById('statRevenue').innerText = `KES ${revenue.toLocaleString()}`;
        }

        // Users
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (uCount !== null) document.getElementById('statUsers').innerText = uCount;

        // Logs/Checks
        const { count: lCount } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true });
        if (lCount !== null) document.getElementById('statChecks').innerText = lCount;

        // Certs
        const { count: cCount } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('certificate_generated', true);
        if (cCount !== null) document.getElementById('statCerts').innerText = cCount;

        loadRecentTransactions(supabase);
        loadAllUsers(supabase);
        loadAuditLogs(supabase);
    } catch (e) { console.error("Stats Error:", e); }
}

async function loadRecentTransactions(supabase) {
    const { data: trans } = await supabase.from('transactions').select('id, amount, type, status, created_at, profiles(email)').order('created_at', { ascending: false }).limit(10);
    const tbody = document.getElementById('recentTransactionsTable');
    if (!tbody || !trans) return;
    tbody.innerHTML = trans.map(t => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4">#${t.id}</td>
            <td class="px-6 py-4 font-medium text-gray-900">${t.profiles?.email || 'Unknown'}</td>
            <td class="px-6 py-4">KES ${t.amount}</td>
            <td class="px-6 py-4 capitalize">${t.type.replace('_', ' ')}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-semibold ${t.status === 'completed' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}">${t.status}</span></td>
            <td class="px-6 py-4 text-gray-500">${new Date(t.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

async function loadAllUsers(supabase) {
    const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('usersTable');
    if (!tbody || !users) return;
    tbody.innerHTML = users.map(u => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 font-medium">${u.email}</td>
            <td class="px-6 py-4 capitalize">${u.role}</td>
            <td class="px-6 py-4">${u.credits}</td>
            <td class="px-6 py-4">${u.subscription_status === 'active' ? '<span class="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">Active</span>' : '<span class="text-gray-400 text-xs">None</span>'}</td>
            <td class="px-6 py-4">
                <button onclick="editUser('${u.id}')" class="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2">Edit</button>
                <button onclick="addCreditsPrompt('${u.id}')" class="text-emerald-500 hover:text-emerald-700 text-sm font-medium">Add Credits</button>
            </td>
        </tr>
    `).join('');
}

async function loadAuditLogs(supabase) {
    const { data: logs } = await supabase.from('usage_logs').select('created_at, pin_checked, result_status, certificate_generated, profiles(email)').order('created_at', { ascending: false }).limit(20);
    const tbody = document.getElementById('logsTable');
    if (!tbody || !logs) return;
    tbody.innerHTML = logs.map(l => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 text-gray-500">${new Date(l.created_at).toLocaleString()}</td>
            <td class="px-6 py-4 font-medium">${l.profiles?.email || 'Unknown'}</td>
            <td class="px-6 py-4">${l.certificate_generated ? 'Generated Certificate' : 'Checked PIN'}</td>
            <td class="px-6 py-4 font-mono text-xs">${l.pin_checked || '-'}</td>
            <td class="px-6 py-4"><span class="${l.result_status === 'valid' ? 'text-green-600' : 'text-red-500'}">${l.result_status}</span></td>
        </tr>
    `).join('');
}

// ---------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------

window.logoutAdmin = async () => {
    if (window.SupabaseClient) await window.SupabaseClient.auth.signOut();
    window.location.href = '../index.html';
};

window.editUser = (userId) => {
    showAlert("Edit User", `Functionality for user ${userId} coming soon.`, "info");
};

window.addCreditsPrompt = async (userId) => {
    const supabase = window.SupabaseClient.init();
    if (!supabase) return;

    if (typeof Swal !== 'undefined') {
        const { value: credits } = await Swal.fire({
            title: 'Add Credits',
            input: 'number',
            inputLabel: 'Amount of credits to add',
            showCancelButton: true
        });
        if (credits) {
            const { error } = await supabase.rpc('add_credits', { user_id: userId, credit_amount: parseInt(credits) });
            if (error) showAlert('Error', error.message, 'error');
            else { showAlert('Success', 'Credits added', 'success'); loadAllUsers(supabase); }
        }
    } else {
        const credits = prompt("Enter credits to add:");
        if (credits) {
            const { error } = await supabase.rpc('add_credits', { user_id: userId, credit_amount: parseInt(credits) });
            if (error) alert(error.message);
            else { alert('Credits added'); loadAllUsers(supabase); }
        }
    }
};

// ---------------------------------------------------------
// STARTUP
// ---------------------------------------------------------

// Check if document is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminDashboard);
} else {
    initAdminDashboard();
}

console.log("Admin.js - File Loaded Successfully.");
