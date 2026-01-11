
// --- Edit User Functionality ---

// Edit User: Open Modal and Populate Data
window.editUser = async function(userId) {
    console.log("Edit User clicked:", userId);
    
    // 1. Fetch User Data
    try {
        if (!window.SupabaseClient || !window.SupabaseClient.profile) {
            showAlert('Error', 'Supabase Client not ready', 'error');
            return;
        }

        const user = await window.SupabaseClient.profile.get(userId);
        if (!user) {
            showAlert('Error', 'User not found', 'error');
            return;
        }

        // 2. Populate Modal
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editFullName').value = user.full_name || '';
        document.getElementById('editEmail').value = user.email || ''; // Assuming email is in profile, else fetch separately
        document.getElementById('editRole').value = user.role || 'personal';
        document.getElementById('editStatus').value = user.status || 'Active';
        document.getElementById('editCredits').value = user.credits || 0;

        // 3. Show Modal
        document.getElementById('editUserModal').classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching user for edit:", error);
        showAlert('Error', 'Failed to fetch user details', 'error');
    }
}

// Close Modal
window.closeEditModal = function() {
    document.getElementById('editUserModal').classList.add('hidden');
}

// Save Changes
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = editForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Saving...';
            submitBtn.disabled = true;

            const userId = document.getElementById('editUserId').value;
            const updates = {
                full_name: document.getElementById('editFullName').value,
                role: document.getElementById('editRole').value,
                status: document.getElementById('editStatus').value,
                credits: parseInt(document.getElementById('editCredits').value)
            };

            try {
                if (!window.SupabaseClient || !window.SupabaseClient.profile) {
                   throw new Error("Supabase Client unavailable");
                }
                
                // Call Supabase Update (assuming update method exists or creating one)
                // We check supabase-client.js -> updateUserProfile is exported?
                // It was defined but maybe not exported under profile?
                // Let's assume we need to use the method if available, or call directly
                
                // Checking supabase-client.js exports...
                // It exports `profile: { get: ..., update: updateUserProfile, ... }` (Verified in previous steps)
                
                await window.SupabaseClient.profile.update(userId, updates);
                
                showAlert('Success', 'User updated successfully', 'success');
                closeEditModal();
                
                // Refresh Table
                if (window.loadUsers) window.loadUsers();

            } catch (error) {
                console.error("Error updating user:", error);
                showAlert('Error', 'Failed to update user: ' + error.message, 'error');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
