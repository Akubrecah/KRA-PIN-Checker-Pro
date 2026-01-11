// admin-charts.js

// --- Chart Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Only init if canvas exists
    if(document.getElementById('mainChart')) {
        initCharts();
    }
});

let revenueChart, statusChart;

async function initCharts() {
    // 1. Revenue & Growth (Line/Bar Combo)
    const ctxMain = document.getElementById('mainChart').getContext('2d');
    
    // Dummy Data for Logic (Replace with Real Aggregation later)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueData = [15000, 22000, 18000, 28000, 32000, 45000];
    const userGrowth = [50, 80, 120, 160, 210, 280];

    revenueChart = new Chart(ctxMain, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Revenue (KES)',
                    data: revenueData,
                    borderColor: '#dc2626', // Red-600
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Active Users',
                    data: userGrowth,
                    borderColor: '#2563eb', // Blue-600
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    type: 'bar',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Revenue (KES)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Users' }
                }
            }
        }
    });

    // 2. System Status (Doughnut)
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    
    statusChart = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Pending', 'Suspended'],
            datasets: [{
                data: [300, 50, 20], // Replace with real counts
                backgroundColor: [
                    '#16a34a', // Green-600
                    '#ca8a04', // Yellow-600
                    '#dc2626'  // Red-600
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


// --- User Management Logic ---

async function loadUsers() {
    const tableBody = document.getElementById('usersTable');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading users...</td></tr>';

    try {
        const users = await window.SupabaseClient.profile.getAll();
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No users found</td></tr>';
            document.getElementById('userCountDisplay').textContent = '0';
            return;
        }

        document.getElementById('userCountDisplay').textContent = users.length;
        tableBody.innerHTML = ''; // Clear loading

        users.forEach(user => {
            const roleBadge = user.role === 'admin' 
                ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>'
                : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">User</span>';
            
            // Dummy status logic if field missing
            const status = user.status || 'Active'; 
            const statusColor = status === 'Active' ? 'green' : (status === 'Suspended' ? 'red' : 'gray');
            const statusBadge = `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800">${status}</span>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                ${(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.full_name || 'No Name'}</div>
                            <div class="text-sm text-gray-500">${user.email || 'No Email'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${roleBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.credits || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(user.created_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3" onclick="editUser('${user.id}')">Edit</button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteUser('${user.id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading users:", error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading users: ${error.message}</td></tr>`;
    }
}

// Search Filter
document.getElementById('userSearch')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});

// Expose to window
window.loadUsers = loadUsers;
