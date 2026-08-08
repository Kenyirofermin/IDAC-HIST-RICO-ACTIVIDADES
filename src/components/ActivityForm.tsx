/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity } from '../types';
import { X, Upload, Calendar, AlignLeft, Sparkles, Hash, AlertCircle, User, MapPin, Home, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageEditorModal from './ImageEditorModal';

interface ActivityFormProps {
  activityToEdit?: Activity | null;
  onSave: (
    activity: Omit<Activity, 'id' | 'createdAt'> & { id?: string },
    saveToPermanentList?: boolean
  ) => void;
  onCancel: () => void;
  defaultAuthor?: string;
  places: string[];
  newModalTitle?: string;
  editModalTitle?: string;
}

export default function ActivityForm({
  activityToEdit,
  onSave,
  onCancel,
  defaultAuthor = '',
  places,
  newModalTitle = 'Nuevo Recuerdo de Actividad',
  editModalTitle = 'Editar Recuerdo',
}: ActivityFormProps) {
  const isEditing = !!activityToEdit;

  // Estados de los campos
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    // Fecha local por defecto en formato YYYY-MM-DD (2026-07-13)
    return '2026-07-13';
  });
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [place, setPlace] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Estados para lugares personalizados
  const [customPlace, setCustomPlace] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [addToPermanent, setAddToPermanent] = useState(false);
  
  // Estado para drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para edición de foto con el editor
  const [editingPhotoIdx, setEditingPhotoIdx] = useState<number | null>(null);
 
  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setDate(activityToEdit.date);
      setAuthor(activityToEdit.author || '');
      setNotes(activityToEdit.notes);
      setPhotos(activityToEdit.photos || []);
      setTagInput(activityToEdit.tags ? activityToEdit.tags.join(', ') : '');
      
      const activityPlace = activityToEdit.place || '';
      if (activityPlace && !places.includes(activityPlace)) {
        setPlace('__CUSTOM__');
        setIsCustom(true);
        setCustomPlace(activityPlace);
      } else {
        setPlace(activityPlace);
        setIsCustom(false);
        setCustomPlace('');
      }
    } else {
      // Reiniciar si pasa a modo creación
      setTitle('');
      setDate('2026-07-13');
      setAuthor(defaultAuthor);
      setNotes('');
      setPhotos([]);
      setTagInput('');
      setPlace('');
      setIsCustom(false);
      setCustomPlace('');
    }
    setAddToPermanent(false);
    setErrors({});
  }, [activityToEdit, defaultAuthor, places]);

  // Procesar archivos de imagen y convertirlos a Base64
  const processFiles = (files: FileList) => {
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (validImageFiles.length === 0) {
      setErrors((prev) => ({
        ...prev,
        photos: 'Por favor, arrastra o selecciona archivos de imagen válidos (PNG, JPG, WEBP).',
      }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photos;
      return copy;
    });

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = 'El título de la actividad es requerido.';
    if (!date) newErrors.date = 'La fecha es requerida.';
    if (!author.trim()) newErrors.author = 'El nombre de la persona que subió las fotos es requerido.';
    if (!notes.trim()) newErrors.notes = 'La nota descriptiva es requerida.';
    if (photos.length === 0) newErrors.photos = 'Se requiere al menos una fotografía para crear un recuerdo.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Hacer scroll al primer error
      return;
    }

    // Procesar las etiquetas
    const processedTags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Extraer año, mes, día de la fecha YYYY-MM-DD
    const [yearStr, monthStr, dayStr] = date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const finalPlace = isCustom ? customPlace.trim() : place;

    onSave({
      id: activityToEdit?.id,
      title: title.trim(),
      date,
      year,
      month,
      day,
      notes: notes.trim(),
      photos,
      tags: processedTags,
      author: author.trim(),
      place: finalPlace || undefined,
    }, isCustom && addToPermanent && !!finalPlace);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-idac-blue flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-idac-blue" />
          <span>{isEditing ? editModalTitle : newModalTitle}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-idac-blue hover:border-idac-blue text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 bg-slate-50 hover:bg-slate-100"
            title="Volver al Menú Principal"
          >
            <Home className="w-3.5 h-3.5 text-idac-blue" />
            <span className="hidden sm:inline">🏠 Menú Principal</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-idac-blue hover:border-idac-blue transition-colors cursor-pointer"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Título de la Actividad */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="form-title" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Título de la Actividad
          </label>
          <input
            id="form-title"
            type="text"
            placeholder="¿Qué actividad realizaste?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            className={`w-full px-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-medium ${
              errors.title ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
            }`}
          />
          {errors.title && (
            <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.title}
            </span>
          )}
        </div>

        {/* Fecha Temporal */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="form-date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Fecha de la Actividad
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="form-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
              }}
              className={`w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-medium ${
                errors.date ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.date && (
            <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.date}
            </span>
          )}
        </div>

        {/* Autor / Quién subió */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="form-author" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Subido por (Nombre)
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="form-author"
              type="text"
              placeholder="¿Quién subió estas fotos? (ej. Luis, Sofía)"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                if (errors.author) setErrors((prev) => ({ ...prev, author: '' }));
              }}
              className={`w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-medium ${
                errors.author ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.author && (
            <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.author}
            </span>
          )}
        </div>

        {/* Creador de Tags / Categorías */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="form-tags" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Categorías / Etiquetas
          </label>
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="form-tags"
              type="text"
              placeholder="Viajes, Familia, Deporte (separados por comas)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-medium"
            />
          </div>
        </div>

        {/* Lugar / Sección */}
        <div className="flex flex-col gap-2">
          <label htmlFor="form-place" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Lugar / Sección
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              id="form-place"
              value={place}
              onChange={(e) => {
                const val = e.target.value;
                setPlace(val);
                if (val === '__CUSTOM__') {
                  setIsCustom(true);
                } else {
                  setIsCustom(false);
                  setCustomPlace('');
                }
              }}
              className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-bold uppercase tracking-wider"
            >
              <option value="">-- Sin Especificar / General --</option>
              {places.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__CUSTOM__">✍️ Escribir otro lugar o ubicación...</option>
            </select>
          </div>

          <AnimatePresence>
            {isCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2.5 pt-1"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe la nueva ubicación (ej. Hangar 4, Planta 2)"
                    value={customPlace}
                    onChange={(e) => setCustomPlace(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-idac-blue/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-idac-blue/10 font-bold uppercase tracking-wider"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none bg-blue-50/20 border border-idac-blue/15 p-2.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={addToPermanent}
                    onChange={(e) => setAddToPermanent(e.target.checked)}
                    className="rounded border-slate-300 text-idac-blue focus:ring-idac-blue w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-idac-blue">
                    ¿Agregar ubicación permanentemente a la lista general?
                  </span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Zona de Arrastrar e Importar Fotos */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Fotografías del Archivo
          </span>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-8 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragging
                ? 'border-idac-blue bg-blue-50/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />
            <Upload className={`w-8 h-8 ${isDragging ? 'text-idac-blue' : 'text-slate-400'}`} />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">
                Arrastra tus fotos aquí o <span className="text-idac-blue underline">selecciona archivos</span>
              </p>
              <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">PNG, JPG, WEBP de alta calidad</p>
            </div>
          </div>

          {errors.photos && (
            <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.photos}
            </span>
          )}

          {/* Carrusel/Miniaturas de imágenes subidas */}
          <AnimatePresence>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/30 shadow-xs">
                {photos.map((photo, idx) => (
                  <motion.div
                    key={photo.slice(0, 40) + idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group bg-slate-200"
                  >
                    <img
                      src={photo}
                      alt="Previsualización"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPhotoIdx(idx);
                        }}
                        className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all scale-95 border border-white/25 shadow-sm font-black"
                        title="Editar esta fotografía"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        className="p-1 rounded-lg bg-idac-blue hover:bg-idac-dark text-white transition-all scale-95 border border-white/25 shadow-sm"
                        title="Eliminar foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Notas Descriptivas */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="form-notes" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Notas Descriptivas / Historia
          </label>
          <div className="relative">
            <AlignLeft className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              id="form-notes"
              placeholder="Describe lo que ocurrió en este recuerdo, anécdotas, quiénes estuvieron presentes..."
              rows={5}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) setErrors((prev) => ({ ...prev, notes: '' }));
              }}
              className={`w-full pl-11 pr-4 py-3 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all resize-none font-medium ${
                errors.notes ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.notes && (
            <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.notes}
            </span>
          )}
        </div>

        {/* Botones del Formulario */}
        <div className="flex items-center gap-3 mt-3 border-t border-slate-200 pt-4 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
            title="Regresar a la vista principal"
          >
            <Home className="w-4 h-4 text-idac-blue" />
            <span>🏠 Volver al Inicio</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-idac-blue text-white hover:bg-idac-dark text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-101 active:scale-99"
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Recuerdo'}
          </button>
        </div>
      </form>

      {/* Editor de Fotos para el Formulario */}
      {editingPhotoIdx !== null && (
        <ImageEditorModal
          isOpen={editingPhotoIdx !== null}
          imageUrl={photos[editingPhotoIdx]}
          onClose={() => setEditingPhotoIdx(null)}
          onSave={(editedUrl) => {
            setPhotos((prev) => {
              const next = [...prev];
              next[editingPhotoIdx] = editedUrl;
              return next;
            });
            setEditingPhotoIdx(null);
          }}
        />
      )}
    </div>
  );
}
