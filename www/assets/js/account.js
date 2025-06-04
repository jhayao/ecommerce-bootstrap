import { API_URL } from './custom.js';


$(document).ready(function() {
    $('#registerForm').on('submit', function(event) {
        event.preventDefault();

        const email = $('#username').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const payload = {
            email: email,
            password: password
        };

        $.ajax({
            url: `${API_URL}/register`,
            type: 'POST',
            contentType: 'application/json',
            headers: { 
                "Accept": "application/json"   // Specifies expected response type
            },
            data: JSON.stringify(payload),
            success: function(data) {
                console.log('Registration successful:', data);
                window.location.href = 'login.html';
            },
            error: function(xhr) {
                if (xhr.status === 422) {
                    const errors = xhr.responseJSON.errors;
                    if (errors.email) {
                        console.error('Email error: ' + errors.email.join(', '));
                        displayError(errors.email.join(', '));
                    }
                    if (errors.password) {
                        displayError(errors.password.join(', '));
                        console.error('Password error: ' + errors.password.join(', '));
                    }
                } else {
                    console.error('Error during registration:', xhr);
                }
            }
        });

        function displayError(message) {
            $('#errorContainer').text(message).show();
        }
    });

    $('#loginForm').on('submit', function(event) {
        event.preventDefault();
        console.log('Login form submitted');

        const email = $('#loginUsername').val();
        const password = $('#loginPassword').val();

        const payload = {
            email: email,
            password: password
        };

        $.ajax({
            url: `${API_URL}/login`,
            type: 'POST',
            contentType: 'application/json',
            headers: { 
                "Accept": "application/json"   // Specifies expected response type
            },
            data: JSON.stringify(payload),
            success: function(data) {
                console.log('Login successful:', data);
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = 'dashboard.html';
            },
            error: function(xhr) {
                if (xhr.status === 401 || xhr.status === 404) {
                    displayError('Invalid credentials. Please try again.');
                } else {
                    console.error('Error during login:', xhr);
                }
            }
        });        function displayError(message) {
            $('#errorContainer').text(message).show();
        }
    });

    // Logout functionality
    function logout() {
        try {
            // Clear all authentication-related localStorage data
            localStorage.removeItem('user');
            localStorage.removeItem('user_id');
            
            // Clear FCM token related data
            localStorage.removeItem('fcm_token');
            localStorage.removeItem('fcm_token_pending');
            localStorage.removeItem('fcm_token_sent');
            localStorage.removeItem('fcm_token_sent_time');
            
            // Clear ecommerce related data
            localStorage.removeItem('user_orders');
            localStorage.removeItem('active_promotions');
            localStorage.removeItem('cart_reminder_shown');
            localStorage.removeItem('cart_reminder_time');
            localStorage.removeItem('price_drops');
            
            // Clear any other session data
            localStorage.removeItem('cart');
            localStorage.removeItem('wishlist');
            localStorage.removeItem('compare');
            
            console.log('User logged out successfully');
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error during logout:', error);
            // Force redirect even if there's an error
            window.location.href = 'login.html';
        }
    }

    // Make logout function globally available
    window.logout = logout;
    
});