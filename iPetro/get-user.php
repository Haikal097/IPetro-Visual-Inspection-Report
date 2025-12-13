<?php
session_start();

// Check authentication and admin role
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || $_SESSION['role'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once 'db-config.php';
$conn = getConnection();

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$rowsPerPage = isset($_GET['rows']) ? (int)$_GET['rows'] : 10;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$role = isset($_GET['role']) ? $_GET['role'] : 'all';
$sortBy = isset($_GET['sort']) ? $_GET['sort'] : 'user_id';
$sortDir = isset($_GET['dir']) ? $_GET['dir'] : 'asc';

$offset = ($page - 1) * $rowsPerPage;

// Build query
$query = "SELECT user_id, full_name, username, email, role FROM USER WHERE 1=1";

// Add search condition
if (!empty($search)) {
    $query .= " AND (full_name LIKE '%$search%' OR username LIKE '%$search%' OR email LIKE '%$search%')";
}

// Add role filter
if ($role !== 'all') {
    $query .= " AND role = '$role'";
}

// Add sorting
$validSorts = ['user_id', 'full_name', 'username', 'email', 'role'];
if (in_array($sortBy, $validSorts)) {
    $query .= " ORDER BY $sortBy $sortDir";
}

$query .= " LIMIT $rowsPerPage OFFSET $offset";

$result = $conn->query($query);
$users = [];

while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

// Get total count
$countQuery = "SELECT COUNT(*) as total FROM USER WHERE 1=1";
if (!empty($search)) {
    $countQuery .= " AND (full_name LIKE '%$search%' OR username LIKE '%$search%' OR email LIKE '%$search%')";
}
if ($role !== 'all') {
    $countQuery .= " AND role = '$role'";
}

$countResult = $conn->query($countQuery);
$totalUsers = $countResult->fetch_assoc()['total'];
$totalPages = ceil($totalUsers / $rowsPerPage);

echo json_encode([
    'users' => $users,
    'totalPages' => $totalPages,
    'currentPage' => $page,
    'totalUsers' => $totalUsers
]);

$conn->close();
?>



/**
 * ============================================================================
 * Usage Example in JavaScript
 * ============================================================================
 */

/** 
// Load users from database
async function loadUsers(page = 1, rowsPerPage = 10, search = '', role = 'all', sortBy = 'user_id', sortDir = 'asc') {
    try {
        const response = await fetch(
            `get-users.php?page=${page}&rows=${rowsPerPage}&search=${search}&role=${role}&sort=${sortBy}&dir=${sortDir}`
        );
        const data = await response.json();
        
        // Clear table
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        
        // Populate table
        data.users.forEach((user, index) => {
            const row = createUserRow(user, (page - 1) * rowsPerPage + index + 1);
            tbody.appendChild(row);
        });
        
        // Update pagination
        updatePaginationInfo(data.totalPages, page);
        
        // Update statistics
        updateStatisticsFromData(data);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

<!-- function createUserRow(user, displayId) {
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', user.user_id);
    row.innerHTML = `
        <td><strong>#${String(displayId).padStart(3, '0')}</strong></td>
        <td>${user.full_name}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td><span class="role-badge ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
        <td><span class="status-badge active">Active</span></td>
        <td>
            <button class="btn-action edit" onclick="editUser(${user.user_id})">✏️ Edit</button>
            <button class="btn-action delete" onclick="confirmDelete(${user.user_id})">🗑️ Delete</button>
        </td>
    `;
    return row;
} -->
 */
