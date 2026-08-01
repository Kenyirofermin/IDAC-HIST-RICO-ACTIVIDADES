/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity } from './types';

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable (ej: "15 de Junio, 2026")
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const day = parseInt(dayStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const year = yearStr;

  const monthName = MESES[monthIdx] || '';
  return `${day} de ${monthName}, ${year}`;
}

/**
 * Obtiene el nombre del mes en español a partir del número de mes (1-12)
 */
export function getMonthName(monthNum: number): string {
  return MESES[monthNum - 1] || '';
}

/**
 * Organiza las actividades en una estructura jerárquica de Año -> Mes -> Día
 */
export function getTemporalGroups(activities: Activity[]) {
  const yearsMap: { [year: number]: { [month: number]: { [day: number]: Activity[] } } } = {};

  activities.forEach((activity) => {
    const { year, month, day } = activity;
    if (!yearsMap[year]) yearsMap[year] = {};
    if (!yearsMap[year][month]) yearsMap[year][month] = {};
    if (!yearsMap[year][month][day]) yearsMap[year][month][day] = [];
    
    yearsMap[year][month][day].push(activity);
  });

  // Convertimos a array ordenado (Años más recientes primero, meses más recientes, días más recientes)
  const years = Object.keys(yearsMap)
    .map(Number)
    .sort((a, b) => b - a);

  return years.map((year) => {
    const monthsMap = yearsMap[year];
    const months = Object.keys(monthsMap)
      .map(Number)
      .sort((a, b) => b - a)
      .map((month) => {
        const daysMap = monthsMap[month];
        const days = Object.keys(daysMap)
          .map(Number)
          .sort((a, b) => b - a)
          .map((day) => ({
            day,
            activities: daysMap[day].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
          }));

        return {
          month,
          monthName: getMonthName(month),
          days,
        };
      });

    return {
      year,
      months,
    };
  });
}
