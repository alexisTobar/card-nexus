import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, X, Type, Loader2, Zap } from 'lucide-react';

export default function Scanner({ onCardFound, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Iniciar Cámara con mejor compatibilidad
  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: "environment", // Intenta la trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Forzamos el play para navegadores de PC
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.error("Error en auto-play:", e));
        };
      }
    } catch (err) {
      console.error("Error acceso cámara:", err);
      alert("No se pudo acceder a la cámara. Asegúrate de estar en HTTPS y dar permisos.");
    }
  };

  // Detener Cámara limpiando tracks
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Leer nombre con OCR
  const scanName = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ajustar resolución del canvas a la del video actual
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const { data: { text } } = await Tesseract.recognize(
        canvas.toDataURL('image/jpeg', 0.8), // Calidad 0.8 para procesar rápido
        'eng+spa'
      );

      // Limpieza de texto: tomamos la primera línea con solo letras y espacios
      const lines = text.split('\n');
      const cleanedName = lines[0].replace(/[^a-zA-Z ]/g, "").trim();
      
      if (cleanedName.length > 2) {
        onCardFound(cleanedName);
        handleClose();
      } else {
        alert("Texto detectado insuficiente: " + cleanedName);
      }
    } catch (err) {
      console.error("Error OCR:", err);
      alert("Error al procesar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* VIDEO CON OPACIDAD 100 PARA VER EN PC */}
        <video 
          ref={videoRef} 
          playsInline 
          muted
          className="w-full h-full object-cover" 
        />
        
        {/* Overlay de Guía */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md h-24 border-4 border-yellow-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
             <div className="absolute -top-8 left-0 text-xs font-black text-yellow-500 uppercase tracking-tighter bg-black px-2 py-1">
               Encuadra el nombre aquí
             </div>
          </div>
        </div>

        {/* Botón Cerrar */}
        <button 
          onClick={handleClose} 
          className="absolute top-10 right-6 p-4 bg-red-600 text-white rounded-full z-[10000] active:scale-90"
        >
          <X size={28} />
        </button>
      </div>

      {/* Controles Inferiores */}
      <div className="p-8 bg-slate-950 border-t-2 border-yellow-500/20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <button 
          disabled={isProcessing}
          onClick={scanName}
          className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
            isProcessing ? 'bg-slate-800 text-slate-500' : 'bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95 shadow-lg shadow-yellow-500/20'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" /> Procesando...
            </>
          ) : (
            <>
              <Type size={20} strokeWidth={3} /> Capturar Nombre
            </>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-500 mt-4 font-bold uppercase tracking-widest">
          Asegúrate de tener buena iluminación
        </p>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}