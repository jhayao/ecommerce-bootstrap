import { API_URL } from './custom.js';
import $ from "jquery";

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
        });

        function displayError(message) {
            $('#errorContainer').text(message).show();
        }
    });
});