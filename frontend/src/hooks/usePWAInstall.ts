import { useState, useEffect, useCallback } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    setDeferredPrompt(e);
    // Update UI notify the user they can install the PWA
    setIsAppInstalled(false);
  }, []);

  const handleAppInstalled = useCallback(() => {
    // Hide the install button
    setDeferredPrompt(null);
    setIsAppInstalled(true);
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if the app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  const promptInstall = useCallback(() => {
    if (deferredPrompt) {
      // Show the prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
      });
    }
  }, [deferredPrompt]);

  return { deferredPrompt, isAppInstalled, promptInstall };
};
