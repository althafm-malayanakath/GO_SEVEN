'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

declare global {
  interface Window {
    BarcodeDetector: {
      new(options?: { formats?: string[] }): {
        detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const [error, setError] = useState('');
  const isBarcodeDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!isBarcodeDetectorSupported) {
      return;
    }

    const detector = new window.BarcodeDetector({
      formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'data_matrix', 'pdf417'],
    });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        void videoRef.current.play();

        const scanFrame = () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animationRef.current = requestAnimationFrame(scanFrame);
            return;
          }
          detector
            .detect(videoRef.current)
            .then((barcodes) => {
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue);
              } else {
                animationRef.current = requestAnimationFrame(scanFrame);
              }
            })
            .catch(() => {
              animationRef.current = requestAnimationFrame(scanFrame);
            });
        };

        animationRef.current = requestAnimationFrame(scanFrame);
      })
      .catch(() => {
        setError('Camera access denied. Please allow camera access and try again.');
      });

    return () => {
      cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isBarcodeDetectorSupported, onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#0d0015] border border-white/15 shadow-2xl">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-bold text-white">Scan tracking barcode</p>
            <p className="text-xs text-white/55 mt-0.5">Point camera at the shipping label barcode</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        {!isBarcodeDetectorSupported || error ? (
          <div className="px-5 pb-6 pt-2 text-center">
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {isBarcodeDetectorSupported
                ? error
                : 'Barcode scanning requires Chrome or Edge. You can type the tracking ID manually.'}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative mx-5 mb-5 overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />

            {/* Dimmed overlay with cutout effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              {/* Scan frame */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-28">
                <div className="absolute inset-0 bg-transparent" />
                {/* Corner brackets */}
                <div className="absolute -top-px -left-px w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
                <div className="absolute -top-px -right-px w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
                <div className="absolute -bottom-px -left-px w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
                <div className="absolute -bottom-px -right-px w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
                {/* Scanning line */}
                <div
                  className="absolute inset-x-2 h-0.5 rounded-full bg-[#6A0DAD]/90 shadow-[0_0_8px_2px_rgba(106,13,173,0.6)]"
                  style={{ animation: 'scanline 2s ease-in-out infinite', top: '20%' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 20%; }
          50% { top: 72%; }
        }
      `}</style>
    </div>
  );
}
