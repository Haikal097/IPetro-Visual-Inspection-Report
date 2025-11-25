// Login Page JavaScript

// Password Toggle Functionality
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈'; // Hide icon
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️'; // Show icon
    }
}

// Form Validation
function validateForm() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    let isValid = true;
    
    // Username validation
    if (username === '') {
        usernameInput.classList.add('error');
        isValid = false;
    } else if (username.length < 3) {
        showError('Username must be at least 3 characters long');
        usernameInput.classList.add('error');
        isValid = false;
    } else {
        usernameInput.classList.remove('error');
        usernameInput.classList.add('success');
    }
    
    // Password validation
    if (password === '') {
        passwordInput.classList.add('error');
        isValid = false;
    } else if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        passwordInput.classList.add('error');
        isValid = false;
    } else {
        passwordInput.classList.remove('error');
        passwordInput.classList.add('success');
    }
    
    return isValid;
}

// Show Error Message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = errorDiv.querySelector('.alert-text');
    
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show Success Message
function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.className = 'alert alert-success';
    errorDiv.querySelector('.alert-icon').textContent = '✓';
    errorDiv.querySelector('.alert-text').textContent = message;
    errorDiv.style.display = 'flex';
}

// Handle Form Submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Get form data
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Show loading state
    const submitBtn = document.querySelector('.btn-primary');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    
    try {
        // DEMO MODE: Simulate API call with timeout
        // Replace this with actual fetch to authenticate.php
        await simulateLogin(username, password, remember);
        
        /* PRODUCTION CODE:
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('remember', remember ? '1' : '0');
        
        const response = await fetch('authenticate.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = result.redirect || 'home.php';
            }, 1000);
        } else {
            showError(result.message || 'Invalid username or password');
            resetButton(submitBtn, btnText, btnLoader);
        }
        */
        
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.');
        resetButton(submitBtn, btnText, btnLoader);
    }
});

// Simulate Login (Demo purposes only)
async function simulateLogin(username, password, remember) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Demo credentials
            const validUsers = {
                'admin': 'admin123',
                'inspector': 'inspect123',
                'reviewer': 'review123'
            };
            
            if (validUsers[username] && validUsers[username] === password) {
                showSuccess('Login successful! Redirecting...');
                
                // Store session info (demo only - use server-side sessions in production)
                sessionStorage.setItem('user', username);
                sessionStorage.setItem('loggedIn', 'true');
                
                if (remember) {
                    localStorage.setItem('rememberedUser', username);
                }
                
                // Redirect after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
                
                resolve({ success: true });
            } else {
                showError('Invalid username or password');
                const submitBtn = document.querySelector('.btn-primary');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                resetButton(submitBtn, btnText, btnLoader);
                reject({ success: false });
            }
        }, 1500); // Simulate network delay
    });
}

// Reset Button State
function resetButton(submitBtn, btnText, btnLoader) {
    submitBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
}

// Clear error styling on input
document.getElementById('username').addEventListener('input', function() {
    this.classList.remove('error', 'success');
    document.getElementById('errorMessage').style.display = 'none';
});

document.getElementById('password').addEventListener('input', function() {
    this.classList.remove('error', 'success');
    document.getElementById('errorMessage').style.display = 'none';
});

// Check for remembered user on page load
window.addEventListener('DOMContentLoaded', function() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
    
    // Check if already logged in (demo only)
    const loggedIn = sessionStorage.getItem('loggedIn');
    if (loggedIn === 'true') {
        // Uncomment to auto-redirect if already logged in
        // window.location.href = 'home.php';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + U focuses username
    if (e.altKey && e.key === 'u') {
        e.preventDefault();
        document.getElementById('username').focus();
    }
    
    // Alt + P focuses password
    if (e.altKey && e.key === 'p') {
        e.preventDefault();
        document.getElementById('password').focus();
    }
});

// ============================================================================
// DEMO USER CREDENTIALS (Remove in production)
// ============================================================================
console.log('%c=== DEMO LOGIN CREDENTIALS ===', 'color: #dd1f2e; font-size: 16px; font-weight: bold;');
console.log('%cUsername: admin | Password: admin123', 'color: #27ae60; font-size: 14px;');
console.log('%cUsername: inspector | Password: inspect123', 'color: #27ae60; font-size: 14px;');
console.log('%cUsername: reviewer | Password: review123', 'color: #27ae60; font-size: 14px;');
console.log('%c==============================', 'color: #dd1f2e; font-size: 16px; font-weight: bold;');