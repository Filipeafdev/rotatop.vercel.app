import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
} from 'lucide-react';

interface ManifestViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  title?: string;
  driverName?: string;
  vehiclePlate?: string;
  date?: string;
}

export const ManifestViewerModal: React.FC<ManifestViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  title = 'Romaneio Físico Digitalizado',
  driverName,
  vehiclePlate,
  date,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `romaneio-${date || 'scan'}-pagina-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoomLevel(1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoomLevel(1);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  Página {currentIndex + 1} de {images.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {driverName ? `Motorista: ${driverName}` : ''}
                {vehiclePlate ? ` • Veículo: ${vehiclePlate}` : ''}
                {date ? ` • Data: ${date}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.25))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reduzir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Baixar imagem original"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex items-center justify-center overflow-auto relative min-h-[350px]">
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xl cursor-pointer transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xl cursor-pointer transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            className="transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={currentImage}
              alt={`Romaneio página ${currentIndex + 1}`}
              className="max-h-[62vh] max-w-full rounded-xl object-contain border border-slate-800 shadow-2xl select-none"
            />
          </div>
        </div>

        {/* Thumbnail Strip (if multiple photos) */}
        {images.length > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
              Páginas ({images.length}):
            </span>
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoomLevel(1);
                }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-16 h-12 object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-[9px] font-bold text-center text-white py-0.5">
                  #{idx + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
