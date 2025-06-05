export const API_URL = 'https://e8ajwpubl8.execute-api.ap-southeast-1.amazonaws.com/api';

/**
 * Send FCM token to server
 * @param {string} token - The FCM token
 * @param {string} userId - Optional user ID
 * @returns {Promise} - API response
 */
export async function saveFCMToken(token, userId = null) {
    return new Promise((resolve, reject) => {
        try {
            // Check if user is logged in
            const userString = localStorage.getItem('user');
            if (!userString || userString === 'null' || userString === 'undefined') {
                console.log('User not logged in, storing FCM token for later');
                localStorage.setItem('fcm_token_pending', token);
                localStorage.setItem('fcm_token_sent', 'false');
                resolve({ message: 'Token stored, will send when user logs in' });
                return;
            }

            let user;
            try {
                user = JSON.parse(userString);
            } catch (parseError) {
                console.log('Invalid user data, storing FCM token for later');
                localStorage.setItem('fcm_token_pending', token);
                localStorage.setItem('fcm_token_sent', 'false');
                resolve({ message: 'Token stored, will send when user logs in' });
                return;
            }

            // Check if user has valid token
            if (!user.token || !user.customer || !user.customer.id) {
                console.log('User not properly authenticated, storing FCM token for later');
                localStorage.setItem('fcm_token_pending', token);
                localStorage.setItem('fcm_token_sent', 'false');
                resolve({ message: 'Token stored, will send when user logs in' });
                return;
            }

            const deviceInfo = {
                token: token,
                userId: userId || user.customer.id.toString(),
                platform: 'android',
                timestamp: new Date().toISOString(),
                appVersion: '1.0.0',
                packageName: 'com.ecommerece.shop'
            };
            
            console.log('Sending FCM token to server:', deviceInfo);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_URL}/fcm/save`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            console.log('FCM token saved successfully:', result);
                            
                            // Store success flag
                            localStorage.setItem('fcm_token_sent', 'true');
                            localStorage.setItem('fcm_token_sent_time', new Date().toISOString());
                            
                            resolve(result);
                        } catch (parseError) {
                            console.error('Error parsing response:', parseError);
                            // Store failed attempt for retry
                            localStorage.setItem('fcm_token_pending', token);
                            localStorage.setItem('fcm_token_sent', 'false');
                            reject(parseError);
                        }
                    } else {
                        const error = new Error(`HTTP error! status: ${xhr.status}`);
                        console.error('Error saving FCM token:', error);
                        
                        // Store failed attempt for retry
                        localStorage.setItem('fcm_token_pending', token);
                        localStorage.setItem('fcm_token_sent', 'false');
                        
                        reject(error);
                    }
                }
            };

            xhr.onerror = function() {
                const error = new Error('Network error occurred');
                console.error('Error saving FCM token:', error);
                
                // Store failed attempt for retry
                localStorage.setItem('fcm_token_pending', token);
                localStorage.setItem('fcm_token_sent', 'false');
                
                reject(error);
            };

            xhr.send(JSON.stringify(deviceInfo));
        } catch (error) {
            console.error('Error saving FCM token:', error);
            
            // Store failed attempt for retry
            localStorage.setItem('fcm_token_pending', token);
            localStorage.setItem('fcm_token_sent', 'false');
            
            reject(error);
        }
    });
}

/**
 * Retry sending pending FCM token
 */
export async function retryPendingFCMToken() {
    // Check if user is logged in first
    const userString = localStorage.getItem('user');
    if (!userString || userString === 'null' || userString === 'undefined') {
        console.log('User not logged in, cannot retry FCM token');
        return;
    }

    let user;
    try {
        user = JSON.parse(userString);
    } catch (parseError) {
        console.log('Invalid user data, cannot retry FCM token');
        return;
    }

    if (!user.token || !user.customer || !user.customer.id) {
        console.log('User not properly authenticated, cannot retry FCM token');
        return;
    }

    const pendingToken = localStorage.getItem('fcm_token_pending');
    const tokenSent = localStorage.getItem('fcm_token_sent');
    
    if (pendingToken && tokenSent !== 'true') {
        try {
            await saveFCMToken(pendingToken);
            localStorage.removeItem('fcm_token_pending');
        } catch (error) {
            console.log('Retry sending FCM token failed, will try again later');
        }
    }
}

/**
 * Send pending FCM token after user login
 * This should be called after successful login
 */
export async function sendPendingFCMTokenAfterLogin() {
    const pendingToken = localStorage.getItem('fcm_token_pending');
    const tokenSent = localStorage.getItem('fcm_token_sent');
    
    if (pendingToken && tokenSent !== 'true') {
        try {
            console.log('User logged in, sending pending FCM token');
            await saveFCMToken(pendingToken);
            localStorage.removeItem('fcm_token_pending');
            console.log('Pending FCM token sent successfully after login');
        } catch (error) {
            console.error('Failed to send pending FCM token after login:', error);
        }
    }
}