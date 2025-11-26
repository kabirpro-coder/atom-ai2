import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, RefreshCw, ScanLine, Zap } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  currentVoice: string;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, currentVoice }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      // Futuristic Greeting: Wait slightly for camera to init
      setTimeout(() => {
         speakText("I'm ready. Show me what you want me to analyze.", currentVoice);
      }, 800);
    } else {
      stopCamera();
      setIsAnalyzing(false);
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startCamera = async () => {
    setIsAnalyzing(false);
    setError('');
    
    try {
      let mediaStream;
      
      try {
        // 1. Try specifically for rear camera (ideal for phones)
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (envError) {
        console.warn("Back camera unavailable, trying default...", envError);
        // 2. Fallback to any available video source (ideal for laptops)
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Explicitly play to ensure stream starts
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error("Video play error:", playError);
        }
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      setError("Could not access camera. Please check your browser permissions or try a different device.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      // Start "Reading" Animation
      setIsAnalyzing(true);
      speakText("Scanning target.", currentVoice);

      // Add delay to simulate "Reading" scan before closing
      setTimeout(() => {
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.split(',')[1];
          onCapture(base64);
          onClose();
        }
      }, 2000); // 2s delay for full scan effect
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col font-mono">
      {/* HUD Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/90 to-transparent absolute top-0 w-full z-20 border-b border-atom-500/30">
        <div className="flex items-center gap-2">
           <Zap className="w-5 h-5 text-atom-400 animate-pulse" />
           <span className="text-atom-50 tracking-widest text-sm font-bold uppercase">Atom Vision v2.0</span>
        </div>
        <button onClick={onClose} className="text-white p-2 rounded-full bg-black/40 hover:bg-atom-500/20 border border-white/10">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
        {error ? (
          <div className="text-red-400 p-6 text-center max-w-md">
            <ScanLine className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">{error}</p>
            <button 
              onClick={startCamera} 
              className="px-6 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* HUD Overlay Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-atom-400/60 rounded-tl-xl shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
              <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-atom-400/60 rounded-tr-xl shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
              <div className="absolute bottom-32 left-8 w-16 h-16 border-b-4 border-l-4 border-atom-400/60 rounded-bl-xl shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
              <div className="absolute bottom-32 right-8 w-16 h-16 border-b-4 border-r-4 border-atom-400/60 rounded-br-xl shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
              
              {/* Center Target */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/30 rounded-full flex items-center justify-center transition-all duration-300 ${isAnalyzing ? 'scale-125 border-atom-400 border-2' : ''}`}>
                <div className={`w-1.5 h-1.5 bg-atom-400 rounded-full ${isAnalyzing ? 'animate-ping' : ''}`}></div>
              </div>

              {/* Scanning Laser Line (Always active but intensifies during analysis) */}
              <div className={`absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-atom-400 to-transparent shadow-[0_0_20px_rgba(56,189,248,1)] animate-scan ${isAnalyzing ? 'opacity-100 duration-700' : 'opacity-40'}`}></div>
              
              {/* Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

              {/* "Reading" Animation Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-atom-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 animate-in fade-in duration-300">
                  <div className="relative">
                    <ScanLine className="w-20 h-20 text-atom-300 animate-pulse" />
                    <div className="absolute inset-0 bg-atom-400/20 blur-xl animate-pulse"></div>
                  </div>
                  <div className="mt-6 text-atom-50 text-xl font-black tracking-[0.2em] uppercase animate-pulse">
                    Processing Visuals
                  </div>
                  <div className="w-64 h-1.5 bg-gray-800 mt-4 rounded-full overflow-hidden border border-atom-500/30">
                    <div className="h-full bg-atom-400 animate-[width_2s_ease-out] w-full shadow-[0_0_10px_#38bdf8]"></div>
                  </div>
                  <div className="mt-2 text-xs text-atom-300 font-mono">
                    Target Lock: ACQUIRED
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="h-32 bg-black/80 backdrop-blur-xl flex justify-around items-center px-8 border-t border-atom-500/20 z-20">
        <div className="text-xs text-atom-400 font-mono text-center w-16 opacity-70">
          <div>MODE</div>
          <div className="text-white font-bold">SCAN</div>
        </div>
        
        <button 
          onClick={takePhoto}
          disabled={isAnalyzing || !!error}
          className={`
            w-20 h-20 rounded-full border-2 p-1.5 flex items-center justify-center transition-all duration-300
            ${isAnalyzing ? 'border-atom-500/50 scale-95' : 'border-white/80 hover:border-atom-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-95'}
          `}
        >
          <div className={`w-full h-full rounded-full bg-white transition-all duration-300 ${isAnalyzing ? 'scale-0' : 'scale-100'}`} />
        </button>

        <button 
          onClick={startCamera} 
          className="w-16 h-16 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CameraModal;