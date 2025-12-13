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
