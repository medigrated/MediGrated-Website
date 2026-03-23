import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function WebcamDialog({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let currentStream = null;

    if (isOpen) {
      setIsCameraReady(false);
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((mediaStream) => {
          currentStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera", err);
          toast.error("Could not access camera. Please check your browser permissions.");
          onClose(); // Close if camera fails
        });
    }

    return () => {
      // Cleanup the stream when component unmounts or dialog closes
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, onClose]);

  const handleCaptureClick = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Flip horizontally if facing front (mirror effect)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'webcam-capture.jpg', {
            type: 'image/jpeg',
          });
          onCapture(file);
          onClose();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleVideoLoaded = () => {
    setIsCameraReady(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> Take Photo
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Video Feed */}
        <div className="w-full bg-black relative aspect-square flex items-center justify-center">
          {!isCameraReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
              <p className="text-sm font-medium">Accessing Camera...</p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={handleVideoLoaded}
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* Actions */}
        <div className="w-full p-6 flex justify-center bg-gray-50 dark:bg-slate-900">
          <Button 
            disabled={!isCameraReady}
            onClick={handleCaptureClick}
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all outline outline-offset-4 outline-primary/30"
          >
            <Camera className="w-8 h-8 text-white ml-0.5" />
          </Button>
        </div>

      </div>
    </div>
  );
}
