// User Management JavaScript

let currentSortColumn = -1;
let currentSortDirection = 'asc';
let rowsPerPage = 10;
let allTableRows = [];
let currentPage = 1;
let deleteUserId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeTable();
    updateStatistics();
});

// Initialize table
function initializeTable() {
    const table = document.getElementById('userTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    allTableRows = Array.from(tbody.getElementsByTagName('tr'));
    updatePaginationDisplay();
}

// Update user statistics
function updateStatistics() {
    let adminCount = 0, reviewerCount = 0, inspectorCount = 0;
    
    allTableRows.forEach(row => {
        const roleBadge = row.querySelector('.role-badge');
        if (roleBadge) {
            const role = roleBadge.textContent.trim().toLowerCase();
            if (role === 'admin') adminCount++;
            else if (role === 'reviewer') reviewerCount++;
            else if (role === 'inspector') inspectorCount++;
        }
    });
    
    document.getElementById('totalUsers').textContent = allTableRows.length;
    document.getElementById('adminCount').textContent = adminCount;
    document.getElementById('reviewerCount').textContent = reviewerCount;
    document.getElementById('inspectorCount').textContent = inspectorCount;
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

function openAddUserModal() {
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('password').required = true;
    document.getElementById('passwordRequired').style.display = 'inline';
    document.getElementById('userModal').style.display = 'block';
}

function editUser(userId) {
    // Find the user row
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) return;
    
    // Extract user data from row
    const cells = row.getElementsByTagName('td');
    const fullName = cells[1].textContent;
    const username = cells[2].textContent;
    const email = cells[3].textContent;
    const role = cells[4].querySelector('.role-badge').textContent.trim().toLowerCase();
    const status = cells[5].querySelector('.status-badge').textContent.trim().toLowerCase();
    
    // Populate form
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = userId;
    document.getElementById('fullName').value = fullName;
    document.getElementById('username').value = username;
    document.getElementById('email').value = email;
    document.getElementById('role').value = role;
    document.getElementById('userStatus').value = status;
    
    // Password not required for edit
    document.getElementById('password').required = false;
    document.getElementById('passwordRequired').style.display = 'none';
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Show modal
    document.getElementById('userModal').style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
}

function confirmDelete(userId) {
    deleteUserId = userId;
    
    // Find the user row
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) return;
    
    const fullName = row.getElementsByTagName('td')[1].textContent;
    document.getElementById('deleteUserName').textContent = fullName;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteUserId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target == userModal) {
        closeUserModal();
    }
    if (event.target == deleteModal) {
        closeDeleteModal();
    }
}

// ============================================================================
// SAVE USER
// ============================================================================

