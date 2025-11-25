<?php
/**
 * iPetro Authentication System
 * Handles user login and session management
 */

// Start session
session_start();

// Database configuration (Update with your credentials)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'ipetro_db');

// Security settings
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_TIME', 900); // 15 minutes in seconds

// Create database connection
function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        return null;
    }
    
    return $conn;
}


// Sanitize input data
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}


// Check if user is locked out due to too many failed attempts

function isLockedOut($username, $conn) {
    $stmt = $conn->prepare("SELECT failed_attempts, last_attempt_time FROM USER WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        $failedAttempts = $user['failed_attempts'];
        $lastAttemptTime = strtotime($user['last_attempt_time']);
        $currentTime = time();
        
        // Check if user is locked out
        if ($failedAttempts >= MAX_LOGIN_ATTEMPTS) {
            $timeSinceLastAttempt = $currentTime - $lastAttemptTime;
            
            if ($timeSinceLastAttempt < LOCKOUT_TIME) {
                $remainingTime = LOCKOUT_TIME - $timeSinceLastAttempt;
                $minutes = ceil($remainingTime / 60);
                return [
                    'locked' => true,
                    'message' => "Account locked. Try again in {$minutes} minutes."
                ];
            } else {
                // Reset attempts after lockout period
                resetFailedAttempts($username, $conn);
            }
        }
    }
    
    return ['locked' => false];
}


// Reset failed login attempts
function resetFailedAttempts($username, $conn) {
    $stmt = $conn->prepare("UPDATE USER SET failed_attempts = 0 WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->close();
}


// Increment failed login attempts
function incrementFailedAttempts($username, $conn) {
    $stmt = $conn->prepare("UPDATE USER SET failed_attempts = failed_attempts + 1, last_attempt_time = NOW() WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->close();
}


// Log activity
function logActivity($userId, $action, $conn) {
    $stmt = $conn->prepare("INSERT INTO ACTIVITY_LOG (user_id, action, timestamp) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $userId, $action);
    $stmt->execute();
    $stmt->close();
}


// Main authentication logic
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get and sanitize input
    $username = sanitizeInput($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']) && $_POST['remember'] === '1';
    
    // Validate input
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit;
    }
    
    // Connect to database
    $conn = getConnection();
    
    if (!$conn) {
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit;
    }
    
    // Check if user is locked out
    $lockoutCheck = isLockedOut($username, $conn);
    if ($lockoutCheck['locked']) {
        echo json_encode([
            'success' => false,
            'message' => $lockoutCheck['message']
        ]);
        $conn->close();
        exit;
    }
    
    // Query user from database
    $stmt = $conn->prepare("SELECT user_id, username, password_hash, full_name, role, email FROM USER WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Verify password
        if (password_verify($password, $user['password_hash'])) {
            // Password is correct - Login successful
            
            // Reset failed attempts
            resetFailedAttempts($username, $conn);
            
            // Set session variables
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['logged_in'] = true;
            $_SESSION['login_time'] = time();
            
            // Set remember me cookie if requested
            if ($remember) {
                $token = bin2hex(random_bytes(32));
                setcookie('remember_token', $token, time() + (86400 * 30), "/"); // 30 days
                
                // Store token in database (should create a remember_tokens table)
                // $stmt = $conn->prepare("INSERT INTO remember_tokens (user_id, token, expires) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))");
                // $stmt->bind_param("is", $user['user_id'], $token);
                // $stmt->execute();
            }
            
            // Log the login activity
            logActivity($user['user_id'], 'User logged in', $conn);
            
            // Determine redirect based on role
            $redirect = 'home.php';
            switch ($user['role']) {
                case 'admin':
                    $redirect = 'admin-dashboard.php';
                    break;
                case 'inspector':
                    $redirect = 'home.php';
                    break;
                case 'reviewer':
                    $redirect = 'review-dashboard.php';
                    break;
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'redirect' => $redirect,
                'user' => [
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role']
                ]
            ]);
            
        } else {
            // Password is incorrect
            incrementFailedAttempts($username, $conn);
            
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password'
            ]);
        }
    } else {
        // User not found
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} else {
    // Not a POST request
    header('Location: login.html');
    exit;
}

