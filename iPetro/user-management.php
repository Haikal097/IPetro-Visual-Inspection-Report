<?php
session_start();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.html');
    exit;
}

// Check if user is admin
if ($_SESSION['role'] !== 'admin') {
    header('Location: home.php');
    exit;
}

// Check session timeout (30 minutes)
if (isset($_SESSION['login_time'])) {
    if (time() - $_SESSION['login_time'] > 1800) {
        session_destroy();
        header('Location: login.html?timeout=true');
        exit;
    }
}
$_SESSION['login_time'] = time();

// Get user info
$username = $_SESSION['username'];
$fullName = $_SESSION['full_name'];
$role = $_SESSION['role'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!--Style-->
    <link rel="stylesheet" href="css/base-style.css">
    <link rel="stylesheet" href="css/home-style.css">
    <link rel="stylesheet" href="css/user-management-style.css">

    <title>iPetro - User Management</title>
</head>
<body>
    <header class="header">
        <a href="home.php">iPetro Reporting System</a>
        <div>
            <ul class="navbar">
                <li><a href="home.php">Home</a></li>
                <li><a href="create-report.php">Report</a></li>
                <li><a href="track.php">Track</a></li>
                <li><a href="user-management.php" class="active">Users</a></li>
                <li>
                    <span style="margin-right: 15px;">
                        Welcome, <?php echo htmlspecialchars($fullName); ?>
                    </span>
                    <a href="logout.php" style="color: #fff; font-weight: 600;">Logout</a>
                </li>
            </ul>
        </div>
    </header>

    <h2 class="text-center mt-2 mb-1" style="margin-top: 20px;">User Management</h2>

    <div class="container">
        <!-- Statistics Dashboard -->
        <div class="dashboard-section mb-3">
            <h2 class="section-title mb-2">User Statistics</h2>
            
            <div class="stats-grid">
                <!-- Total Users Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <h3 class="stat-number" id="totalUsers">28</h3>
                        <p class="stat-label">Total Users</p>
                    </div>
                </div>

                <!-- Admins Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                    <div class="stat-icon">👑</div>
                    <div class="stat-content">
                        <h3 class="stat-number" id="adminCount">3</h3>
                        <p class="stat-label">Administrators</p>
                    </div>
                </div>

                <!-- Reviewers Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">
                    <div class="stat-icon">📝</div>
                    <div class="stat-content">
                        <h3 class="stat-number" id="reviewerCount">7</h3>
                        <p class="stat-label">Reviewers</p>
                    </div>
                </div>

                <!-- Inspectors Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%);">
                    <div class="stat-icon">🔍</div>
                    <div class="stat-content">
                        <h3 class="stat-number" id="inspectorCount">18</h3>
                        <p class="stat-label">Inspectors</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="table-section">
            <h2 class="section-title">Manage Users</h2>
            <div class="table-header mb-2">
                <button class="page-btn" style="background-color:#229954; color: white;" onclick="openAddUserModal()">
                    + Add New User
                </button>
                <div class="search-filter-container">
                    <div class="rows-per-page">
                        <label for="rowsPerPage">Rows per page:</label>
                        <input type="number" id="rowsPerPage" min="5" max="50" value="10" onchange="updateRowsPerPage()">
                    </div>
                    <div class="search-box">
                        <input type="text" id="searchInput" placeholder="Search users..." onkeyup="searchTable()">
                        <span class="search-icon">🔍</span>
                    </div>
                    <select class="filter-select" id="roleFilter" onchange="filterByRole()">
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="inspector">Inspector</option>
                    </select>
                </div>
            </div>

            <div class="table-wrapper">
                <table class="report-table" id="userTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable(0)" class="sortable">
                                User ID
                                <span class="sort-icon">↕️</span>
                            </th>
                            <th onclick="sortTable(1)" class="sortable">
                                Full Name
                                <span class="sort-icon">↕️</span>
                            </th>
                            <th onclick="sortTable(2)" class="sortable">
                                Username
                                <span class="sort-icon">↕️</span>
                            </th>
                            <th onclick="sortTable(3)" class="sortable">
                                Email
                                <span class="sort-icon">↕️</span>
                            </th>
                            <th onclick="sortTable(4)" class="sortable">
                                Role
                                <span class="sort-icon">↕️</span>
                            </th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="userTableBody">
                        <!-- Sample Data - Will be replaced with PHP/Database -->
                        <tr data-user-id="1">
                            <td><strong>#001</strong></td>
                            <td>John Administrator</td>
                            <td>admin</td>
                            <td>admin@ipetro.com</td>
                            <td><span class="role-badge admin">Admin</span></td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-action edit" onclick="editUser(1)">✏️ Edit</button>
                                <button class="btn-action delete" onclick="confirmDelete(1)">🗑️ Delete</button>
                            </td>
                        </tr>
                        <tr data-user-id="2">
                            <td><strong>#002</strong></td>
                            <td>Jane Reviewer</td>
                            <td>jreviewer</td>
                            <td>jane.reviewer@ipetro.com</td>
                            <td><span class="role-badge reviewer">Reviewer</span></td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-action edit" onclick="editUser(2)">✏️ Edit</button>
                                <button class="btn-action delete" onclick="confirmDelete(2)">🗑️ Delete</button>
                            </td>
                        </tr>
                        <tr data-user-id="3">
                            <td><strong>#003</strong></td>
                            <td>Mike Inspector</td>
                            <td>minspector</td>
                            <td>mike.inspector@ipetro.com</td>
                            <td><span class="role-badge inspector">Inspector</span></td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-action edit" onclick="editUser(3)">✏️ Edit</button>
                                <button class="btn-action delete" onclick="confirmDelete(3)">🗑️ Delete</button>
                            </td>
                        </tr>
                        <tr data-user-id="4">
                            <td><strong>#004</strong></td>
                            <td>Sarah Smith</td>
                            <td>ssmith</td>
                            <td>sarah.smith@ipetro.com</td>
                            <td><span class="role-badge inspector">Inspector</span></td>
                            <td><span class="status-badge inactive">Inactive</span></td>
                            <td>
                                <button class="btn-action edit" onclick="editUser(4)">✏️ Edit</button>
                                <button class="btn-action delete" onclick="confirmDelete(4)">🗑️ Delete</button>
                            </td>
                        </tr>
                        <tr data-user-id="5">
                            <td><strong>#005</strong></td>
                            <td>David Chen</td>
                            <td>dchen</td>
                            <td>david.chen@ipetro.com</td>
                            <td><span class="role-badge reviewer">Reviewer</span></td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <button class="btn-action edit" onclick="editUser(5)">✏️ Edit</button>
                                <button class="btn-action delete" onclick="confirmDelete(5)">🗑️ Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination">
                <button class="page-btn" onclick="changePage('prev')">&laquo; Previous</button>
                <button class="page-btn active">1</button>
                <button class="page-btn">2</button>
                <button class="page-btn">3</button>
                <button class="page-btn" onclick="changePage('next')">Next &raquo;</button>
            </div>
        </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div id="userModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Add New User</h2>
                <span class="modal-close" onclick="closeUserModal()">&times;</span>
            </div>
            <form id="userForm" onsubmit="saveUser(event)">
                <input type="hidden" id="userId" name="user_id">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="fullName">Full Name <span class="required">*</span></label>
                        <input type="text" id="fullName" name="full_name" required>
                    </div>
                    <div class="form-group">
                        <label for="username">Username <span class="required">*</span></label>
                        <input type="text" id="username" name="username" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email <span class="required">*</span></label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="role">Role <span class="required">*</span></label>
                        <select id="role" name="role" required>
                            <option value="">-- Select Role --</option>
                            <option value="admin">Administrator</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="inspector">Inspector</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="password">Password <span class="required" id="passwordRequired">*</span></label>
                        <input type="password" id="password" name="password" autocomplete="new-password">
                        <small class="help-text">Minimum 6 characters. Leave blank to keep current password when editing.</small>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" name="confirm_password">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="userStatus">Status</label>
                        <select id="userStatus" name="status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeUserModal()">Cancel</button>
                    <button type="submit" class="btn-success" id="saveUserBtn">
                        <span class="btn-text">💾 Save User</span>
                        <span class="btn-loader" style="display: none;">
                            <span class="spinner"></span>
                            Saving...
                        </span>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h2>⚠️ Confirm Delete</h2>
                <span class="modal-close" onclick="closeDeleteModal()">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this user?</p>
                <p><strong id="deleteUserName"></strong></p>
                <p class="warning-text">This action cannot be undone!</p>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick="closeDeleteModal()">Cancel</button>
                <button type="button" class="btn-danger" onclick="deleteUser()">
                    🗑️ Delete User
                </button>
            </div>
        </div>
    </div>

    <script src="js/user-management.js"></script>
</body>
</html>