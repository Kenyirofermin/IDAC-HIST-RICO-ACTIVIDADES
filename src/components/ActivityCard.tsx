/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity } from '../types';
import { formatFriendlyDate } from '../utils';
import { Calendar, Tag, Edit3, Trash2, Image as ImageIcon, User, Lock, MapPin, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ActivityCardProps {
  key?: React.Key;
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void | Promise<void>;
  onImageClick: (images: string[], index: number, activityId?: string) => void;
  onShare: (activity: Activity) => void;
  readOnly?: boolean;
}

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onImageClick,
  onShare,
  readOnly = false,
}: ActivityCardProps) {
  const { title, date, notes, photos, tags } = activity;

  // Renderizar la grilla de fotos adaptativa según la cantidad de imágenes
  const renderPhotoGrid = () => {
    if (!photos || photos.length === 0) {
      return (
        <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400">
          <ImageIcon className="w-8 h-8 text-slate-300" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Sin fotografías registradas</span>
        </div>
      );
    }

    const count = photos.length;

    if (count === 1) {
      return (
        <div 
          onClick={() => onImageClick(photos, 0, activity.id)}
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
        >
          <img
            src={photos[0]}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-idac-blue/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
            <span className="text-[10px] font-bold text-white bg-idac-blue px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">Ampliar</span>
          </div>
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 aspect-video w-full">
          {photos.slice(0, 2).map((photo, idx) => (
            <div
              key={photo + idx}
              onClick={() => onImageClick(photos, idx, activity.id)}
              className="relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
            >
              <img
                src={photo}
                alt={`${title} ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-2 aspect-video w-full">
          <div
            onClick={() => onImageClick(photos, 0, activity.id)}
            className="col-span-2 relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
          >
            <img
              src={photos[0]}
              alt={`${title} 1`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
            />
          </div>
          <div className="grid grid-rows-2 gap-2 h-full">
            {photos.slice(1, 3).map((photo, idx) => (
              <div
                key={photo + idx}
                onClick={() => onImageClick(photos, idx + 1, activity.id)}
                className="relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
              >
                <img
                  src={photo}
                  alt={`${title} ${idx + 2}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 o más fotos (collage premium con indicador +N)
    return (
      <div className="grid grid-cols-4 gap-2 aspect-video w-full">
        <div
          onClick={() => onImageClick(photos, 0, activity.id)}
          className="col-span-2 row-span-2 relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
        >
          <img
            src={photos[0]}
            alt={`${title} 1`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        </div>
        <div
          onClick={() => onImageClick(photos, 1, activity.id)}
          className="col-span-2 relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
        >
          <img
            src={photos[1]}
            alt={`${title} 2`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        </div>
        <div
          onClick={() => onImageClick(photos, 2, activity.id)}
          className="relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
        >
          <img
            src={photos[2]}
            alt={`${title} 3`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        </div>
        <div
          onClick={() => onImageClick(photos, 3, activity.id)}
          className="relative h-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group border border-slate-100 shadow-sm"
        >
          <img
            src={photos[3]}
            alt={`${title} 4`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
          {count > 4 && (
            <div className="absolute inset-0 bg-idac-dark/80 flex items-center justify-center text-white font-bold text-sm rounded-xl">
              +{count - 4}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 group/card"
    >
      {/* Grilla o Collages de Fotos */}
      {renderPhotoGrid()}

      {/* Contenido Textual */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {/* Título de la actividad */}
            <h3 className="text-md font-black text-idac-blue tracking-tight leading-tight group-hover/card:text-idac-dark transition-colors">
              {title}
            </h3>

            {/* Fecha con estilo y autor */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                <span>{formatFriendlyDate(date)}</span>
              </div>
              {activity.author && (
                <div className="flex items-center gap-1.5 bg-blue-50/50 text-idac-blue px-2.5 py-0.5 border border-blue-100 rounded-full shadow-xs">
                  <User className="w-3 h-3 text-idac-blue/70" />
                  <span>Por: {activity.author}</span>
                </div>
              )}
              {activity.place && (
                <div className="flex items-center gap-1.5 bg-emerald-50/70 text-emerald-800 px-2.5 py-0.5 border border-emerald-200 rounded-full shadow-xs">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>Sección: {activity.place}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción discretos */}
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity focus-within:opacity-100">
            {readOnly ? (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest" title="No tienes permisos para editar o eliminar">
                <Lock className="w-3 h-3" /> Solo lectura
              </div>
            ) : (
              <>
                <button
                  onClick={() => onEdit(activity)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-idac-blue hover:border-idac-blue transition-all cursor-pointer shadow-xs hover:shadow-sm"
                  title="Editar recuerdo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(activity.id)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-idac-red hover:border-idac-red transition-all cursor-pointer shadow-xs hover:shadow-sm"
                  title="Eliminar recuerdo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Nota Descriptiva */}
        <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100/80 text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap break-words">
          {notes}
        </div>

        {/* Footer de la tarjeta con Etiquetas y botón Compartir */}
        <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-slate-100 flex-wrap">
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-blue-50/40 text-idac-blue border border-blue-100 uppercase tracking-wider"
                >
                  <Tag className="w-2.5 h-2.5 opacity-60" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          ) : (
            <div /> // Elemento vacío para mantener el layout flex justify-between
          )}

          <button
            onClick={() => onShare(activity)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-idac-blue hover:border-idac-blue hover:bg-slate-50 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-sm font-black uppercase tracking-widest text-[9px] ml-auto shrink-0"
            title="Compartir en redes sociales / estados"
          >
            <Share2 className="w-3.5 h-3.5 text-idac-blue" />
            <span>Compartir</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
