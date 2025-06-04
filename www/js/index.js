document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {

    // Enable verbose logging for debugging (remove in production)
    window.plugins.OneSignal.Debug.setLogLevel(6);
    // Initialize with your OneSignal App ID
    window.plugins.OneSignal.initialize('d04df66e-dedc-40b9-9bb8-9922109636f4');

    let user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // If user is already logged in, set the OneSignal user ID
        window.plugins.OneSignal.login(user.customer.id.toString());
        console.log("User ID set for OneSignal: " + user.customer.id.toString());
    } else {
        console.log("No user logged in, skipping OneSignal user ID set.");
    }
    // Use this method to prompt for push notifications.
    // We recommend removing this method after testing and instead use In-App Messages to prompt for notification permission.
    window.plugins.OneSignal.Notifications.requestPermission(false).then((accepted) => {
      console.log("User accepted notifications: " + accepted);
    });
  
}