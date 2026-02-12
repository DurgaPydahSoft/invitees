"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
    ChevronLeft, CheckCircle2, XCircle, Loader2,
    PartyPopper, Camera, Image as ImageIcon, RefreshCw,
    ShieldCheck, QrCode, Barcode as BarcodeIcon
} from 'lucide-react';
import Link from 'next/link';
import Barcode from '@/components/Barcode';

interface Guest {
    _id: string;
    uniqueId: string;
    name: string;
    area?: string;
    attendanceStatus: string;
    checkInTime?: string;
}

export default function Scanner() {
    const [scanResult, setScanResult] = useState<Guest | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
    const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
    const [isHardwareScannerDetected, setIsHardwareScannerDetected] = useState(false);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Refs for Pre-loading
    const successAudio = useRef<HTMLAudioElement | null>(null);
    const errorAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        successAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        errorAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3');

        // Set these to pre-load
        if (successAudio.current) successAudio.current.preload = 'auto';
        if (errorAudio.current) errorAudio.current.preload = 'auto';
    }, []);

    const unlockAudio = () => {
        // Play a silent sound to unlock the audio context for subsequent scans
        if (successAudio.current) {
            successAudio.current.muted = true;
            successAudio.current.play().then(() => {
                if (successAudio.current) successAudio.current.muted = false;
            }).catch(() => { });
        }
    };

    // Hardware Scanner Detection
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();
        let detectionTimeout: NodeJS.Timeout;

        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            // Hardware scanners usually send characters very fast (< 50ms)
            // Human typing is usually > 100ms
            if (currentTime - lastKeyTime > 100) {
                buffer = ''; // Reset if too slow
            }

            if (e.key === 'Enter') {
                if (buffer.length > 5) {
                    setIsHardwareScannerDetected(true);
                    handleCheckIn(buffer);

                    // Reset "Connected" status after 5 seconds of inactivity
                    clearTimeout(detectionTimeout);
                    detectionTimeout = setTimeout(() => {
                        // We keep it true once detected for the session, 
                        // or we can pulse it. Let's keep it visible.
                    }, 5000);
                }
                buffer = '';
            } else if (e.key.length === 1) {
                buffer += e.key;

                // If we get 3+ chars very fast, it's likely a scanner
                if (buffer.length > 3 && (currentTime - lastKeyTime < 50)) {
                    if (!isHardwareScannerDetected) setIsHardwareScannerDetected(true);
                }
            }
            lastKeyTime = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(detectionTimeout);
        };
    }, [isHardwareScannerDetected]);

    // Initialize/Stop Scanner
    useEffect(() => {
        html5QrCodeRef.current = new Html5Qrcode("reader", {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
            ],
            verbose: false
        });

        // Get cameras
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                setCameras(devices);
                // Try to find back camera
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
                setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
            }
        }).catch(err => console.error("Camera detection error", err));

        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(e => console.error("Stop error", e));
            }
        };
    }, []);

    const startCamera = async () => {
        if (!html5QrCodeRef.current || !activeCameraId) return;

        // Gesture Unlock for Audio
        unlockAudio();

        setError(null);
        setScanResult(null);

        try {
            setIsScanning(true);
            await html5QrCodeRef.current.start(
                activeCameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    handleCheckIn(decodedText);
                    stopCamera();
                },
                () => { } // silent failure for frames
            );
        } catch (err) {
            console.error("Start error", err);
            setError("Could not start camera. Please check permissions.");
            setIsScanning(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current?.isScanning) {
            await html5QrCodeRef.current.stop();
            setIsScanning(false);
        }
    };

    const switchCamera = async () => {
        if (cameras.length < 2) return;
        const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;

        await stopCamera();
        setActiveCameraId(cameras[nextIndex].id);
        // Auto-restart will be handled by user clicking start or effect
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !html5QrCodeRef.current) return;

        setError(null);
        setScanResult(null);

        try {
            // Scan file FIRST
            const decodedResult = await html5QrCodeRef.current.scanFileV2(file, false);
            handleCheckIn(decodedResult.decodedText);
        } catch (err) {
            console.error("File scan error", err);
            setError("No valid QR or Barcode found in this image.");
        }
    };

    const handleCheckIn = async (uniqueId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniqueId }),
            });
            const data = await res.json();

            if (data.success) {
                setScanResult(data.guest);

                // Success Feedback
                if (successAudio.current) {
                    successAudio.current.currentTime = 0;
                    successAudio.current.play().catch(e => console.error("Audio play failed", e));
                }
                if (navigator.vibrate) navigator.vibrate(200);
            } else {
                setError(data.error || 'Invalid Security ID');
                setErrorDetails(data.details || null);

                // Error Feedback
                if (errorAudio.current) {
                    errorAudio.current.currentTime = 0;
                    errorAudio.current.play().catch(e => console.error("Audio play failed", e));
                }
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        } catch (error) {
            console.error('Check-in failed:', error);
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        setErrorDetails(null);
        setIsScanning(false);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center p-6 transition-colors duration-300">
            {/* Header */}
            <div className="w-full max-w-md flex items-center justify-between mb-8">
                <Link href="/dashboard" className="p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full transition-all shadow-sm">
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
                <div className="text-center">
                    <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                        Scanner
                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    </h1>
                    <p className="text-[10px] text-slate-500 dark:text-indigo-400/60 font-black uppercase tracking-widest">Multi-Pass Node</p>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-500 relative min-h-[500px]">
                {/* Main Content Area */}
                <div className="p-8">
                    {!scanResult && !error && !loading && (
                        <div className="space-y-8">
                            {/* Scanning Viewport */}
                            <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border-4 border-slate-200 dark:border-indigo-600/20 overflow-hidden group">
                                <div id="reader" className="w-full h-full object-cover"></div>

                                {!isScanning && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/10 dark:bg-slate-950/40 backdrop-blur-sm transition-all duration-500">
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 animate-pulse">
                                                <QrCode className="w-10 h-10 text-white" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 border border-slate-100 dark:border-slate-800">
                                                <BarcodeIcon className="w-6 h-6 text-indigo-600" />
                                            </div>
                                        </div>
                                        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">QR + Barcode Ready</p>
                                    </div>
                                )}

                                {/* Animated Scanner Line */}
                                {isScanning && (
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scanner-line z-10"></div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                {!isScanning ? (
                                    <button
                                        onClick={startCamera}
                                        className="col-span-2 flex items-center justify-center gap-3 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl md:rounded-[1.5rem] font-black uppercase text-xs md:text-sm tracking-widest transition-all shadow-xl shadow-indigo-600/20 group"
                                    >
                                        <Camera className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-125 transition-transform" />
                                        Open Camera
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={stopCamera}
                                            className="flex items-center justify-center gap-2 py-2.5 md:py-3.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl md:rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all border border-red-500/20"
                                        >
                                            Stop
                                        </button>
                                        <button
                                            onClick={switchCamera}
                                            className="flex items-center justify-center gap-2 py-2.5 md:py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-600 dark:text-white hover:text-white rounded-xl md:rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all border border-slate-200 dark:border-slate-700"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Flip
                                        </button>
                                    </>
                                )}

                                <div className="col-span-2 pt-4 flex items-center gap-4">
                                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">OR</span>
                                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                </div>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="col-span-2 flex items-center justify-center gap-3 py-3.5 md:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl md:rounded-[1.5rem] font-black uppercase text-xs md:text-sm tracking-widest transition-all border border-slate-200 dark:border-slate-700"
                                >
                                    <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                                    Upload from Gallery
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="py-24 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                                <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-500 animate-spin relative" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-widest">Authenticating Pass</p>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter italic">Connecting to secure database...</p>
                            </div>
                        </div>
                    )}

                    {scanResult && (
                        <div className="py-10 text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="flex justify-center relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150"></div>
                                <div className="bg-emerald-500 dark:bg-emerald-500/20 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/40 relative">
                                    <CheckCircle2 className="w-20 h-20 text-white dark:text-emerald-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-emerald-600 dark:text-emerald-400 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-2">
                                        <PartyPopper className="w-4 h-4" />
                                        Access Granted
                                    </p>
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{scanResult.name}</h2>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950/80 rounded-[2rem] p-6 text-left border border-slate-200 dark:border-white/5 space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black">Guest ID</p>
                                        <p className="font-mono text-xs font-bold text-indigo-500 tracking-tighter">{scanResult.uniqueId}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black">Zone / Area</p>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">{scanResult.area || 'Premium'}</p>
                                    </div>
                                    <div className="pt-2 flex justify-center">
                                        <div className="bg-white p-3 rounded-xl shadow-inner inline-block">
                                            <Barcode
                                                value={scanResult.uniqueId}
                                                height={40}
                                                width={1.5}
                                                displayValue={false}
                                                background="#ffffff"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={resetScanner}
                                className="w-full py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl md:rounded-[1.5rem] font-black uppercase text-xs md:text-sm tracking-widest transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
                            >
                                Scan Next Pass
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="py-10 text-center space-y-8 animate-in shake duration-500">
                            <div className="flex justify-center relative">
                                <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full scale-110"></div>
                                <div className="bg-red-500/10 dark:bg-red-500/20 p-8 rounded-[2.5rem] border border-red-500/20 relative">
                                    <XCircle className="w-20 h-20 text-red-500" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Validation Error</h2>
                                <div className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full inline-block">
                                    {error}
                                </div>
                                <p className="text-slate-500 text-xs px-4">
                                    {errorDetails || "Please verify the QR code and try again. Ensure it is a valid InviteQR pass."}
                                </p>
                            </div>
                            <button
                                onClick={resetScanner}
                                className="w-full py-3.5 md:py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl md:rounded-[1.5rem] font-black uppercase text-xs md:text-sm tracking-widest transition-all shadow-xl"
                            >
                                Back to Scanner
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Terminal Info */}
            <div className="mt-12 group">
                <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 py-3 px-6 rounded-full flex flex-col md:flex-row items-center gap-3 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-tighter">
                            Check-in Node: <span className="text-indigo-500 font-black">TERMINAL-01</span>
                        </span>
                    </div>

                    <div className="hidden md:block w-[1px] h-3 bg-slate-200 dark:bg-white/10 mx-1"></div>

                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isHardwareScannerDetected ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-tighter">
                            Hardware Scanner: <span className={isHardwareScannerDetected ? "text-indigo-500 font-black" : "text-slate-400 dark:text-slate-600 font-black"}>
                                {isHardwareScannerDetected ? 'CONNECTED' : 'STANDBY'}
                            </span>
                        </span>
                    </div>

                    <div className="hidden md:block w-[1px] h-3 bg-slate-200 dark:bg-white/10 mx-1"></div>

                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scanner-line {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scanner-line {
                    animation: scanner-line 3s linear infinite;
                }
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
            `}</style>
        </div>
    );
}
