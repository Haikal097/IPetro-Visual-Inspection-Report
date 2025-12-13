// Dashboard JavaScript for iPetro Reporting System

// Initialize Chart on page load
let activityChart;
let currentFilter = 'week';
let currentSortColumn = -1;
let currentSortDirection = 'asc';
let rowsPerPage = 10;
let allTableRows = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    initializeTable();
});

// Initialize table and store all rows
function initializeTable() {
    const table = document.getElementById('reportTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    allTableRows = Array.from(tbody.getElementsByTagName('tr'));
    updatePaginationDisplay();
}

// Chart Initialization
function initializeChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    
    // Sample data - Week view
    const weekData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Reports Created',
                data: [3, 5, 2, 8, 4, 1, 2],
                backgroundColor: 'rgba(221, 31, 46, 0.2)',
                borderColor: 'rgba(221, 31, 46, 1)',
                borderWidth: 2,
                tension: 0.4
            },
            {
                label: 'Reports Completed',
                data: [2, 4, 3, 6, 5, 2, 1],
                backgroundColor: 'rgba(39, 174, 96, 0.2)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 2,
                tension: 0.4
            }
        ]
    };
    
    activityChart = new Chart(ctx, {
        type: 'bar',
        data: weekData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });
}

// Filter Chart by Time Period
function filterChart(period) {
    currentFilter = period;
    
    // Update button states
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let newData;
    
    if (period === 'week') {
        newData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Reports Created',
                    data: [3, 5, 2, 8, 4, 1, 2],
                    backgroundColor: 'rgba(221, 31, 46, 0.2)',
                    borderColor: 'rgba(221, 31, 46, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Reports Completed',
                    data: [2, 4, 3, 6, 5, 2, 1],
                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        };
    } else if (period === 'month') {
        newData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Reports Created',
                    data: [25, 32, 28, 35],
                    backgroundColor: 'rgba(221, 31, 46, 0.2)',
                    borderColor: 'rgba(221, 31, 46, 1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Reports Completed',
                    data: [23, 30, 26, 32],
                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        };
    }
    
    activityChart.data = newData;
    activityChart.update();
}

// Search Table Function
function searchTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    
    // Reset to first page when searching
    currentPage = 1;
    
    // Loop through all table rows
    allTableRows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        // Search through all cells in the row
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell) {
                const textValue = cell.textContent || cell.innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        // Mark row as filtered or not
        if (found || filter === '') {
            row.removeAttribute('data-filtered');
        } else {
            row.setAttribute('data-filtered', 'true');
            row.style.display = 'none';
        }
    });
    
    updatePaginationDisplay();
    updatePagination();
}

// Filter by Status
function filterByStatus() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    // Reset to first page when filtering
    currentPage = 1;
    
    // Loop through all table rows
    allTableRows.forEach(row => {
        const statusCell = row.getElementsByClassName('status-badge')[0];
        
        if (statusCell) {
            const statusText = statusCell.textContent.trim().toLowerCase().replace(' ', '-');
            
            if (statusFilter === 'all') {
                row.removeAttribute('data-filtered');
            } else if (statusText.includes(statusFilter.replace('_', '-'))) {
                row.removeAttribute('data-filtered');
            } else {
                row.setAttribute('data-filtered', 'true');
                row.style.display = 'none';
            }
        }
    });
    
    updatePaginationDisplay();
    updatePagination();
}

// View Report Function
function viewReport(reportId) {
    console.log('Viewing report:', reportId);
    // TODO: Redirect to report detail page
    // window.location.href = `view-report.php?id=${reportId}`;
    alert(`Viewing report: ${reportId}\n\nThis will redirect to the report details page.`);
}

// Edit Report Function
function editReport(reportId) {
    console.log('Editing report:', reportId);
    // TODO: Redirect to report edit page
    // window.location.href = `edit-report.php?id=${reportId}`;
    alert(`Editing report: ${reportId}\n\nThis will redirect to the report edit page.`);
}

// Download Report Function
function downloadReport(reportId) {
    console.log('Downloading report:', reportId);
    // TODO: Trigger report download
    // window.location.href = `download-report.php?id=${reportId}`;
    alert(`Downloading report: ${reportId}\n\nThis will generate and download the PDF report.`);
}

// Pagination Functions
let currentPage = 1;

function changePage(direction) {
    const visibleRows = getVisibleRows();
    const totalPages = Math.ceil(visibleRows.length / rowsPerPage);
    
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    
    updatePaginationDisplay();
    updatePagination();
}

