
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const InstallPWA: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome <= 67 from automatically showing the prompt
      e.preventDefault();
      // Save the event for later use
      setInstallPrompt(e);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      console.log('PWA installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }

    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Reset the install prompt variable
      setInstallPrompt(null);
    });
  };

  if (isAppInstalled || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={handleInstallClick} 
        className="flex items-center gap-2 bg-plc-blue hover:bg-blue-700 text-white shadow-lg"
      >
        <Download size={16} />
        Add to Home Screen
      </Button>
    </div>
  );
};

export default InstallPWA;
