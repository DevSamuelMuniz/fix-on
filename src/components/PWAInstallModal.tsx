import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa-install-modal-dismissed';
const SHOW_DELAY_MS = 60000; // 1 minute

export function PWAInstallModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    
    if (isStandalone || wasDismissed) return;

    // Detect iOS
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show modal after 1 minute
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Don't render if already installed or no prompt available (except iOS)
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary/20 to-purple-500/20 p-6 pb-4">
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Instale o Fix-On</h2>
                    <p className="text-sm text-muted-foreground">Acesse mais rápido!</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-4">
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Acesso direto da tela inicial
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Funciona offline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Carrega mais rápido
                  </li>
                </ul>

                {/* Install Button (Android/Desktop) */}
                {deferredPrompt && (
                  <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                    <Download className="h-5 w-5" />
                    Instalar Agora
                  </Button>
                )}

                {/* iOS Instructions */}
                {isIOS && !deferredPrompt && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Share className="h-4 w-4" />
                      No Safari:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 pl-6">
                      <li>1. Toque em <strong className="text-foreground">Compartilhar</strong></li>
                      <li>2. Selecione <strong className="text-foreground">"Adicionar à Tela de Início"</strong></li>
                    </ol>
                    <Button variant="outline" onClick={handleDismiss} className="w-full mt-2">
                      Entendi
                    </Button>
                  </div>
                )}

                {/* Fallback for desktop without prompt */}
                {!isIOS && !deferredPrompt && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Procure o ícone <strong className="text-foreground">⊕</strong> na barra de endereços do navegador
                    </p>
                    <Button variant="outline" onClick={handleDismiss} className="w-full">
                      Entendi
                    </Button>
                  </div>
                )}

                {/* Later button */}
                {deferredPrompt && (
                  <button
                    onClick={handleDismiss}
                    className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Agora não
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
