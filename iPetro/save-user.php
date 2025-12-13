<?php
/**
 * ============================================================================
 * save-user.php - Create/Update User Handler
 * ============================================================================
 */

session_start();

// Check authentication and admin role
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once 'db-config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conn = getConnection();
    
    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Get form data
    $userId = isset($_POST['user_id']) && !empty($_POST['user_id']) ? intval($_POST['user_id']) : null;
    $fullName = trim($_POST['full_name']);
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $role = $_POST['role'];
    $status = $_POST['status'] ?? 'active';
    $password = $_POST['password'] ?? '';
    
    // Validation
    if (empty($fullName) || empty($username) || empty($email) || empty($role)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }
    
    // Validate role
    $validRoles = ['admin', 'reviewer', 'inspector'];
    if (!in_array($role, $validRoles)) {
        echo json_encode(['success' => false, 'message' => 'Invalid role']);
        exit;
    }
    
    try {
        if ($userId) {
            // UPDATE existing user
            
            // Check if username/email already exists for other users
            $stmt = $conn->prepare("SELECT user_id FROM USER WHERE (username = ? OR email = ?) AND user_id != ?");
            $stmt->bind_param("ssi", $username, $email, $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
                exit;
            }
            $stmt->close();
            
            // Update user
            if (!empty($password)) {
                // Update with new password
                if (strlen($password) < 6) {
                    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
                    exit;
                }
                
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("
                    UPDATE USER 
                    SET full_name = ?, 
                        username = ?, 
                        email = ?, 
                        password_hash = ?, 
                        role = ?
                    WHERE user_id = ?
                ");
                $stmt->bind_param("sssssi", $fullName, $username, $email, $passwordHash, $role, $userId);
            } else {
                // Update without changing password
                $stmt = $conn->prepare("
                    UPDATE USER 
                    SET full_name = ?, 
                        username = ?, 
                        email = ?, 
                        role = ?
                    WHERE user_id = ?
                ");
                $stmt->bind_param("ssssi", $fullName, $username, $email, $role, $userId);
            }
            
            $stmt->execute();
            $stmt->close();
            
            // Log activity
            $action = "Updated user: $username";
            logActivity($conn, $_SESSION['user_id'], $action);
            
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully',
                'user_id' => $userId
            ]);
            
        } else {
            // CREATE new user
            
            // Validate password
            if (empty($password) || strlen($password) < 6) {
                echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
                exit;
            }
            
            // Check if username or email already exists
            $stmt = $conn->prepare("SELECT user_id FROM USER WHERE username = ? OR email = ?");
            $stmt->bind_param("ss", $username, $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
                exit;
            }
            $stmt->close();
            
            // Hash password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert new user
            $stmt = $conn->prepare("
                INSERT INTO USER (full_name, username, email, password_hash, role) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("sssss", $fullName, $username, $email, $passwordHash, $role);
            $stmt->execute();
            
            $newUserId = $conn->insert_id;
            $stmt->close();
            
            // Log activity
            $action = "Created new user: $username";
            logActivity($conn, $_SESSION['user_id'], $action);
            
            echo json_encode([
                'success' => true,
                'message' => 'User created successfully',
                'user_id' => $newUserId
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    
    $conn->close();
}

function logActivity($conn, $userId, $action) {
    $stmt = $conn->prepare("INSERT INTO ACTIVITY_LOG (user_id, action, timestamp) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $userId, $action);
    $stmt->execute();
    $stmt->close();
}


/**
 * ============================================================================
 * delete-user.php - Delete User Handler
 * ============================================================================
 */

/*
<?php
session_start();

// Check authentication and admin role
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once 'db-config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conn = getConnection();
    
    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = intval($data['user_id']);
    
    // Prevent deleting yourself
    if ($userId === $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
        exit;
    }
    
    // Prevent deleting if user has reports
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM REPORT WHERE created_by_user = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['count'] > 0) {
        echo json_encode([
            'success' => false, 
            'message' => 'Cannot delete user with existing reports. Please reassign or delete reports first.'
        ]);
        exit;
    }
    $stmt->close();
    
    // Get username for logging
    $stmt = $conn->prepare("SELECT username FROM USER WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $username = $user['username'];
    $stmt->close();
    
    // Delete user
    $stmt = $conn->prepare("DELETE FROM USER WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();
    
    // Log activity
    $action = "Deleted user: $username";
    $stmt = $conn->prepare("INSERT INTO ACTIVITY_LOG (user_id, action, timestamp) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $_SESSION['user_id'], $action);
    $stmt->execute();
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'User deleted successfully'
    ]);
    
    $conn->close();
}
?>
*/


/**
 * ============================================================================
 * get-users.php - Fetch Users List (AJAX Endpoint)
 * ============================================================================
 */

/*
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
*/


/**
 * ============================================================================
 * Usage Example in JavaScript
 * ============================================================================
 */

/*
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

function createUserRow(user, displayId) {
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
}
*/
?>