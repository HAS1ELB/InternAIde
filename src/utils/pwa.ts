// PWA utilities for InternAIde

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Register service worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Handle install prompt
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = beforeInstallPromptEvent;
    // Update UI to notify the user they can install the PWA
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    // Hide the app-provided install promotion
    hideInstallButton();
    // Clear the deferredPrompt so it can be garbage collected
    deferredPrompt = null;
    // Optionally, send analytics event to indicate successful install
    console.log('PWA was installed');
  });
};

// Show install button
const showInstallButton = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
};

// Hide install button
const hideInstallButton = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
};

// Trigger install prompt
export const installPWA = async () => {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the deferred prompt since it can only be used once
    deferredPrompt = null;
    hideInstallButton();
  }
};

// Check if app is running in standalone mode
export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
};

// Check if device supports PWA installation
export const canInstall = () => {
  return deferredPrompt !== null;
};

// Initialize PWA features
export const initPWA = () => {
  registerServiceWorker();
  setupInstallPrompt();
};

// Offline storage utilities
export const saveDataOffline = (key: string, data: any) => {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
      synced: false
    }));
  } catch (error) {
    console.error('Failed to save data offline:', error);
  }
};

export const getOfflineData = (key: string) => {
  try {
    const item = localStorage.getItem(`offline_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return null;
  }
};

export const markDataSynced = (key: string) => {
  try {
    const item = getOfflineData(key);
    if (item) {
      item.synced = true;
      localStorage.setItem(`offline_${key}`, JSON.stringify(item));
    }
  } catch (error) {
    console.error('Failed to mark data as synced:', error);
  }
};

// Network status detection
export const isOnline = () => {
  return navigator.onLine;
};

export const setupNetworkListeners = () => {
  window.addEventListener('online', () => {
    console.log('App is online');
    // Sync offline data when back online
    syncOfflineData();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    // Show offline indicator
  });
};

// Sync offline data when back online
const syncOfflineData = () => {
  // This would typically sync with a backend API
  // For now, we'll just mark local data as synced
  const keys = Object.keys(localStorage).filter(key => key.startsWith('offline_'));
  keys.forEach(key => {
    const shortKey = key.replace('offline_', '');
    markDataSynced(shortKey);
  });
};