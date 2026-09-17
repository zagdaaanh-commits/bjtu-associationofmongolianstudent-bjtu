'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Keyboard, ScanLine, Compass, Skull } from 'lucide-react';
import { soundFX } from '@/lib/soundEffects';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  expectedToken?: string;
}

export default function QRScanner({
  onScanSuccess,
  onClose,
  expectedToken,
}: QRScannerProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode('qr-reader-viewport', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Try getting cameras list for switching option
        try {
          const devices = await Html5Qrcode.getCameras();
          if (mounted && devices && devices.length > 0) {
            setCameras(devices);
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('rear')
            );
            setSelectedCameraId(backCam ? backCam.id : devices[0].id);
          }
        } catch {
          // getCameras might be blocked before permission on mobile; that's fine
        }

        if (!mounted) return;

        // Start scanning with rear camera constraint
        const cameraConfig = { facingMode: 'environment' };

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: (w, h) => {
              const edge = Math.min(w, h);
              return { width: Math.floor(edge * 0.72), height: Math.floor(edge * 0.72) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (hasTriggeredRef.current) return;
            hasTriggeredRef.current = true;

            // Stop scanner immediately to prevent repeated triggers
            if (isScanningRef.current && scannerRef.current) {
              isScanningRef.current = false;
              scannerRef.current.stop().catch(() => {});
            }

            if (navigator.vibrate) {
              try {
                navigator.vibrate(100);
              } catch {
                // ignore
              }
            }

            soundFX.playCoin();
            onScanSuccess(decodedText.trim());
          },
          () => {
            // Frame with no QR
          }
        );

        if (mounted) {
          isScanningRef.current = true;
        } else {
          html5QrCode.stop().catch(() => {});
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const error = err as Error;
        console.warn('Camera scan start warning:', error.message);
        setScannerError(
          'Камер нээхэд алдаа гарлаа. Зөвшөөрлийг шалгана уу эсвэл доорх гараар оруулах сонголтыг ашиглана уу.'
        );
        setShowManualInput(true);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current && isScanningRef.current) {
        isScanningRef.current = false;
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [onScanSuccess]);

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;
    soundFX.playButtonTap();

    try {
      if (isScanningRef.current) {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      }

      const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCameraId = cameras[nextIndex].id;
      setSelectedCameraId(nextCameraId);

      await scannerRef.current.start(
        nextCameraId,
        {
          fps: 10,
          qrbox: (w, h) => {
            const edge = Math.min(w, h);
            return { width: Math.floor(edge * 0.72), height: Math.floor(edge * 0.72) };
          },
        },
        (decodedText) => {
          if (hasTriggeredRef.current) return;
          hasTriggeredRef.current = true;
          if (isScanningRef.current && scannerRef.current) {
            isScanningRef.current = false;
            scannerRef.current.stop().catch(() => {});
          }
          soundFX.playCoin();
          onScanSuccess(decodedText.trim());
        },
        () => {}
      );
      isScanningRef.current = true;
    } catch (err) {
      console.error('Switch camera error:', err);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    soundFX.playButtonTap();

    if (isScanningRef.current && scannerRef.current) {
      isScanningRef.current = false;
      scannerRef.current.stop().catch(() => {});
    }
    soundFX.playCoin();
    onScanSuccess(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0f0703] flex flex-col items-center justify-between p-4 animate-in fade-in duration-200 isolate">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center text-[#271409]">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <h2 className="text-base font-black text-amber-300 font-cinzel tracking-wide">
            Эрдэнэсийн QR Сканнер
          </h2>
        </div>
        <button
          onClick={() => {
            soundFX.playButtonTap();
            if (isScanningRef.current && scannerRef.current) {
              isScanningRef.current = false;
              scannerRef.current.stop().catch(() => {});
            }
            onClose();
          }}
          className="w-9 h-9 rounded-xl btn-pirate-wood text-amber-200 flex items-center justify-center"
          title="Хаах"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scanner Body with 90s Adventure Spyglass / Reticle Frame */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center relative">
        <div
          className={`w-full aspect-square max-w-[320px] relative rounded-3xl overflow-hidden border-4 border-[#7a4820] bg-black shadow-2xl ${
            showManualInput ? 'hidden' : 'block'
          }`}
        >
          <div className="pirate-corner-rivet top-2 left-2" />
          <div className="pirate-corner-rivet top-2 right-2" />
          <div className="pirate-corner-rivet bottom-2 left-2" />
          <div className="pirate-corner-rivet bottom-2 right-2" />

          <div id="qr-reader-viewport" className="w-full h-full" />

          {/* Target Viewfinder reticle overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-dashed border-amber-400/80 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-amber-400" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-amber-400" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-amber-400" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-amber-400" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500/70 animate-ping" />
            </div>
          </div>
        </div>

        {/* Manual Code Input Option */}
        {showManualInput && (
          <div className="w-full max-w-sm pirate-panel-parchment rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 relative">
            <div className="pirate-corner-rivet top-2 left-2" />
            <div className="pirate-corner-rivet top-2 right-2" />
            <div className="pirate-corner-rivet bottom-2 left-2" />
            <div className="pirate-corner-rivet bottom-2 right-2" />

            <h3 className="text-base font-black text-[#2b1708] mb-2 flex items-center gap-2 font-cinzel">
              <Keyboard className="w-5 h-5 text-amber-800" />
              <span>QR кодыг гараар бичих</span>
            </h3>
            <p className="text-xs text-[#5c371c] mb-4 font-sans leading-relaxed">
              Камер ажиллахгүй байгаа тохиолдолд шалгах цэг дээрх бичвэр нууц кодыг оруулна уу.
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Шалгах цэгийн нууц кодыг энд бичнэ үү..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border-2 border-[#b38b55] rounded-2xl text-[#2b1708] placeholder-[#8c653d] focus:outline-none focus:border-[#78350f] font-mono text-center text-sm sm:text-base font-bold shadow-inner"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-3.5 btn-pirate-gold rounded-2xl text-sm font-black shadow-lg disabled:opacity-50"
              >
                Баталгаажуулах
              </button>
            </form>
          </div>
        )}

        {scannerError && !showManualInput && (
          <div className="mt-4 p-3 bg-red-950/80 border-2 border-red-700 rounded-2xl text-xs text-red-200 flex items-center gap-2 max-w-xs">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="font-sans leading-relaxed">{scannerError}</span>
          </div>
        )}

        <p className="text-xs text-amber-200/80 text-center mt-4 font-sans">
          {!showManualInput
            ? 'Шалгах цэг дээр байрлуулсан QR кодыг дурангийн дөрвөлжин хүрээнд тааруулна уу.'
            : ''}
        </p>
      </div>

      {/* Bottom Controls (Chunky Retro Buttons) */}
      <div className="w-full max-w-md flex items-center justify-between gap-3 pb-4">
        {!showManualInput ? (
          <>
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="py-3 px-4 rounded-2xl btn-pirate-wood text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Камер солих
              </button>
            )}
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setShowManualInput(true);
              }}
              className="flex-1 py-3 px-4 rounded-2xl btn-pirate-wood text-xs font-bold flex items-center justify-center gap-2"
            >
              <Keyboard className="w-4 h-4 text-amber-300" /> Гараар код бичих
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              soundFX.playButtonTap();
              setShowManualInput(false);
            }}
            className="w-full py-3 px-4 rounded-2xl btn-pirate-wood text-xs font-bold flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-amber-300" /> Дуран руу буцах
          </button>
        )}
      </div>
    </div>
  );
}
