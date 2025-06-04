/**
 * Ecommerce App Notification Service
 * Handles push notifications integration with the ecommerce features
 */

class EcommerceNotificationService {
    constructor() {
        this.cartBadge = null;
        this.init();
    }

    init() {
        document.addEventListener('deviceready', () => {
            this.setupNotificationHandlers();
            this.initializeCartBadge();
        });
    }

    setupNotificationHandlers() {
        // Listen for push notification events
        document.addEventListener('messageReceived', (event) => {
            this.handleEcommerceNotification(event.detail);
        });

        // Auto-subscribe to relevant topics when token is received
        document.addEventListener('tokenReceived', () => {
            this.subscribeToEcommerceTopics();
        });
    }

    initializeCartBadge() {
        // Find cart badge element
        this.cartBadge = document.querySelector('.cart-badge') || 
                        document.querySelector('[data-cart-count]') ||
                        document.querySelector('.cart-count');
    }

    handleEcommerceNotification(notificationData) {
        const { payload, type } = notificationData;
        const data = payload.data || {};

        switch (data.type) {
            case 'order_update':
                this.handleOrderUpdate(data);
                break;
            case 'promotion':
                this.handlePromotion(data);
                break;
            case 'cart_reminder':
                this.handleCartReminder(data);
                break;
            case 'price_drop':
                this.handlePriceDrop(data);
                break;
            case 'restock':
                this.handleRestock(data);
                break;
            case 'wishlist_discount':
                this.handleWishlistDiscount(data);
                break;
            default:
                console.log('Unhandled notification type:', data.type);
        }
    }

    handleOrderUpdate(data) {
        const { orderId, status, message } = data;
        
        // Update order status in localStorage if it exists
        const orders = JSON.parse(localStorage.getItem('user_orders') || '[]');
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = status;
            orders[orderIndex].lastUpdate = new Date().toISOString();
            localStorage.setItem('user_orders', JSON.stringify(orders));
        }

