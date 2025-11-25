<?php
session_start();

// Database connection
require_once 'db-config.php'; // Create this file with your DB credentials

// Log the logout activity
if (isset($_SESSION['user_id'])) {
    $conn = getConnection();
    if ($conn) {
        $stmt = $conn->prepare("INSERT INTO ACTIVITY_LOG (user_id, action, timestamp) VALUES (?, 'User logged out', NOW())");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $stmt->close();
        $conn->close();
    }
}

// Clear all session variables
$_SESSION = array();

// Delete session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Delete remember me cookie
if (isset($_COOKIE['remember_token'])) {
    setcookie('remember_token', '', time() - 3600, '/');
}

// Destroy the session
session_destroy();

// Redirect to login page
header('Location: login.html?logout=success');
exit;