function updatePaginationDisplay() {
    const visibleRows = getVisibleRows();
    const table = document.getElementById('reportTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    
    // Calculate start and end indices
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    // Hide all rows first
    allTableRows.forEach(row => row.style.display = 'none');
    
    // Show only rows for current page
    visibleRows.slice(startIndex, endIndex).forEach(row => {
        row.style.display = '';
    });
}

function getVisibleRows() {
    // Get rows that are not filtered out
    return allTableRows.filter(row => row.style.display !== 'none' || !row.hasAttribute('data-filtered'));
}

function updateRowsPerPage() {
    const input = document.getElementById('rowsPerPage');
    const value = parseInt(input.value);
    
    if (value >= 5 && value <= 50) {
        rowsPerPage = value;
        currentPage = 1; // Reset to first page
        updatePaginationDisplay();
        updatePagination();
    } else {
        alert('Please enter a number between 5 and 50');
        input.value = rowsPerPage;
    }
}

function updatePagination() {
    const visibleRows = getVisibleRows();
    const totalPages = Math.ceil(visibleRows.length / rowsPerPage);
    
    const pageButtons = document.querySelectorAll('.page-btn:not(:first-child):not(:last-child)');
    pageButtons.forEach((btn, index) => {
        if (index + 1 === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        // Hide buttons if page doesn't exist
        if (index + 1 > totalPages) {
            btn.style.display = 'none';
        } else {
            btn.style.display = '';
        }
    });
}

// ============================================================================
// TABLE SORTING FUNCTIONALITY
// ============================================================================

function sortTable(columnIndex) {
    const table = document.getElementById('reportTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    const headers = table.querySelectorAll('th.sortable');
    
    // Determine sort direction
    if (currentSortColumn === columnIndex) {
        // Toggle direction if clicking same column
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Reset to ascending for new column
        currentSortDirection = 'asc';
        currentSortColumn = columnIndex;
    }
    
    // Update header styles
    headers.forEach((header, index) => {
        header.classList.remove('asc', 'desc');
        if (index === columnIndex) {
            header.classList.add(currentSortDirection);
        }
    });
    
    // Get all visible rows
    const visibleRows = Array.from(allTableRows).filter(row => {
        return row.style.display !== 'none';
    });
    
    // Sort the rows
    visibleRows.sort((rowA, rowB) => {
        let cellA = rowA.getElementsByTagName('td')[columnIndex];
        let cellB = rowB.getElementsByTagName('td')[columnIndex];
        
        let valueA = getCellValue(cellA);
        let valueB = getCellValue(cellB);
        
        // Handle different data types
        if (columnIndex === 4) { // Date column
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        } else if (!isNaN(valueA) && !isNaN(valueB)) {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        } else {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) {
            return currentSortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return currentSortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // Reorder the rows in the table
    visibleRows.forEach(row => tbody.appendChild(row));
    
    // Update pagination after sorting
    currentPage = 1;
    updatePaginationDisplay();
}

function getCellValue(cell) {
    // Get text content, handling nested elements
    if (cell.querySelector('.equipment-info strong')) {
        return cell.querySelector('.equipment-info strong').textContent.trim();
    }
    if (cell.querySelector('.status-badge')) {
        return cell.querySelector('.status-badge').textContent.trim();
    }
    if (cell.querySelector('strong')) {
        return cell.querySelector('strong').textContent.trim();
    }
    return cell.textContent.trim();
}

// ============================================================================
// PHP INTEGRATION FUNCTIONS (For Future Implementation)
// ============================================================================

/*
// Example: Fetch statistics from database
async function loadStatistics() {
    try {
        const response = await fetch('api/get-statistics.php');
        const data = await response.json();
        
        // Update stat cards with real data
        document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = data.totalReports;
        document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = data.pendingReports;
        document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = data.completedReports;
        document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = data.thisWeekReports;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Example: Fetch activity chart data
async function loadChartData(period = 'week') {
    try {
        const response = await fetch(`api/get-chart-data.php?period=${period}`);
        const data = await response.json();
        
        // Update chart with real data
        activityChart.data.labels = data.labels;
        activityChart.data.datasets[0].data = data.created;
        activityChart.data.datasets[1].data = data.completed;
        activityChart.update();
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Example: Fetch report table data
async function loadReportData(page = 1, search = '', status = 'all') {
    try {
        const response = await fetch(`api/get-reports.php?page=${page}&search=${search}&status=${status}`);
        const data = await response.json();
        
        // Clear existing table rows
        const tbody = document.querySelector('#reportTable tbody');
        tbody.innerHTML = '';
        
        // Populate table with fetched data
        data.reports.forEach(report => {
            const row = createTableRow(report);
            tbody.appendChild(row);
        });
        
        // Update pagination
        updatePaginationInfo(data.totalPages, page);
    } catch (error) {
        console.error('Error loading report data:', error);
    }
}

// Helper function to create table row
function createTableRow(report) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><strong>${report.report_id}</strong></td>
        <td>
            <div class="equipment-info">
                <strong>${report.equipment_name}</strong>
                <span class="equipment-tag">${report.pmt_no}</span>
            </div>
        </td>
        <td>${report.created_by}</td>
        <td><span class="status-badge ${report.status}">${report.status_label}</span></td>
        <td>${report.creation_date}</td>
        <td>
            <div class="activity-info">
                <span class="activity-action">${report.last_activity}</span>
                <span class="activity-time">${report.activity_time}</span>
            </div>
        </td>
        <td>
            <button class="btn-action view" onclick="viewReport('${report.report_id}')">View</button>
            <button class="btn-action edit" onclick="editReport('${report.report_id}')">Edit</button>
        </td>
    `;
    return row;
}
*/

// ============================================================================
// DATABASE QUERY EXAMPLES (PHP Backend)
// ============================================================================

/*
// get-statistics.php
<?php
// Connect to database
include 'db-connect.php';

// Get total reports
$totalQuery = "SELECT COUNT(*) as total FROM REPORT";
$totalResult = mysqli_query($conn, $totalQuery);
$totalReports = mysqli_fetch_assoc($totalResult)['total'];

// Get pending reports
$pendingQuery = "SELECT COUNT(*) as total FROM REPORT WHERE status = 'pending'";
$pendingResult = mysqli_query($conn, $pendingQuery);
$pendingReports = mysqli_fetch_assoc($pendingResult)['total'];

// Get completed reports
$completedQuery = "SELECT COUNT(*) as total FROM REPORT WHERE status = 'completed'";
$completedResult = mysqli_query($conn, $completedQuery);
$completedReports = mysqli_fetch_assoc($completedResult)['total'];

// Get this week's reports
$weekQuery = "SELECT COUNT(*) as total FROM REPORT 
              WHERE YEARWEEK(creation_date) = YEARWEEK(NOW())";
$weekResult = mysqli_query($conn, $weekQuery);
$thisWeekReports = mysqli_fetch_assoc($weekResult)['total'];

// Return JSON
echo json_encode([
    'totalReports' => $totalReports,
    'pendingReports' => $pendingReports,
    'completedReports' => $completedReports,
    'thisWeekReports' => $thisWeekReports
]);
?>

// get-reports.php
<?php
include 'db-connect.php';

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$status = isset($_GET['status']) ? $_GET['status'] : 'all';
$limit = 10;
$offset = ($page - 1) * $limit;

// Build query
$query = "SELECT 
    r.report_id,
    r.status,
    r.creation_date,
    e.name as equipment_name,
    e.pmt_no,
    u.full_name as created_by,
    a.action as last_activity,
    a.timestamp as activity_time
FROM REPORT r
LEFT JOIN EQUIPMENT e ON r.equipment_id = e.equipment_id
LEFT JOIN USER u ON r.created_by_user = u.user_id
LEFT JOIN (
    SELECT report_id, action, timestamp 
    FROM ACTIVITY_LOG 
    WHERE (report_id, timestamp) IN (
        SELECT report_id, MAX(timestamp) 
        FROM ACTIVITY_LOG 
        GROUP BY report_id
    )
) a ON r.report_id = a.report_id
WHERE 1=1";

// Add search condition
if (!empty($search)) {
    $query .= " AND (r.report_id LIKE '%$search%' 
                 OR e.name LIKE '%$search%' 
                 OR u.full_name LIKE '%$search%')";
}

// Add status filter
if ($status !== 'all') {
    $query .= " AND r.status = '$status'";
}

$query .= " ORDER BY r.creation_date DESC LIMIT $limit OFFSET $offset";

$result = mysqli_query($conn, $query);
$reports = [];

while ($row = mysqli_fetch_assoc($result)) {
    $reports[] = $row;
}

// Get total count for pagination
$countQuery = "SELECT COUNT(*) as total FROM REPORT WHERE 1=1";
if (!empty($search)) {
    $countQuery .= " AND (report_id LIKE '%$search%' OR equipment_id IN (SELECT equipment_id FROM EQUIPMENT WHERE name LIKE '%$search%'))";
}
if ($status !== 'all') {
    $countQuery .= " AND status = '$status'";
}

$countResult = mysqli_query($conn, $countQuery);
$totalReports = mysqli_fetch_assoc($countResult)['total'];
$totalPages = ceil($totalReports / $limit);

echo json_encode([
    'reports' => $reports,
    'totalPages' => $totalPages,
    'currentPage' => $page
]);
?>
*/