        // Show order status notification
        this.showOrderNotification(orderId, status, message);
    }

    handlePromotion(data) {
        const { promotionId, discountPercent, validUntil, productIds } = data;
        
        // Store promotion in localStorage
        const promotions = JSON.parse(localStorage.getItem('active_promotions') || '[]');
        promotions.push({
            id: promotionId,
            discount: discountPercent,
            validUntil: validUntil,
            productIds: productIds || [],
            notified: true,
            receivedAt: new Date().toISOString()
        });
        localStorage.setItem('active_promotions', JSON.stringify(promotions));

        // Show promotion banner if on relevant page
        this.showPromotionBanner(data);
    }

    handleCartReminder(data) {
        const { cartItems, reminderType } = data;
        
        // Update cart badge with reminder styling
        this.animateCartBadge();
        
        // Store reminder flag
        localStorage.setItem('cart_reminder_shown', 'true');
        localStorage.setItem('cart_reminder_time', new Date().toISOString());
    }

    handlePriceDrop(data) {
        const { productId, oldPrice, newPrice, productName } = data;
        
        // Store price drop notification
        const priceDrops = JSON.parse(localStorage.getItem('price_drops') || '[]');
        priceDrops.push({
            productId: productId,
            oldPrice: oldPrice,
            newPrice: newPrice,
            productName: productName,
            notifiedAt: new Date().toISOString()
        });
        localStorage.setItem('price_drops', JSON.stringify(priceDrops));

        // Show price drop alert
        this.showPriceDropAlert(data);
    }

    handleRestock(data) {
        const { productId, productName, availableQuantity } = data;
        
        // Remove from wishlist's out-of-stock items
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const updatedWishlist = wishlist.map(item => {
            if (item.productId === productId) {
                item.inStock = true;
                item.restockNotifiedAt = new Date().toISOString();
            }
            return item;
        });
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    }

    handleWishlistDiscount(data) {
        const { productId, discountPercent, validUntil } = data;
        
        // Update wishlist item with discount info
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const updatedWishlist = wishlist.map(item => {
            if (item.productId === productId) {
                item.hasDiscount = true;
                item.discountPercent = discountPercent;
                item.discountValidUntil = validUntil;
            }
            return item;
        });
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));

        // Show wishlist discount badge
        this.showWishlistDiscountBadge();
    }

    subscribeToEcommerceTopics() {
        if (!window.PushNotificationManager) return;

        const userId = localStorage.getItem('user_id');
        const userPreferences = JSON.parse(localStorage.getItem('notification_preferences') || '{}');

        // Subscribe to general topics
        window.PushNotificationManager.subscribeToTopic('all_users');
        
        // Subscribe based on user preferences
        if (userPreferences.promotions !== false) {
            window.PushNotificationManager.subscribeToTopic('promotions');
        }
        
        if (userPreferences.orderUpdates !== false) {
            window.PushNotificationManager.subscribeToTopic('order_updates');
        }
        
        if (userPreferences.priceDrops !== false) {
            window.PushNotificationManager.subscribeToTopic('price_drops');
        }
        
        if (userPreferences.restockAlerts !== false) {
            window.PushNotificationManager.subscribeToTopic('restock_alerts');
        }

        // Subscribe to user-specific topics
        if (userId) {
            window.PushNotificationManager.subscribeToTopic(`user_${userId}`);
            window.PushNotificationManager.subscribeToTopic(`user_${userId}_orders`);
        }

        // Subscribe to category-specific topics based on browsing history
        const browsingCategories = JSON.parse(localStorage.getItem('browsing_categories') || '[]');
        browsingCategories.forEach(category => {
            window.PushNotificationManager.subscribeToTopic(`category_${category}`);
        });
    }

    showOrderNotification(orderId, status, message) {
        // Create a custom notification element for order updates
        const notification = document.createElement('div');
        notification.className = 'order-notification';
        notification.innerHTML = `
            <div class="order-notification-content">
                <div class="order-icon">📦</div>
                <div class="order-details">
                    <div class="order-title">Order Update</div>
                    <div class="order-message">${message || `Order ${orderId} is now ${status}`}</div>
                </div>
                <button class="view-order-btn" onclick="viewOrder('${orderId}')">View Order</button>
            </div>
        `;
        
        // Add order notification styles
        this.addOrderNotificationStyles();
        
        document.body.appendChild(notification);
        
        // Auto remove after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 8000);
    }

    showPromotionBanner(data) {
        const { promotionId, discountPercent, message } = data;
        
        // Only show if not on checkout pages
        const currentPage = window.location.pathname;
        if (currentPage.includes('checkout') || currentPage.includes('payment')) {
            return;
        }

        const banner = document.createElement('div');
        banner.className = 'promotion-banner';
        banner.innerHTML = `
            <div class="promotion-content">
                <span class="promotion-icon">🎉</span>
                <span class="promotion-text">${message || `${discountPercent}% OFF on selected items!`}</span>
                <button class="promotion-cta" onclick="viewPromotion('${promotionId}')">Shop Now</button>
                <button class="promotion-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add promotion banner styles
        this.addPromotionBannerStyles();
        
        // Insert at top of page
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        }, 10000);
    }

    showPriceDropAlert(data) {
        const { productName, oldPrice, newPrice } = data;
        const savings = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
        
        const alert = document.createElement('div');
        alert.className = 'price-drop-alert';
        alert.innerHTML = `
            <div class="price-drop-content">
                <div class="price-drop-icon">💰</div>
                <div class="price-drop-details">
                    <div class="price-drop-title">Price Drop Alert!</div>
                    <div class="price-drop-text">${productName} is now ${savings}% off!</div>
                    <div class="price-drop-prices">
                        <span class="old-price">$${oldPrice}</span>
                        <span class="new-price">$${newPrice}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.addPriceDropStyles();
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 7000);
    }

    animateCartBadge() {
        if (this.cartBadge) {
            this.cartBadge.classList.add('cart-badge-pulse');
            setTimeout(() => {
                this.cartBadge.classList.remove('cart-badge-pulse');
            }, 2000);
        }
    }

    showWishlistDiscountBadge() {
        const wishlistIcon = document.querySelector('.wishlist-icon') || 
                           document.querySelector('[data-wishlist]');
        
        if (wishlistIcon) {
            const badge = document.createElement('span');
            badge.className = 'wishlist-discount-badge';
            badge.textContent = '!';
            wishlistIcon.appendChild(badge);
            
            setTimeout(() => {
                if (badge.parentNode) {
                    badge.parentNode.removeChild(badge);
                }
            }, 5000);
        }
    }

    addOrderNotificationStyles() {
        if (document.getElementById('order-notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'order-notification-styles';
        styles.textContent = `
            .order-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border-radius: 12px;
                z-index: 10001;
                max-width: 350px;
                animation: slideUp 0.3s ease-out;
            }
            
            .order-notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .order-icon {
                font-size: 24px;
            }
            
            .order-details {
                flex: 1;
            }
            
            .order-title {
                font-weight: bold;
                color: #333;
                margin-bottom: 4px;
            }
            
            .order-message {
                color: #666;
                font-size: 14px;
            }
            
            .view-order-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    addPromotionBannerStyles() {
        if (document.getElementById('promotion-banner-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'promotion-banner-styles';
        styles.textContent = `
            .promotion-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #ff6b6b, #feca57);
                color: white;
                z-index: 10002;
                animation: slideDown 0.3s ease-out;
            }
            
            .promotion-content {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px;
                gap: 12px;
                position: relative;
            }
            
            .promotion-icon {
                font-size: 18px;
            }
            
            .promotion-text {
                font-weight: 500;
            }
            
            .promotion-cta {
                background: white;
                color: #ff6b6b;
                border: none;
                padding: 6px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
            }
            
            .promotion-close {
                position: absolute;
                right: 12px;
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                width: 24px;
                height: 24px;
            }
            
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(styles);
    }

    addPriceDropStyles() {
        if (document.getElementById('price-drop-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'price-drop-styles';
        styles.textContent = `
            .price-drop-alert {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                border-radius: 16px;
                z-index: 10003;
                animation: popIn 0.3s ease-out;
                border: 2px solid #4CAF50;
            }
            
            .price-drop-content {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                max-width: 300px;
            }
            
            .price-drop-icon {
                font-size: 32px;
            }
            
            .price-drop-title {
                font-weight: bold;
                color: #4CAF50;
                margin-bottom: 4px;
            }
            
            .price-drop-text {
                color: #333;
                margin-bottom: 8px;
            }
            
            .price-drop-prices {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .old-price {
                text-decoration: line-through;
                color: #999;
            }
            
            .new-price {
                font-weight: bold;
                color: #4CAF50;
                font-size: 18px;
            }
            
            .cart-badge-pulse {
                animation: pulse 1s infinite;
            }
            
            .wishlist-discount-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            @keyframes popIn {
                from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(styles);
    }

    // Utility methods for notification handlers
    updateNotificationPreferences(preferences) {
        localStorage.setItem('notification_preferences', JSON.stringify(preferences));
        // Re-subscribe to topics based on new preferences
        this.subscribeToEcommerceTopics();
    }

    getNotificationHistory() {
        return {
            orders: JSON.parse(localStorage.getItem('user_orders') || '[]'),
            promotions: JSON.parse(localStorage.getItem('active_promotions') || '[]'),
            priceDrops: JSON.parse(localStorage.getItem('price_drops') || '[]'),
            wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]')
        };
    }
}

// Global functions for notification actions
window.viewOrder = function(orderId) {
    window.location.href = `order-tracking.html?id=${orderId}`;
};

window.viewPromotion = function(promotionId) {
    window.location.href = `shop-default.html?promotion=${promotionId}`;
};

// Initialize the ecommerce notification service
const ecommerceNotificationService = new EcommerceNotificationService();

// Export for global access
window.EcommerceNotificationService = ecommerceNotificationService;
