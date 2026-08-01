/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity } from './types';

const DB_NAME = 'ArchivoFotograficoDB';
const DB_VERSION = 1;
const STORE_NAME = 'actividades';

// Actividades semilla elegantes
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'mock-1',
    title: 'Excursión de Verano por la Costa',
    date: '2026-06-15',
    year: 2026,
    month: 6,
    day: 15,
    notes: 'Disfrutamos de una tarde increíble caminando por los senderos costeros. El clima estuvo perfecto, fresco pero despejado, y pudimos capturar la puesta del sol sobre el océano Pacífico. Un día de desconexión total y contacto directo con la naturaleza.',
    photos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['Naturaleza', 'Verano', 'Viajes'],
    author: 'Luis Martínez',
    createdAt: new Date('2026-06-15T18:30:00Z').toISOString(),
    place: 'Aeropuerto Internacional de Las Américas (AILA)',
  },
  {
    id: 'mock-2',
    title: 'Senderismo de Otoño en el Valle de la Montaña',
    date: '2025-10-12',
    year: 2025,
    month: 10,
    day: 12,
    notes: 'Una caminata exigente de 12 kilómetros cruzando bosques de robles y riachuelos alpinos. La vegetación otoñal pintaba el valle de intensos tonos naranjas, amarillos y rojizos. Llegamos a la cumbre justo a tiempo para almorzar con vistas panorámicas.',
    photos: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['Senderismo', 'Deporte', 'Montaña'],
    author: 'Sofía Alarcón',
    createdAt: new Date('2025-10-12T15:45:00Z').toISOString(),
    place: 'Torre de Control Santo Domingo (CCTA)',
  },
  {
    id: 'mock-3',
    title: 'Tarde de Café y Lectura en el Centro Histórico',
    date: '2026-01-24',
    year: 2026,
    month: 1,
    day: 24,
    notes: 'Explorando rincones literarios de la ciudad en una tarde lluviosa de invierno. Encontré una pequeña cafetería con estanterías llenas de libros antiguos. Pasé un par de horas leyendo novela histórica acompañada de un espresso doble macchiato y tarta de manzana tibia.',
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['Cultura', 'Relajación', 'Ciudad'],
    author: 'Carlos Ortega',
    createdAt: new Date('2026-01-24T17:00:00Z').toISOString(),
    place: 'Sede Central IDAC',
  }
];

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getActivities(): Promise<Activity[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = async () => {
      let activities = request.result as Activity[];
      
      // Si la base de datos está vacía, la sembramos con ejemplos hermosos
      if (activities.length === 0) {
        try {
          await seedDatabase(MOCK_ACTIVITIES);
          activities = [...MOCK_ACTIVITIES];
        } catch (e) {
          console.error('Error seeding database:', e);
        }
      }
      
      // Ordenar cronológicamente (más recientes primero)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(activities);
    };
  });
}

async function seedDatabase(activities: Activity[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    activities.forEach((activity) => {
      store.put(activity);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveActivity(activity: Activity): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(activity);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
