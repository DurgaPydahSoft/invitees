"use client";

import React, { useState, useEffect } from 'react';
import { Share, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'other'>('other');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const checkPlatform = () => {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

            if (isIOS) {
                setPlatform('ios');
            }

            // For iOS, we show the prompt if not in standalone mode
            if (isIOS && !isStandalone) {
                const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
                if (!isDismissed) {
                    setIsVisible(true);
                }
            }
        };

        // Delay execution to avoid cascading renders during mount
        const timer = setTimeout(checkPlatform, 3000);

        // Handle standard PWA prompt for Android/Chrome
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsVisible(false);
            }
            setDeferredPrompt(null);
        }
    };

    const dismissPrompt = () => {
        setIsVisible(false);
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-5 backdrop-blur-xl relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                <button
                    onClick={dismissPrompt}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                        <Download className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 pr-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">
                            Install InviteQR
                        </h3>
                        {platform === 'ios' ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Tap <Share className="w-3 h-3 inline-block mx-0.5 mb-1" /> then
                                <span className="font-bold text-slate-700 dark:text-slate-200"> &quot;Add to Home Screen&quot;</span> to install on your iPhone.
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Experience premium guest management with our dedicated application.
                            </p>
                        )}
                    </div>
                </div>

                {platform !== 'ios' && (
                    <button
                        onClick={handleInstallClick}
                        className="w-full mt-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/10"
                    >
                        Install App
                    </button>
                )}
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
