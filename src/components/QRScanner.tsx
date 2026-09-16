'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Keyboard, ScanLine } from 'lucide-react';

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

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const initializeScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setScannerError('Төхөөрөмж дээр камер олдсонгүй.');
          setShowManualInput(true);
          return;
        }

        setCameras(devices);
        // Prefer back / environment camera
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
        );
        const activeCameraId = backCamera ? backCamera.id : devices[0].id;
        setSelectedCameraId(activeCameraId);

        html5QrCode = new Html5Qrcode('qr-reader-viewport', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          activeCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback
            if (navigator.vibrate) {
              try {
                navigator.vibrate(100);
              } catch {
                // ignore
              }
            }
            onScanSuccess(decodedText.trim());
          },
          () => {
            // qr scan failure (ignoring frames with no QR)
          }
        );
        isScanningRef.current = true;
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Camera scan init error:', error);
        setScannerError(
          'Камер нээхэд алдаа гарлаа. Камерын зөвшөөрлийг шалгана уу эсвэл доорх гараар оруулах сонголтыг ашиглана уу.'
        );
        setShowManualInput(true);
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch((err) => console.error('Error stopping scanner:', err));
        isScanningRef.current = false;
      }
    };
  }, [onScanSuccess]);

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;

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
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
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
    onScanSuccess(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-amber-400 animate-pulse" />
          <h2 className="text-lg font-bold text-white">QR Сканнердах</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Хаах"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Scanner Body */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center relative">
        {!showManualInput ? (
          <div className="w-full aspect-square max-w-[320px] relative rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-black">
            <div id="qr-reader-viewport" className="w-full h-full" />

            {/* Target Viewfinder reticle overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-dashed border-amber-400/80 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/60 animate-ping" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-amber-400" />
              QR кодыг гараар оруулах
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Камер ажиллахгүй байгаа тохиолдолд шалгах цэг дээрх бичвэр кодыг оруулна уу.
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Жишээ нь: hd_park_alpha_7x"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-center text-sm"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                Баталгаажуулах
              </button>
            </form>

            {expectedToken && (
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500">Туршилтын горим:</p>
                <button
                  type="button"
                  onClick={() => onScanSuccess(expectedToken)}
                  className="mt-1 text-xs text-amber-400 underline hover:text-amber-300"
                >
                  Шалгах цэгийн кодоор шууд нэвтрэх ({expectedToken})
                </button>
              </div>
            )}
          </div>
        )}

        {scannerError && !showManualInput && (
          <div className="mt-4 p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2 max-w-xs">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{scannerError}</span>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-4">
          {!showManualInput
            ? 'Шалгах цэг дээр байрлуулсан QR кодыг дөрвөлжин хүрээнд тааруулна уу.'
            : ''}
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex items-center justify-between gap-3 pb-4">
        {!showManualInput ? (
          <>
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Камер солих
              </button>
            )}
            <button
              onClick={() => setShowManualInput(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Keyboard className="w-4 h-4 text-amber-400" /> Гараар код бичих
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowManualInput(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Camera className="w-4 h-4 text-amber-400" /> Камер руу буцах
          </button>
        )}
      </div>
    </div>
  );
}
