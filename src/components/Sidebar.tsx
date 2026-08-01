/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity } from '../types';
import { getMonthName } from '../utils';
import { Search, Calendar, FolderHeart, ChevronDown, ChevronRight, Hash, X, User, MapPin, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activities: Activity[];
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedDay: number | null;
  selectedTag: string | null;
  selectedAuthor: string | null;
  selectedPlace: string | null;
  searchQuery: string;
  places: string[];
  onFilterChange: (filters: {
    year: number | null;
    month: number | null;
    day: number | null;
    tag: string | null;
    author: string | null;
    place: string | null;
    query: string;
  }) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  timelineLabel?: string;
  allRecollectionsLabel?: string;
  categoriesLabel?: string;
  authorsLabel?: string;
  placesLabel?: string;
}

export default function Sidebar({
  activities,
  selectedYear,
  selectedMonth,
  selectedDay,
  selectedTag,
  selectedAuthor,
  selectedPlace,
  searchQuery,
  places,
  onFilterChange,
  searchLabel = 'Buscar Archivo',
  searchPlaceholder = 'Título, nota o categoría...',
  timelineLabel = 'Línea Temporal',
  allRecollectionsLabel = 'Todos los recuerdos',
  categoriesLabel = 'Categorías',
  authorsLabel = 'Subido Por',
  placesLabel = 'Lugares / Secciones',
}: SidebarProps) {
  const [expandedYears, setExpandedYears] = useState<{ [year: number]: boolean }>({});

  // Calcular las estadísticas de organización temporal
  const stats = React.useMemo(() => {
    const yearsMap: {
      [year: number]: {
        count: number;
        months: { [month: number]: { count: number; days: Set<number> } };
      };
    } = {};

    const allTags = new Set<string>();
    const allAuthors = new Set<string>();
    const placeCounts: { [place: string]: number } = {};

    // Initialize all known places to 0
    places.forEach((p) => {
      placeCounts[p] = 0;
    });

    activities.forEach((activity) => {
      const { year, month, day, tags, author, place } = activity;

      // Tags
      if (tags) {
        tags.forEach((tag) => allTags.add(tag));
      }

      // Authors
      if (author) {
        allAuthors.add(author);
      }

      // Places count
      if (place) {
        placeCounts[place] = (placeCounts[place] || 0) + 1;
      }

      // Temporal counts
      if (!yearsMap[year]) {
        yearsMap[year] = { count: 0, months: {} };
      }
      yearsMap[year].count += 1;

      if (!yearsMap[year].months[month]) {
        yearsMap[year].months[month] = { count: 0, days: new Set() };
      }
      yearsMap[year].months[month].count += 1;
      yearsMap[year].months[month].days.add(day);
    });

    const sortedYears = Object.keys(yearsMap)
      .map(Number)
      .sort((a, b) => b - a);

    // Sorted places alphabetically
    const sortedPlaces = [...places].sort((a, b) => a.localeCompare(b));

    return {
      years: sortedYears,
      yearsMap,
      tags: Array.from(allTags),
      authors: Array.from(allAuthors).filter(Boolean),
      places: sortedPlaces,
      placeCounts,
    };
  }, [activities, places]);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const handleYearClick = (year: number) => {
    if (selectedYear === year && selectedMonth === null && selectedDay === null) {
      // Si ya está seleccionado, limpiar filtro de año
      onFilterChange({ year: null, month: null, day: null, tag: selectedTag, author: selectedAuthor, place: selectedPlace, query: searchQuery });
    } else {
      // Filtrar por año entero
      onFilterChange({ year, month: null, day: null, tag: selectedTag, author: selectedAuthor, place: selectedPlace, query: searchQuery });
      // Asegurarse de que esté expandido
      setExpandedYears((prev) => ({ ...prev, [year]: true }));
    }
  };

  const handleMonthClick = (e: React.MouseEvent, year: number, month: number) => {
    e.stopPropagation();
    if (selectedYear === year && selectedMonth === month && selectedDay === null) {
      onFilterChange({ year, month: null, day: null, tag: selectedTag, author: selectedAuthor, place: selectedPlace, query: searchQuery });
    } else {
      onFilterChange({ year, month, day: null, tag: selectedTag, author: selectedAuthor, place: selectedPlace, query: searchQuery });
    }
  };

  const handleDayClick = (e: React.MouseEvent, year: number, month: number, day: number) => {
    e.stopPropagation();
    if (selectedYear === year && selectedMonth === month && selectedDay === day) {
      onFilterChange({ year, month, day: null, tag: selectedTag, author: selectedAuthor, place: selectedPlace, query: searchQuery });
    } else {
      onFilterChange({ year, month, day, tag: selectedTag, author: selectedAuthor, place: selectedPlace, query: searchQuery });
    }
  };

  const resetAllFilters = () => {
    onFilterChange({ year: null, month: null, day: null, tag: null, author: null, place: null, query: '' });
  };

  const isFiltered = selectedYear !== null || selectedMonth !== null || selectedDay !== null || selectedTag !== null || selectedAuthor !== null || selectedPlace !== null || searchQuery !== '';

  return (
    <div className="w-full lg:w-72 flex flex-col gap-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-md">
      {/* Caja de Búsqueda */}
      <div className="flex flex-col gap-2">
        <label htmlFor="search-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          {searchLabel}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-idac-blue/50" />
          <input
            id="search-input"
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) =>
              onFilterChange({
                year: selectedYear,
                month: selectedMonth,
                day: selectedDay,
                tag: selectedTag,
                author: selectedAuthor,
                place: selectedPlace,
                query: e.target.value,
              })
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-idac-blue/10 focus:bg-white focus:border-idac-blue transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Navegación de Línea de Tiempo */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            {timelineLabel}
          </span>
          {isFiltered && (
            <button
              onClick={resetAllFilters}
              className="text-[10px] font-bold text-idac-blue hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {/* Botón de Todo / Inicio */}
          <button
            onClick={resetAllFilters}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 border uppercase tracking-wider ${
              !selectedYear && !selectedMonth && !selectedDay && !selectedTag && !selectedAuthor && !selectedPlace && !searchQuery
                ? 'bg-idac-blue text-white shadow-md border-idac-blue'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span>🏠 Inicio - {allRecollectionsLabel}</span>
            <span className="ml-auto text-[10px] opacity-80 font-mono">({activities.length})</span>
          </button>

          {/* Árbol de años y meses */}
          <div className="mt-2 space-y-1">
            {stats.years.map((year) => {
              const yearData = stats.yearsMap[year];
              const isYearSelected = selectedYear === year;
              const isExpanded = !!expandedYears[year] || isYearSelected;

              return (
                <div key={year} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-xs">
                  <div
                    onClick={() => handleYearClick(year)}
                    className={`group w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isYearSelected && selectedMonth === null
                        ? 'bg-idac-blue text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleYear(year);
                      }}
                      className={`p-0.5 rounded-lg transition-colors ${
                        isYearSelected && selectedMonth === null
                          ? 'text-white hover:bg-idac-dark'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    <span>{year}</span>
                    <span className={`ml-auto text-[10px] font-mono ${isYearSelected && selectedMonth === null ? 'text-white/70' : 'text-slate-400'}`}>
                      ({yearData.count})
                    </span>
                  </div>

                  {/* Meses del Año */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-2 pr-1 py-1 flex flex-col gap-0.5 overflow-hidden bg-blue-50/20"
                      >
                        {Object.keys(yearData.months)
                          .map(Number)
                          .sort((a, b) => b - a)
                          .map((month) => {
                            const monthData = yearData.months[month];
                            const isMonthSelected = selectedYear === year && selectedMonth === month;
                            const isMonthExpanded = isMonthSelected;

                            return (
                              <div key={month} className="flex flex-col">
                                <button
                                  onClick={(e) => handleMonthClick(e, year, month)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between border-l-2 uppercase tracking-wide ${
                                    isMonthSelected && selectedDay === null
                                      ? 'border-idac-blue bg-blue-50/40 text-idac-blue shadow-xs font-black'
                                      : 'border-transparent text-slate-500 hover:bg-slate-100/50'
                                  }`}
                                >
                                  <span className="truncate">{getMonthName(month)}</span>
                                  <span className="text-slate-400 font-mono text-[9px]">
                                    ({monthData.count})
                                  </span>
                                </button>

                                {/* Días del Mes (Mostrar solo si el mes está seleccionado) */}
                                {isMonthExpanded && (
                                  <div className="pl-3 pr-1 py-1.5 flex flex-wrap gap-1 bg-slate-50/50 rounded-lg border border-slate-100">
                                    {Array.from(monthData.days)
                                      .map(Number)
                                      .sort((a: number, b: number) => b - a)
                                      .map((day: number) => {
                                        const isDaySelected =
                                          selectedYear === year &&
                                          selectedMonth === month &&
                                          selectedDay === day;

                                        return (
                                          <button
                                            key={day}
                                            onClick={(e) => handleDayClick(e, year, month, day)}
                                            className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold transition-all border ${
                                              isDaySelected
                                                ? 'bg-idac-blue text-white border-idac-blue shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            Día {day}
                                          </button>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categorías (Tags) */}
      {stats.tags.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            {categoriesLabel}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {stats.tags.map((tag) => {
              const isTagSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() =>
                    onFilterChange({
                      year: selectedYear,
                      month: selectedMonth,
                      day: selectedDay,
                      tag: isTagSelected ? null : tag,
                      author: selectedAuthor,
                      place: selectedPlace,
                      query: searchQuery,
                    })
                  }
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider ${
                    isTagSelected
                      ? 'bg-idac-blue text-white border-idac-blue shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Hash className="w-3 h-3 opacity-60" />
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colaboradores / Autores */}
      {stats.authors.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            {authorsLabel}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {stats.authors.map((authorName) => {
              const isAuthorSelected = selectedAuthor === authorName;
              return (
                <button
                  key={authorName}
                  onClick={() =>
                    onFilterChange({
                      year: selectedYear,
                      month: selectedMonth,
                      day: selectedDay,
                      tag: selectedTag,
                      author: isAuthorSelected ? null : authorName,
                      place: selectedPlace,
                      query: searchQuery,
                    })
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider ${
                    isAuthorSelected
                      ? 'bg-idac-blue text-white border-idac-blue shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3 h-3 opacity-60" />
                  <span>{authorName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lugares / Secciones (Ordered Alphabetically) */}
      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          {placesLabel}
        </span>
        <div className="flex flex-col gap-1.5 mt-1 max-h-64 overflow-y-auto pr-1">
          {stats.places.map((placeName) => {
            const isPlaceSelected = selectedPlace === placeName;
            const count = stats.placeCounts[placeName] || 0;
            return (
              <button
                key={placeName}
                onClick={() =>
                  onFilterChange({
                    year: selectedYear,
                    month: selectedMonth,
                    day: selectedDay,
                    tag: selectedTag,
                    author: selectedAuthor,
                    place: isPlaceSelected ? null : placeName,
                    query: searchQuery,
                  })
                }
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 border uppercase tracking-wider ${
                  isPlaceSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <MapPin className={`w-4 h-4 shrink-0 ${isPlaceSelected ? 'text-white' : 'text-emerald-600'}`} />
                <span className="truncate">{placeName}</span>
                <span className={`ml-auto font-mono text-[9px] ${isPlaceSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
          {stats.places.length === 0 && (
            <span className="text-[10px] text-slate-400 italic font-medium py-1">
              No hay lugares configurados.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
