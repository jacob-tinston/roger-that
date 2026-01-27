/**
 * Service Worker Registration Utility
 * Handles registration, updates, and lifecycle of the service worker
 */

export function registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    // Only register in production or when explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SW) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    if (!newWorker) {
                        return;
                    }

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('New service worker available');
                            // Optionally notify user here
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });

        // Handle service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload page when new service worker takes control
            window.location.reload();
        });
    });
}

/**
 * Unregister service worker (useful for development)
 */
export function unregisterServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    navigator.serviceWorker.ready
        .then((registration) => {
            registration.unregister();
            console.log('Service Worker unregistered');
        })
        .catch((error) => {
            console.error('Service Worker unregistration failed:', error);
        });
}
