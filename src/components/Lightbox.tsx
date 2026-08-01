/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sparkles, Share2, MessageCircle, Twitter, Facebook, Send, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageEditorModal from './ImageEditorModal';

interface LightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  canEdit?: boolean;
  onSaveEditedImage?: (editedUrl: string, index: number) => void;
}

export default function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  canEdit = false,
  onSaveEditedImage,
}: LightboxProps) {
  const [zoom, setZoom] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'native' | 'copy') => {
    const text = encodeURIComponent('🖼️ Mira esta fotografía del Archivo Fotográfico IDAC:');
    const shareUrl = encodeURIComponent(window.location.href);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${shareUrl}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({
        title: 'Fotografía IDAC',
        text: 'Fotografía del Archivo IDAC',
        url: window.location.href,
      }).catch(() => {});
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    setShowShareDropdown(false);
  };

  // Escuchar eventos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) {
        onIndexChange((currentIndex + 1) % images.length);
        setZoom(false);
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        onIndexChange((currentIndex - 1 + images.length) % images.length);
        setZoom(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images, onClose, onIndexChange]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((currentIndex + 1) % images.length);
    setZoom(false);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((currentIndex - 1 + images.length) % images.length);
    setZoom(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Barra superior de controles */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white/80">
          <div className="text-[10px] font-black font-mono bg-slate-900 px-3 py-1.5 border border-slate-700 text-slate-300 uppercase tracking-widest">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center gap-2">
            {/* BOTÓN COMPARTIR FOTO */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareDropdown(!showShareDropdown);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 border border-emerald-500/50 hover:bg-emerald-500 transition-all text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                title="Compartir esta fotografía"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </button>

              {showShareDropdown && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1 text-white"
                >
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-emerald-400"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-sky-400"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>X (Twitter)</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-blue-400"
                  >
                    <Facebook className="w-4 h-4" />
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-cyan-400"
                  >
                    <Send className="w-4 h-4" />
                    <span>Telegram</span>
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-slate-300 border-t border-slate-800"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedLink ? '¡Copiado!' : 'Copiar Enlace'}</span>
                  </button>
                </div>
              )}
            </div>

            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditorOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-idac-blue border border-idac-blue/50 hover:bg-idac-dark transition-all text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                title="Editar esta fotografía (Usuarios Autorizados)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Editar Foto</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(!zoom);
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all text-white"
              title={zoom ? 'Restaurar zoom' : 'Ampliar imagen'}
            >
              {zoom ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all text-white"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Botón Izquierda */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-none bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 transition-all text-white z-10 hover:scale-105 active:scale-95"
            title="Imagen anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Imagen principal con animación de transición */}
        <div className="relative max-w-(--size-2xl) max-h-[85vh] flex items-center justify-center px-12 md:px-20">
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={`Foto de actividad ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: zoom ? 1.3 : 1,
              opacity: 1,
            }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`max-w-full max-h-[80vh] rounded-none border-4 border-slate-900 object-contain shadow-[6px_6px_0px_rgba(0,0,0,0.6)] transition-all duration-300 cursor-zoom-in ${
              zoom ? 'cursor-zoom-out' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setZoom(!zoom);
            }}
          />
        </div>

        {/* Botón Derecha */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-none bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 transition-all text-white z-10 hover:scale-105 active:scale-95"
            title="Siguiente imagen"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Miniaturas en la parte inferior */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-950/80 border-2 border-slate-800 rounded-none max-w-[90vw] overflow-x-auto scrollbar-none z-10">
            {images.map((img, idx) => (
              <button
                key={img + idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange(idx);
                  setZoom(false);
                }}
                className={`relative w-10 h-10 rounded-none overflow-hidden border transition-all ${
                  idx === currentIndex
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-white/20 opacity-50 hover:opacity-100 hover:scale-105'
                }`}
              >
                <img
                  src={img}
                  alt={`Miniatura ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* MODAL DEL EDITOR DE FOTOGRAFÍAS */}
        {isEditorOpen && (
          <ImageEditorModal
            isOpen={isEditorOpen}
            imageUrl={currentImage}
            onClose={() => setIsEditorOpen(false)}
            onSave={(editedDataUrl) => {
              if (onSaveEditedImage) {
                onSaveEditedImage(editedDataUrl, currentIndex);
              }
              setIsEditorOpen(false);
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
