
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const InstallPWA: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
      console.log("PWA is already installed");
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome <= 67 from automatically showing the prompt
      e.preventDefault();
      // Save the event for later use
      setInstallPrompt(e);
      console.log("Install prompt captured and ready");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      console.log('PWA installed successfully');
      toast.success("App installed successfully! You can now access it from your home screen.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      toast.info("Installation not available at this moment. Please try again later.");
      return;
    }

    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success("Installing app...");
      } else {
        console.log('User dismissed the install prompt');
        toast.info("Installation cancelled. You can install later if you change your mind.");
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
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
      >
        <Download size={16} />
        Add to Home Screen
      </Button>
    </div>
  );
};

export default InstallPWA;
