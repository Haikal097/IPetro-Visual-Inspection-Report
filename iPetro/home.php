<?php
session_start();

// Check authentication
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.html');
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

    <title>iPetro - Home</title>
</head>
<body>
    <header class="header">
        <a href="home.php">iPetro Reporting System</a>
        <div>
            <ul class="navbar">
                <li><a href="home.php" class="active">Home</a></li>
                <li><a href="create-report.php">Report</a></li>
                <li><a href="home.php">Track</a></li>
                <li><a href="home.php">Check</a></li>
                <li>
                    <span style="margin-right: 15px;">
                        Welcome, <?php echo htmlspecialchars($fullName); ?>
                    </span>
                    <a href="logout.php" style="color: #fff; font-weight: 600;">Logout</a>
                </li>
            </ul>
        </div>
    </header>

    <h2 class="text-center mt-2 mb-1" style="margin-top: 20px;">Welcome to iPetro Report System</h2>

    <div class="container">
        <!-- Statistics Dashboard -->
        <div class="dashboard-section mb-3">
            <h2 class="section-title mb-2">Statistics Overview</h2>
            
            <div class="stats-grid">
                <!-- Total Reports Card -->
                <div class="stat-card primary-bg">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <h3 class="stat-number">247</h3>
                        <p class="stat-label">Total Reports</p>
                    </div>
                </div>

                <!-- Pending Reports Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-content">
                        <h3 class="stat-number">18</h3>
                        <p class="stat-label">Pending Review</p>
                    </div>
                </div>

                <!-- Completed Reports Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%);">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <h3 class="stat-number">215</h3>
                        <p class="stat-label">Completed</p>
                    </div>
                </div>

                <!-- This Week Card -->
                <div class="stat-card" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <h3 class="stat-number">12</h3>
                        <p class="stat-label">This Week</p>
                    </div>
                </div>
            </div>

            <!-- Activity Chart Section -->
            <div class="chart-section mt-3">
                <div class="chart-header">
                    <h3>Report Activity - Last 7 Days</h3>
                    <div class="chart-controls">
                        <button class="btn-filter active" onclick="filterChart('week')">Week</button>
                        <button class="btn-filter" onclick="filterChart('month')">Month</button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="activityChart"></canvas>
                </div>
            </div>

            <!-- Recent Reports Table -->
            <div class="table-section mt-3">
                <h2 class="section-title">Recent Reports & Activity</h2>
                <div class="table-header mb-2">
                    <button class="page-btn" style="background-color:#229954; color: white;" onclick="window.location.href='create-report.php'">+ New Report</button>
                    <div class="search-filter-container">
                        <div class="rows-per-page">
                            <label for="rowsPerPage">Rows per page:</label>
                            <input type="number" id="rowsPerPage" min="5" max="50" value="10" onchange="updateRowsPerPage()">
                        </div>
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Search by report ID, equipment, or user..." onkeyup="searchTable()">
                            <span class="search-icon">🔍</span>
                        </div>
                        <select class="filter-select" id="statusFilter" onchange="filterByStatus()">
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table class="report-table" id="reportTable">
                        <thead>
                            <tr>
                                <th onclick="sortTable(0)" class="sortable">
                                    Report ID 
                                    <span class="sort-icon">↕️</span>
                                </th>
                                <th onclick="sortTable(1)" class="sortable">
                                    Equipment 
                                    <span class="sort-icon">↕️</span>
                                </th>
                                <th onclick="sortTable(2)" class="sortable">
                                    Created By 
                                    <span class="sort-icon">↕️</span>
                                </th>
                                <th onclick="sortTable(3)" class="sortable">
                                    Status 
                                    <span class="sort-icon">↕️</span>
                                </th>
                                <th onclick="sortTable(4)" class="sortable">
                                    Created Date 
                                    <span class="sort-icon">↕️</span>
                                </th>
                                <th>Last Activity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Sample Data - Will be replaced with PHP/Database -->
                            <tr>
                                <td><strong>RPT-2025-001</strong></td>
                                <td>
                                    <div class="equipment-info">
                                        <strong>Pressure Vessel V-101</strong>
                                        <span class="equipment-tag">PMT-12345</span>
                                    </div>
                                </td>
                                <td>John Doe</td>
                                <td><span class="status-badge pending">Pending Review</span></td>
                                <td>2025-11-10</td>
                                <td>
                                    <div class="activity-info">
                                        <span class="activity-action">Report Created</span>
                                        <span class="activity-time">2 hours ago</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-action view" onclick="viewReport('RPT-2025-001')">View</button>
                                    <button class="btn-action edit" onclick="editReport('RPT-2025-001')">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>RPT-2025-002</strong></td>
                                <td>
                                    <div class="equipment-info">
                                        <strong>Heat Exchanger HE-205</strong>
                                        <span class="equipment-tag">PMT-12346</span>
                                    </div>
                                </td>
                                <td>Jane Smith</td>
                                <td><span class="status-badge in-review">In Review</span></td>
                                <td>2025-11-09</td>
                                <td>
                                    <div class="activity-info">
                                        <span class="activity-action">Reviewer Added Comments</span>
                                        <span class="activity-time">5 hours ago</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-action view" onclick="viewReport('RPT-2025-002')">View</button>
                                    <button class="btn-action edit" onclick="editReport('RPT-2025-002')">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>RPT-2025-003</strong></td>
                                <td>
                                    <div class="equipment-info">
                                        <strong>Reactor R-301</strong>
                                        <span class="equipment-tag">PMT-12347</span>
                                    </div>
                                </td>
                                <td>Mike Johnson</td>
                                <td><span class="status-badge completed">Completed</span></td>
                                <td>2025-11-08</td>
                                <td>
                                    <div class="activity-info">
                                        <span class="activity-action">Report Approved</span>
                                        <span class="activity-time">1 day ago</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-action view" onclick="viewReport('RPT-2025-003')">View</button>
                                    <button class="btn-action download" onclick="downloadReport('RPT-2025-003')">Download</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>RPT-2025-004</strong></td>
                                <td>
                                    <div class="equipment-info">
                                        <strong>Separator S-110</strong>
                                        <span class="equipment-tag">PMT-12348</span>
                                    </div>
                                </td>
                                <td>Sarah Lee</td>
                                <td><span class="status-badge pending">Pending Review</span></td>
                                <td>2025-11-10</td>
                                <td>
                                    <div class="activity-info">
                                        <span class="activity-action">Photos Uploaded</span>
                                        <span class="activity-time">3 hours ago</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-action view" onclick="viewReport('RPT-2025-004')">View</button>
                                    <button class="btn-action edit" onclick="editReport('RPT-2025-004')">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>RPT-2025-005</strong></td>
                                <td>
                                    <div class="equipment-info">
                                        <strong>Accumulator A-402</strong>
                                        <span class="equipment-tag">PMT-12349</span>
                                    </div>
                                </td>
                                <td>David Chen</td>
                                <td><span class="status-badge rejected">Rejected</span></td>
                                <td>2025-11-07</td>
                                <td>
                                    <div class="activity-info">
                                        <span class="activity-action">Revision Requested</span>
                                        <span class="activity-time">2 days ago</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-action view" onclick="viewReport('RPT-2025-005')">View</button>
                                    <button class="btn-action edit" onclick="editReport('RPT-2025-005')">Edit</button>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>RPT-2025-006</strong></td>
                                <td>
                                    <div class="equipment-info">
                                        <strong>Condenser C-201</strong>
                                        <span class="equipment-tag">PMT-12350</span>
                                    </div>
                                </td>
                                <td>Emily Wong</td>
                                <td><span class="status-badge completed">Completed</span></td>
                                <td>2025-11-06</td>
                                <td>
                                    <div class="activity-info">
                                        <span class="activity-action">Report Finalized</span>
                                        <span class="activity-time">3 days ago</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn-action view" onclick="viewReport('RPT-2025-006')">View</button>
                                    <button class="btn-action download" onclick="downloadReport('RPT-2025-006')">Download</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="pagination">
                    <button class="page-btn" onclick="changePage('prev')">&laquo; Previous</button>
                    <button class="page-btn active" onclick="currentPage=1; updatePaginationDisplay(); updatePagination();">1</button>
                    <button class="page-btn" onclick="currentPage=2; updatePaginationDisplay(); updatePagination();">2</button>
                    <button class="page-btn" onclick="currentPage=3; updatePaginationDisplay(); updatePagination();">3</button>
                    <button class="page-btn" onclick="currentPage=4; updatePaginationDisplay(); updatePagination();">4</button>
                    <button class="page-btn" onclick="currentPage=5; updatePaginationDisplay(); updatePagination();">5</button>
                    <button class="page-btn" onclick="changePage('next')">Next &raquo;</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Include Chart.js for activity chart -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>