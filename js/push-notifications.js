/**
 * Push Notifications Handler for Ecommerce App
 * Firebase Cloud Messaging (FCM) integration
 */

class PushNotificationManager {
    constructor() {
        this.isInitialized = false;
        this.token = null;
        this.init();
    }

    /**
     * Initialize push notifications
     */
    init() {
        document.addEventListener('deviceready', () => {
            this.setupFirebaseMessaging();
        }, false);
    }

    /**
     * Setup Firebase Messaging
     */
    setupFirebaseMessaging() {
        // Request permission for notifications
        this.requestPermission();

        // Get FCM token
        this.getToken();

        // Listen for messages
        this.onMessage();

        // Listen for token refresh
        this.onTokenRefresh();

        this.isInitialized = true;
        console.log('Push notifications initialized');
    }

    /**
     * Request notification permission
     */
    requestPermission() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            window.cordova.plugins.firebase.messaging.requestPermission({
                forceShow: true
            }).then(() => {
                console.log('Notification permission granted');
            }).catch((error) => {
                console.error('Notification permission denied:', error);
            });
        }
    }

    /**
     * Get FCM registration token
     */
    getToken() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            window.cordova.plugins.firebase.messaging.getToken().then((token) => {
                this.token = token;
                console.log('FCM Token:', token);
                
                // Store token in localStorage for later use
                localStorage.setItem('fcm_token', token);
                
                // Send token to your server
                this.sendTokenToServer(token);
                
                // Trigger custom event
                this.triggerEvent('tokenReceived', { token: token });
            }).catch((error) => {
                console.error('Error getting FCM token:', error);
            });
        }
    }

    /**
     * Listen for incoming messages
     */
    onMessage() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            // Listen for messages when app is in foreground
            window.cordova.plugins.firebase.messaging.onMessage((payload) => {
                console.log('Message received in foreground:', payload);
                this.handleForegroundMessage(payload);
            });

            // Listen for messages when app is in background or closed
            window.cordova.plugins.firebase.messaging.onBackgroundMessage((payload) => {
                console.log('Message received in background:', payload);
                this.handleBackgroundMessage(payload);
            });
        }
    }

    /**
     * Listen for token refresh
     */
    onTokenRefresh() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            window.cordova.plugins.firebase.messaging.onTokenRefresh((token) => {
                console.log('FCM Token refreshed:', token);
                this.token = token;
                localStorage.setItem('fcm_token', token);
                this.sendTokenToServer(token);
                this.triggerEvent('tokenRefreshed', { token: token });
            });
        }
    }

    /**
     * Handle foreground messages
     */
    handleForegroundMessage(payload) {
        const { notification, data } = payload;
        
        // Show in-app notification
        this.showInAppNotification(notification);
        
        // Handle notification action
        this.handleNotificationAction(data);
        
        // Trigger custom event
        this.triggerEvent('messageReceived', { payload, type: 'foreground' });
    }

    /**
     * Handle background messages
     */
    handleBackgroundMessage(payload) {
        const { notification, data } = payload;
        
        console.log('Background message handled:', payload);
        
        // Handle notification action
        this.handleNotificationAction(data);
        
        // Trigger custom event
        this.triggerEvent('messageReceived', { payload, type: 'background' });
    }

    /**
     * Show in-app notification for foreground messages
     */
    showInAppNotification(notification) {
        if (!notification) return;

        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.className = 'push-notification-toast';
        notificationEl.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${notification.title || 'Notification'}</div>
                <div class="notification-body">${notification.body || ''}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles
        this.addNotificationStyles();

        // Add to page
        document.body.appendChild(notificationEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        }, 5000);

        // Close button functionality
        notificationEl.querySelector('.notification-close').addEventListener('click', () => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        });

        // Click notification to handle action
        notificationEl.addEventListener('click', () => {
            this.handleNotificationAction(notification.data || {});
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        });
    }

    /**
     * Handle notification actions based on data
     */
    handleNotificationAction(data) {
        if (!data) return;

        // Handle different notification types
        switch (data.type) {
            case 'product':
                this.navigateToProduct(data.productId);
                break;
            case 'order':
                this.navigateToOrder(data.orderId);
                break;
            case 'promotion':
                this.navigateToPromotion(data.promotionId);
                break;
            case 'cart':
                this.navigateToCart();
                break;
            case 'url':
                this.openUrl(data.url);
                break;
            default:
                console.log('Unknown notification type:', data.type);
        }
    }

    /**
     * Navigation methods
     */
    navigateToProduct(productId) {
        if (productId) {
            window.location.href = `product-default.html?id=${productId}`;
        }
    }

    navigateToOrder(orderId) {
        if (orderId) {
            window.location.href = `order-tracking.html?id=${orderId}`;
        }
    }

    navigateToPromotion(promotionId) {
        if (promotionId) {
            window.location.href = `shop-default.html?promotion=${promotionId}`;
        }
    }

    navigateToCart() {
        window.location.href = 'cart.html';
    }

    openUrl(url) {
        if (url) {
            if (window.cordova && window.cordova.InAppBrowser) {
                window.cordova.InAppBrowser.open(url, '_blank');
            } else {
                window.open(url, '_blank');
            }
        }
    }

    /**
     * Send token to your server
     */
    sendTokenToServer(token) {
        // Import the API functions
        import('../assets/js/custom.js').then(({ saveFCMToken, retryPendingFCMToken }) => {
            // Send FCM token to your API
            saveFCMToken(token)
                .then(result => {
                    console.log('FCM token sent to server successfully:', result);
                })
                .catch(error => {
                    console.error('Failed to send FCM token to server:', error);
                    // Token will be stored for retry in the saveFCMToken function
                });
            
            // Also retry any pending tokens
            retryPendingFCMToken();
        }).catch(error => {
            console.error('Error importing custom.js:', error);
            
            // Fallback: direct API call without import
            this.sendTokenDirectly(token);
        });
    }
    
    /**
     * Fallback method to send token directly
     */
    sendTokenDirectly(token) {
        const API_URL = 'https://e8ajwpubl8.execute-api.ap-southeast-1.amazonaws.com/api';
        
        // Get user info if available
        const userId = localStorage.getItem('user_id') || 'anonymous';
        
        const data = {
            token: token,
            userId: userId,
            platform: 'android',
            timestamp: new Date().toISOString(),
            appVersion: '1.0.0',
            packageName: 'com.ecommerece.shop'
        };

        fetch(`${API_URL}/saveFCM`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('FCM token sent to server successfully (fallback):', result);
            localStorage.setItem('fcm_token_sent', 'true');
            localStorage.setItem('fcm_token_sent_time', new Date().toISOString());
        })
        .catch(error => {
            console.error('Error sending token to server (fallback):', error);
            localStorage.setItem('fcm_token_pending', token);
            localStorage.setItem('fcm_token_sent', 'false');
        });
    }

    /**
     * Add notification toast styles
     */
    addNotificationStyles() {
        if (document.getElementById('push-notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'push-notification-styles';
        styles.textContent = `
            .push-notification-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                display: flex;
                align-items: flex-start;
                cursor: pointer;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .notification-body {
                font-size: 12px;
                opacity: 0.9;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Trigger custom events
     */
    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * Subscribe to topic
     */
    subscribeToTopic(topic) {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            window.cordova.plugins.firebase.messaging.subscribe(topic).then(() => {
                console.log(`Subscribed to topic: ${topic}`);
            }).catch((error) => {
                console.error(`Error subscribing to topic ${topic}:`, error);
            });
        }
    }

    /**
     * Unsubscribe from topic
     */
    unsubscribeFromTopic(topic) {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            window.cordova.plugins.firebase.messaging.unsubscribe(topic).then(() => {
                console.log(`Unsubscribed from topic: ${topic}`);
            }).catch((error) => {
                console.error(`Error unsubscribing from topic ${topic}:`, error);
            });
        }
    }

    /**
     * Get stored FCM token
     */
    getStoredToken() {
        return localStorage.getItem('fcm_token');
    }

    /**
     * Clear badge number (if supported)
     */
    clearBadge() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.firebase) {
            window.cordova.plugins.firebase.messaging.setBadgeNumber(0);
        }
    }
}

// Initialize push notifications
const pushNotificationManager = new PushNotificationManager();

// Example usage:
// Subscribe to topics
document.addEventListener('tokenReceived', (event) => {
    const { token } = event.detail;
    
    // Subscribe to general topics
    pushNotificationManager.subscribeToTopic('all_users');
    pushNotificationManager.subscribeToTopic('promotions');
    
    // Subscribe to user-specific topics if user is logged in
    const userId = localStorage.getItem('user_id');
    if (userId) {
        pushNotificationManager.subscribeToTopic(`user_${userId}`);
    }
});

// Handle received messages
document.addEventListener('messageReceived', (event) => {
    const { payload, type } = event.detail;
    console.log(`Message received (${type}):`, payload);
    
    // Update UI based on message type
    if (payload.data && payload.data.type === 'cart') {
        // Update cart badge or indicator
        updateCartIndicator();
    }
});

// Export for global access
window.PushNotificationManager = pushNotificationManager;
