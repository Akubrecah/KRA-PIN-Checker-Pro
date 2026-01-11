
// admin-logs.js - Handles fetching and displaying Audit Logs

export async function loadLogs() {
    const tableBody = document.getElementById('logsTable');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading logs...</td></tr>';

    try {
        if (!window.SupabaseClient || !window.SupabaseClient.usage) {
             throw new Error("Supabase Client not ready");
        }
        
        // Fetch logs directly or via client wrapper if available
        // The wrapper has usage.getHistory(userId), but we want ALL history for admin
        // Let's use raw supabase query via the client
        
        const supabase = window.SupabaseClient.init(); // Get the raw client
        const { data, error } = await supabase
            .from('usage_logs')
            .select(`
                *,
                profiles:user_id (full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No logs found</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        data.forEach(log => {
            const date = new Date(log.created_at).toLocaleString();
            const userName = log.profiles?.full_name || log.profiles?.email || 'Unknown User';
            
            let activity = 'PIN Check';
            let badgeColor = 'blue';
            
            if (log.certificate_generated) {
                activity = 'Certificate Generated';
                badgeColor = 'green';
            }
            
            const resultColor = log.result_status === 'Success' ? 'green' : 'red';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${userName}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-${badgeColor}-100 text-${badgeColor}-800">${activity}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.pin_checked || log.id_number || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-${resultColor}-600 font-medium">${log.result_status}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading logs:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
    }
}

// Auto-load if on logs page
if (document.getElementById('logsTable')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadLogs, 1000); // Small delay to ensure DB client init
    });
}