async function saveUser(event) {
    event.preventDefault();
    
    const form = document.getElementById('userForm');
    const formData = new FormData(form);
    const userId = formData.get('user_id');
    
    // Validate passwords match
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    if (password && password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    if (!userId && password.length < 6) {
        showToast('Password must be at least 6 characters!', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('saveUserBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoader = saveBtn.querySelector('.btn-loader');
    
    saveBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    
    try {
        // DEMO MODE: Simulate save
        await simulateSaveUser(formData, userId);
        
        /* PRODUCTION CODE:
        const response = await fetch('save-user.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(userId ? 'User updated successfully!' : 'User created successfully!', 'success');
            closeUserModal();
            loadUsers(); // Refresh table
            updateStatistics();
        } else {
            showToast(result.message || 'Error saving user', 'error');
        }
        */
        
    } catch (error) {
        console.error('Save error:', error);
        showToast('An error occurred while saving', 'error');
    } finally {
        // Reset button state
        saveBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

// Simulate save (demo)
async function simulateSaveUser(formData, userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (userId) {
                // Update existing row
                const row = document.querySelector(`tr[data-user-id="${userId}"]`);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    cells[1].textContent = formData.get('full_name');
                    cells[2].textContent = formData.get('username');
                    cells[3].textContent = formData.get('email');
                    
                    const role = formData.get('role');
                    cells[4].innerHTML = `<span class="role-badge ${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`;
                    
                    const status = formData.get('status');
                    cells[5].innerHTML = `<span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
                }
                showToast('User updated successfully!', 'success');
            } else {
                // Add new row
                const tbody = document.getElementById('userTableBody');
                const newId = allTableRows.length + 1;
                const role = formData.get('role');
                const status = formData.get('status');
                
                const newRow = document.createElement('tr');
                newRow.setAttribute('data-user-id', newId);
                newRow.innerHTML = `
                    <td><strong>#${String(newId).padStart(3, '0')}</strong></td>
                    <td>${formData.get('full_name')}</td>
                    <td>${formData.get('username')}</td>
                    <td>${formData.get('email')}</td>
                    <td><span class="role-badge ${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span></td>
                    <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                    <td>
                        <button class="btn-action edit" onclick="editUser(${newId})">✏️ Edit</button>
                        <button class="btn-action delete" onclick="confirmDelete(${newId})">🗑️ Delete</button>
                    </td>
                `;
                tbody.appendChild(newRow);
                allTableRows.push(newRow);
                
                showToast('User created successfully!', 'success');
            }
            
            closeUserModal();
            updateStatistics();
            resolve();
        }, 1500);
    });
}

// ============================================================================
// DELETE USER
// ============================================================================

async function deleteUser() {
    if (!deleteUserId) return;
    
    try {
        // DEMO MODE: Simulate delete
        const row = document.querySelector(`tr[data-user-id="${deleteUserId}"]`);
        if (row) {
            row.remove();
            allTableRows = allTableRows.filter(r => r !== row);
            showToast('User deleted successfully!', 'success');
            updateStatistics();
            updatePaginationDisplay();
        }
        
        /* PRODUCTION CODE:
        const response = await fetch('delete-user.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: deleteUserId})
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('User deleted successfully!', 'success');
            loadUsers(); // Refresh table
            updateStatistics();
        } else {
            showToast(result.message || 'Error deleting user', 'error');
        }
        */
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('An error occurred while deleting', 'error');
    } finally {
        closeDeleteModal();
    }
}

// ============================================================================
// TABLE FUNCTIONS (Search, Sort, Pagination)
// ============================================================================

function searchTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    
    currentPage = 1;
    
    allTableRows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length - 1; j++) { // Exclude actions column
            const cell = cells[j];
            if (cell) {
                const textValue = cell.textContent || cell.innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        if (found || filter === '') {
            row.removeAttribute('data-filtered');
        } else {
            row.setAttribute('data-filtered', 'true');
            row.style.display = 'none';
        }
    });
    
    updatePaginationDisplay();
}

function filterByRole() {
    const roleFilter = document.getElementById('roleFilter').value;
    
    currentPage = 1;
    
    allTableRows.forEach(row => {
        const roleBadge = row.querySelector('.role-badge');
        
        if (roleBadge) {
            const roleText = roleBadge.textContent.trim().toLowerCase();
            
            if (roleFilter === 'all') {
                row.removeAttribute('data-filtered');
            } else if (roleText === roleFilter) {
                row.removeAttribute('data-filtered');
            } else {
                row.setAttribute('data-filtered', 'true');
                row.style.display = 'none';
            }
        }
    });
    
    updatePaginationDisplay();
}

function sortTable(columnIndex) {
    const table = document.getElementById('userTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    const headers = table.querySelectorAll('th.sortable');
    
    if (currentSortColumn === columnIndex) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
        currentSortColumn = columnIndex;
    }
    
    headers.forEach((header, index) => {
        header.classList.remove('asc', 'desc');
        if (index === columnIndex) {
            header.classList.add(currentSortDirection);
        }
    });
    
    const visibleRows = Array.from(allTableRows).filter(row => {
        return row.style.display !== 'none';
    });
    
    visibleRows.sort((rowA, rowB) => {
        let cellA = rowA.getElementsByTagName('td')[columnIndex];
        let cellB = rowB.getElementsByTagName('td')[columnIndex];
        
        let valueA = getCellValue(cellA);
        let valueB = getCellValue(cellB);
        
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
        
        if (valueA < valueB) {
            return currentSortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return currentSortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    visibleRows.forEach(row => tbody.appendChild(row));
    
    currentPage = 1;
    updatePaginationDisplay();
}

function getCellValue(cell) {
    if (cell.querySelector('.role-badge')) {
        return cell.querySelector('.role-badge').textContent.trim();
    }
    if (cell.querySelector('strong')) {
        return cell.querySelector('strong').textContent.trim();
    }
    return cell.textContent.trim();
}

function updateRowsPerPage() {
    const input = document.getElementById('rowsPerPage');
    const value = parseInt(input.value);
    
    if (value >= 5 && value <= 50) {
        rowsPerPage = value;
        currentPage = 1;
        updatePaginationDisplay();
    } else {
        alert('Please enter a number between 5 and 50');
        input.value = rowsPerPage;
    }
}

function changePage(direction) {
    const visibleRows = getVisibleRows();
    const totalPages = Math.ceil(visibleRows.length / rowsPerPage);
    
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    
    updatePaginationDisplay();
}

function getVisibleRows() {
    return allTableRows.filter(row => !row.hasAttribute('data-filtered'));
}

function updatePaginationDisplay() {
    const visibleRows = getVisibleRows();
    const table = document.getElementById('userTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    allTableRows.forEach(row => row.style.display = 'none');
    
    visibleRows.slice(startIndex, endIndex).forEach(row => {
        row.style.display = '';
    });
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info') {
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

document.addEventListener('keydown', function(e) {
    // Escape key closes modals
    if (e.key === 'Escape') {
        closeUserModal();
        closeDeleteModal();
    }
    
    // Ctrl/Cmd + N opens add user modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddUserModal();
    }
});