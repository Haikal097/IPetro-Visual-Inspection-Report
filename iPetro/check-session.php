<?php
// Include this at the top of any protected page (e.g., home.php, dashboard.php)

session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    // Not logged in - redirect to login
    header('Location: login.html');
    exit;
}

// Check session timeout (optional - 30 minutes)
$timeout_duration = 1800; // 30 minutes in seconds

if (isset($_SESSION['login_time'])) {
    $elapsed_time = time() - $_SESSION['login_time'];
    
    if ($elapsed_time > $timeout_duration) {
        // Session expired
        session_unset();
        session_destroy();
        header('Location: login.html?timeout=true');
        exit;
    }
}

// Update last activity time
$_SESSION['login_time'] = time();

// Session is valid - user can access the page
