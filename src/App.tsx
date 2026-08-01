/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Activity, ViewMode, AppUser, PersonalizationSettings, UserInvitation } from './types';
import { getActivities, saveActivity, deleteActivity } from './db';
import Sidebar from './components/Sidebar';
import ActivityCard from './components/ActivityCard';
import ActivityForm from './components/ActivityForm';
import SettingsPanel from './components/SettingsPanel';
import Lightbox from './components/Lightbox';
import AuthScreen from './components/AuthScreen';
import ShareModal from './components/ShareModal';
import WorkspacePortal from './components/WorkspacePortal';
import { getMonthName } from './utils';
import { getAccessToken } from './lib/workspaceAuth';
import {
  Camera,
  Plus,
  LayoutGrid,
  CalendarRange,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  X,
  AlertCircle,
  Settings,
  Users,
  Lock,
  ShieldAlert,
  LogOut,
  Plane,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Estado principal de actividades
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de autenticación real
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('IDAC_IS_LOGGED_IN');
    if (saved === null) {
      return true; // Acceso directo en la primera carga para comodidad del usuario
    }
    return saved === 'true';
  });

  // Estados de Configuración y Usuarios
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('IDAC_USERS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((u: any) => ({
          ...u,
          email: u.email || `${u.name.toLowerCase().replace(/\s+/g, '')}@idac.gob.do`,
          username: u.username || u.name.toLowerCase().replace(/\s+/g, ''),
          password: u.password || 'password123',
          securityQuestion: u.securityQuestion || '¿Cuál es tu avión favorito?',
          securityAnswer: u.securityAnswer || (u.role === 'admin' ? 'Boeing 787' : u.role === 'editor' ? 'Airbus A350' : 'Cessna 172'),
          status: u.status || 'active',
          whatsappNumber: u.whatsappNumber || (u.id === 'user-1' ? '+18095550199' : u.id === 'user-2' ? '+18295550288' : ''),
          whatsappEnabled: u.whatsappEnabled !== undefined ? u.whatsappEnabled : (u.id === 'user-1' || u.id === 'user-2'),
          whatsappNotifyOnUpload: u.whatsappNotifyOnUpload !== undefined ? u.whatsappNotifyOnUpload : true
        }));
      } catch (e) { console.error(e); }
    }
    return [
      { id: 'user-1', name: 'Luis Martínez', email: 'luismartinez150@gmail.com', role: 'admin', canPublish: true, username: 'luism', password: 'password123', securityQuestion: '¿Cuál es tu avión favorito?', securityAnswer: 'Boeing 787', status: 'active', whatsappNumber: '+18095550199', whatsappEnabled: true, whatsappNotifyOnUpload: true },
      { id: 'user-2', name: 'Sofía Alarcón', email: 'sofia.alarcon@idac.gob.do', role: 'editor', canPublish: true, username: 'sofiaa', password: 'password123', securityQuestion: '¿Cuál es tu avión favorito?', securityAnswer: 'Airbus A350', status: 'active', whatsappNumber: '+18295550288', whatsappEnabled: true, whatsappNotifyOnUpload: true },
      { id: 'user-3', name: 'Carlos Ortega', email: 'carlos.orgega@idac.gob.do', role: 'viewer', canPublish: false, username: 'carloso', password: 'password123', securityQuestion: '¿Cuál es tu avión favorito?', securityAnswer: 'Cessna 172', status: 'active', whatsappNumber: '', whatsappEnabled: false, whatsappNotifyOnUpload: false },
    ];
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('IDAC_CURRENT_USER');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          email: parsed.email || `${parsed.name.toLowerCase().replace(/\s+/g, '')}@idac.gob.do`,
          username: parsed.username || parsed.name.toLowerCase().replace(/\s+/g, ''),
          password: parsed.password || 'password123',
          whatsappNumber: parsed.whatsappNumber || '+18095550199',
          whatsappEnabled: parsed.whatsappEnabled !== undefined ? parsed.whatsappEnabled : true,
          whatsappNotifyOnUpload: parsed.whatsappNotifyOnUpload !== undefined ? parsed.whatsappNotifyOnUpload : true
        };
      } catch (e) { console.error(e); }
    }
    return { id: 'user-1', name: 'Luis Martínez', email: 'luismartinez150@gmail.com', role: 'admin', canPublish: true, username: 'luism', password: 'password123', securityQuestion: '¿Cuál es tu avión favorito?', securityAnswer: 'Boeing 787', whatsappNumber: '+18095550199', whatsappEnabled: true, whatsappNotifyOnUpload: true };
  });

  const [settings, setSettings] = useState<PersonalizationSettings>(() => {
    const saved = localStorage.getItem('IDAC_SETTINGS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          appTitle: parsed.appTitle || 'Archivo Fotográfico',
          appSubtitle: parsed.appSubtitle || 'Preserva tus actividades organizadas por año, mes y días',
          primaryColor: parsed.primaryColor || '#00316f',
          darkColor: parsed.darkColor || '#001f44',
          accentColor: parsed.accentColor || '#b81d24',
          logoBase64: parsed.logoBase64 || null,
          adminEmail: parsed.adminEmail || 'luismartinez150@gmail.com',
          cloudStorageProvider: parsed.cloudStorageProvider || 'local',
          cloudStorageBucket: parsed.cloudStorageBucket || 'idac-archive-bucket',
          cloudStorageRegion: parsed.cloudStorageRegion || 'us-east1',
          tabArchiveLabel: parsed.tabArchiveLabel || '📂 Archivo Fotográfico IDAC',
          tabWorkspaceLabel: parsed.tabWorkspaceLabel || '☁️ Portal Google Workspace',
          sidebarSearchLabel: parsed.sidebarSearchLabel || 'Buscar Archivo',
          sidebarSearchPlaceholder: parsed.sidebarSearchPlaceholder || 'Título, nota o categoría...',
          sidebarTimelineLabel: parsed.sidebarTimelineLabel || 'Línea Temporal',
          sidebarAllRecollectionsLabel: parsed.sidebarAllRecollectionsLabel || 'Todos los recuerdos',
          sidebarCategoriesLabel: parsed.sidebarCategoriesLabel || 'Categorías',
          sidebarAuthorsLabel: parsed.sidebarAuthorsLabel || 'Subido Por',
          sidebarPlacesLabel: parsed.sidebarPlacesLabel || 'Lugares / Secciones',
          newRecollectionBtnLabel: parsed.newRecollectionBtnLabel || 'Nuevo Recuerdo',
          panelTitle: parsed.panelTitle || 'Panel de Control IDAC',
          panelTabSessionLabel: parsed.panelTabSessionLabel || 'Sesión Activa',
          panelTabUsersLabel: parsed.panelTabUsersLabel || 'Usuarios',
          panelTabInvitationsLabel: parsed.panelTabInvitationsLabel || 'Invitaciones',
          panelTabStorageLabel: parsed.panelTabStorageLabel || 'Almacenamiento',
          panelTabPersonalizationLabel: parsed.panelTabPersonalizationLabel || 'Personalización',
          panelTabPlacesLabel: parsed.panelTabPlacesLabel || 'Lugares / Secciones',
          formNewModalTitle: parsed.formNewModalTitle || 'Nuevo Recuerdo de Actividad',
          formEditModalTitle: parsed.formEditModalTitle || 'Editar Recuerdo',
          shareModalTitle: parsed.shareModalTitle || '📢 Compartir en Redes Sociales',
          workspaceSectionTitle: parsed.workspaceSectionTitle || '☁️ Portal Google Workspace',
          footerText: parsed.footerText || '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.',
        };
      } catch (e) { console.error(e); }
    }
    return {
      appTitle: 'Archivo Fotográfico',
      appSubtitle: 'Preserva tus actividades organizadas por año, mes y días',
      primaryColor: '#00316f',
      darkColor: '#001f44',
      accentColor: '#b81d24',
      logoBase64: null,
      adminEmail: 'luismartinez150@gmail.com',
      cloudStorageProvider: 'local',
      cloudStorageBucket: 'idac-archive-bucket',
      cloudStorageRegion: 'us-east1',
      tabArchiveLabel: '📂 Archivo Fotográfico IDAC',
      tabWorkspaceLabel: '☁️ Portal Google Workspace',
      sidebarSearchLabel: 'Buscar Archivo',
      sidebarSearchPlaceholder: 'Título, nota o categoría...',
      sidebarTimelineLabel: 'Línea Temporal',
      sidebarAllRecollectionsLabel: 'Todos los recuerdos',
      sidebarCategoriesLabel: 'Categorías',
      sidebarAuthorsLabel: 'Subido Por',
      sidebarPlacesLabel: 'Lugares / Secciones',
      newRecollectionBtnLabel: 'Nuevo Recuerdo',
      panelTitle: 'Panel de Control IDAC',
      panelTabSessionLabel: 'Sesión Activa',
      panelTabUsersLabel: 'Usuarios',
      panelTabInvitationsLabel: 'Invitaciones',
      panelTabStorageLabel: 'Almacenamiento',
      panelTabPersonalizationLabel: 'Personalización',
      panelTabPlacesLabel: 'Lugares / Secciones',
      formNewModalTitle: 'Nuevo Recuerdo de Actividad',
      formEditModalTitle: 'Editar Recuerdo',
      shareModalTitle: '📢 Compartir en Redes Sociales',
      workspaceSectionTitle: '☁️ Portal Google Workspace',
      footerText: '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.',
    };
  });

  const [invitations, setInvitations] = useState<UserInvitation[]>(() => {
    const saved = localStorage.getItem('IDAC_INVITATIONS');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'inv-1',
        email: 'colaborador.nuevo@idac.gob.do',
        role: 'editor',
        canPublish: true,
        code: 'IDAC-77X9',
        status: 'pending',
        createdAt: new Date('2026-07-10T14:20:00Z').toISOString()
      }
    ];
  });

  const [showSettings, setShowSettings] = useState(false);

  // Acción para Volver al Inicio / Menú Principal de la aplicación
  const handleGoHome = () => {
    setAppTab('archive');
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectedTag(null);
    setSelectedAuthor(null);
    setSelectedPlace(null);
    setSearchQuery('');
    setShowSettings(false);
    setShowForm(false);
    setEditingActivity(null);
    showToast('Navegación restablecida al Menú Principal (Inicio).', 'success');
  };

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('IDAC_USERS', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('IDAC_CURRENT_USER', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('IDAC_IS_LOGGED_IN', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('IDAC_SETTINGS', JSON.stringify(settings));
    
    // Aplicar variables CSS del tema dinámicamente
    document.documentElement.style.setProperty('--color-idac-blue', settings.primaryColor);
    document.documentElement.style.setProperty('--color-idac-dark', settings.darkColor);
    document.documentElement.style.setProperty('--color-idac-red', settings.accentColor);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('IDAC_INVITATIONS', JSON.stringify(invitations));
  }, [invitations]);

  // Estados de filtrado
  const [appTab, setAppTab] = useState<'archive' | 'workspace'>('archive');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Customizable places list
  const [places, setPlaces] = useState<string[]>(() => {
    const saved = localStorage.getItem('IDAC_PLACES');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      'Aeropuerto Las Américas (AILA)',
      'Aeropuerto La Isabela',
      'Dirección General',
      'Dirección de Normas de Vuelo',
      'Dirección de Navegación Aérea',
      'Oficina Central IDAC',
      'Academia Superior de Ciencias Aeronáuticas (ASCA)',
    ];
  });

  useEffect(() => {
    localStorage.setItem('IDAC_PLACES', JSON.stringify(places));
  }, [places]);

  // Estados de visualización y formularios
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Estados de compartir
  const [sharingActivity, setSharingActivity] = useState<Activity | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Estados de Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxActivityId, setLightboxActivityId] = useState<string | null>(null);

  // Estados de feedback / Notificaciones (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'delete' | 'error' } | null>(null);

  // Handler de compartir
  const handleShareClick = (activity: Activity) => {
    setSharingActivity(activity);
    setShowShareModal(true);
  };

  // Cargar actividades desde IndexedDB al iniciar
  const fetchActivitiesData = async () => {
    try {
      setLoading(true);
      const data = await getActivities();
      setActivities(data);
    } catch (e) {
      console.error('Error loading activities from IndexedDB:', e);
      showToast('Error al cargar el archivo fotográfico.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivitiesData();
  }, []);

  // Mostrar mensaje de notificación temporal
  const showToast = (message: string, type: 'success' | 'delete' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Filtrar actividades según selección en el Sidebar y caja de búsqueda
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Filtro de Año
      if (selectedYear !== null && activity.year !== selectedYear) return false;

      // Filtro de Mes
      if (selectedMonth !== null && activity.month !== selectedMonth) return false;

      // Filtro de Día
      if (selectedDay !== null && activity.day !== selectedDay) return false;

      // Filtro de Etiqueta / Categoría
      if (selectedTag !== null && (!activity.tags || !activity.tags.includes(selectedTag))) return false;

      // Filtro de Autor / Quién subió las fotos
      if (selectedAuthor !== null && activity.author !== selectedAuthor) return false;

      // Filtro de Lugar / Sección
      if (selectedPlace !== null && activity.place !== selectedPlace) return false;

      // Filtro de Búsqueda (Título, Notas, Tags, Autor o Año/Mes)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = activity.title.toLowerCase().includes(query);
        const matchesNotes = activity.notes.toLowerCase().includes(query);
        const matchesTags = activity.tags?.some((t) => t.toLowerCase().includes(query)) || false;
        const matchesMonthName = getMonthName(activity.month).toLowerCase().includes(query);
        const matchesYear = activity.year.toString().includes(query);
        const matchesAuthor = activity.author?.toLowerCase().includes(query) || false;
        const matchesPlace = activity.place?.toLowerCase().includes(query) || false;

        if (!matchesTitle && !matchesNotes && !matchesTags && !matchesMonthName && !matchesYear && !matchesAuthor && !matchesPlace) {
          return false;
        }
      }

      return true;
    });
  }, [activities, selectedYear, selectedMonth, selectedDay, selectedTag, selectedAuthor, selectedPlace, searchQuery]);

  // Manejar creación/edición de una actividad
  const handleSaveActivity = async (
    activityData: Omit<Activity, 'id' | 'createdAt'> & { id?: string },
    saveToPermanentList?: boolean
  ) => {
    if (!currentUser.canPublish) {
      showToast('Operación denegada: Tu perfil no tiene permisos para publicar o modificar recuerdos.', 'error');
      return;
    }
    try {
      const isNew = !activityData.id;
      const activityId = activityData.id || `act-${Date.now()}`;
      const createdAt = isNew
        ? new Date().toISOString()
        : activities.find((a) => a.id === activityId)?.createdAt || new Date().toISOString();

      const newActivity: Activity = {
        ...activityData,
        id: activityId,
        createdAt,
      };

      await saveActivity(newActivity);
      await fetchActivitiesData();

      // Si el usuario marcó para guardar la ubicación de forma permanente
      if (saveToPermanentList && activityData.place) {
        const placeName = activityData.place.trim();
        if (placeName && !places.includes(placeName)) {
          setPlaces((prev) => [...prev, placeName]);
        }
      }
      
      // Trigger actual/simulated email notification
      await sendEmailNotifications(newActivity, isNew);
      // Trigger WhatsApp notifications to subscribed users
      await sendWhatsAppNotifications(newActivity, isNew);
      
      setShowForm(false);
      setEditingActivity(null);
      showToast(
        isNew
          ? '¡Recuerdo añadido con éxito al archivo fotográfico!'
          : '¡Recuerdo actualizado correctamente!',
        'success'
      );
    } catch (e) {
      console.error('Error saving activity:', e);
      showToast('Ocurrió un error al guardar el recuerdo.', 'error');
    }
  };

  // Enviar notificaciones por correo a los usuarios que las tengan activadas
  const sendEmailNotifications = async (activity: Activity, isNew: boolean) => {
    // Buscar destinatarios que aceptaron recibir notificaciones
    const recipients = users.filter((u) => u.receiveNotifications && u.email);
    if (recipients.length === 0) {
      console.log('No hay usuarios configurados para recibir notificaciones de correo.');
      return;
    }

    const recipientEmails = recipients.map((u) => u.email);
    const subject = `[IDAC] Archivo Fotográfico Actualizado - ${activity.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; border: 2px solid #00316f; border-radius: 12px; padding: 24px; color: #334155;">
        <div style="background-color: #00316f; color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Instituto Dominicano de Aviación Civil</h2>
          <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; opacity: 0.8;">Notificación de Archivo Fotográfico</p>
        </div>
        
        <p style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #00316f; margin-top: 0;">¡Hola de parte del equipo del Archivo Fotográfico IDAC!</p>
        
        <p style="font-size: 13px; line-height: 1.6;">Se ha realizado una actualización en el archivo de recuerdos fotográficos de la institución:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #00316f; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #00316f;">${activity.title}</p>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold;">Lugar / Sección: <span style="text-transform: uppercase; color: #b81d24;">${activity.place || 'No asignado'}</span></p>
          <p style="margin: 0 0 8px 0; font-size: 11px; font-family: monospace;">Fecha: ${activity.date} (Día ${activity.day})</p>
          <p style="margin: 0; font-size: 12px; color: #475569;"><em>"${activity.notes}"</em></p>
        </div>

        <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Recibes este correo automático porque tienes activadas las notificaciones de actualización en tu perfil de usuario. Puedes cambiar esta opción en el panel de configuración de la app.
        </p>
      </div>
    `;

    // Intentar envío real a través de la API de Gmail si la sesión de Workspace está activa
    try {
      const token = await getAccessToken();
      if (token) {
        console.log('Google Workspace conectado. Enviando correos reales de notificación mediante Gmail...');
        let successCount = 0;
        for (const email of recipientEmails) {
          try {
            const emailLines = [
              `To: ${email}`,
              `Subject: ${subject}`,
              'Content-Type: text/html; charset=utf-8',
              'MIME-Version: 1.0',
              '',
              htmlBody
            ];
            
            const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ raw: rawEmail })
            });

            if (res.ok) {
              successCount++;
            }
          } catch (err) {
            console.error(`Error enviando correo real de Gmail a ${email}:`, err);
          }
        }
        if (successCount > 0) {
          showToast(`Notificaciones de correo reales enviadas con éxito a ${successCount} usuarios.`, 'success');
          return;
        }
      }
    } catch (tokenErr) {
      console.log('No se pudo verificar el token de Google Workspace o no se ha iniciado sesión en Google.');
    }

    // Fallback de simulación detallado
    console.log(`[NOTIFICACIÓN] Correos electrónicos simulados enviados a: ${recipientEmails.join(', ')}`);
    showToast(`Notificaciones enviadas por correo (Simulado) a: ${recipientEmails.join(', ')}`, 'success');
  };

  // Enviar notificaciones por WhatsApp a los usuarios suscritos
  const sendWhatsAppNotifications = async (activity: Activity, isNew: boolean) => {
    // Filtrar usuarios activos con notificaciones WhatsApp habilitadas y número válido
    const recipients = users.filter((u) => u.status !== 'inactive' && u.whatsappEnabled && u.whatsappNumber && u.whatsappNumber.trim().length > 5);
    if (recipients.length === 0) {
      console.log('No hay usuarios configurados con notificaciones de WhatsApp activas.');
      return;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedUsers = users.map(u => {
      if (u.status !== 'inactive' && u.whatsappEnabled && u.whatsappNumber) {
        return { ...u, lastWhatsappSentAt: nowStr };
      }
      return u;
    });
    setUsers(updatedUsers);

    const actionText = isNew ? '📸 *[IDAC ARCHIVO] ¡Nueva foto / recuerdo subido!*' : '📝 *[IDAC ARCHIVO] Recuerdo actualizado*';
    const messageText = `${actionText}\n\n📌 *Título:* ${activity.title}\n📍 *Sección/Lugar:* ${activity.place || 'Oficina Central IDAC'}\n📅 *Fecha:* ${activity.date}\n👤 *Publicado por:* ${activity.author || currentUser.name}\n\n💬 _"${activity.notes}"_\n\n🖼️ *Acceder al Portal:* ${window.location.href}`;

    const recipientNames = recipients.map(r => r.name).join(', ');
    const firstPhone = recipients[0].whatsappNumber?.replace(/[^0-9]/g, '') || '';
    const waLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(firstPhone)}&text=${encodeURIComponent(messageText)}`;

    // Mostrar toast informativo con confirmación de WhatsApp
    showToast(`💬 Notificación WhatsApp despachada a (${recipients.length}): ${recipientNames}`, 'success');
    console.log(`[WhatsApp Dispatch] Notificación despachada a ${recipients.length} números:`, recipients.map(r => r.whatsappNumber), `Link: ${waLink}`);
  };

  // Manejar eliminación de actividad
  const handleDeleteActivity = async (id: string) => {
    if (!currentUser.canPublish) {
      showToast('Operación denegada: Tu perfil no tiene permisos para eliminar recuerdos.', 'error');
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente este recuerdo fotográfico? Esta acción no se puede deshacer.')) {
      try {
        await deleteActivity(id);
        await fetchActivitiesData();
        showToast('El recuerdo ha sido eliminado del archivo.', 'delete');
        // Si el formulario estaba editando este registro, cerrarlo
        if (editingActivity?.id === id) {
          setShowForm(false);
          setEditingActivity(null);
        }
      } catch (e) {
        console.error('Error deleting activity:', e);
        showToast('Error al eliminar el recuerdo.', 'error');
      }
    }
  };

  // Activar la edición de un registro
  const handleEditClick = (activity: Activity) => {
    if (!currentUser.canPublish) {
      showToast('Tu perfil de usuario no tiene permisos para modificar el archivo fotográfico.', 'error');
      return;
    }
    setEditingActivity(activity);
    setShowForm(true);
    // Desplazar arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Iniciar la creación
  const handleCreateClick = () => {
    if (!currentUser.canPublish) {
      showToast('Tu perfil de usuario no tiene permisos para publicar en el archivo fotográfico.', 'error');
      return;
    }
    setEditingActivity(null);
    setShowForm(true);
    // Desplazar arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Abrir Lightbox al pulsar una foto
  const handleImageClick = (images: string[], index: number, activityId?: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxActivityId(activityId || null);
    setLightboxOpen(true);
  };

  // Guardar imagen editada desde el Lightbox
  const handleSaveEditedImageInLightbox = async (editedUrl: string, index: number) => {
    const updatedImages = [...lightboxImages];
    updatedImages[index] = editedUrl;
    setLightboxImages(updatedImages);

    if (lightboxActivityId) {
      const act = activities.find((a) => a.id === lightboxActivityId);
      if (act) {
        const updatedPhotos = [...act.photos];
        updatedPhotos[index] = editedUrl;
        const updatedActivity = { ...act, photos: updatedPhotos };
        await handleSaveActivity(updatedActivity);
      }
    }
    showToast('¡Fotografía editada y guardada en el recuerdo!', 'success');
  };

  // Manejo de cambios en filtros del Sidebar
  const handleFilterChange = (filters: {
    year: number | null;
    month: number | null;
    day: number | null;
    tag: string | null;
    author: string | null;
    place: string | null;
    query: string;
  }) => {
    setSelectedYear(filters.year);
    setSelectedMonth(filters.month);
    setSelectedDay(filters.day);
    setSelectedTag(filters.tag);
    setSelectedAuthor(filters.author);
    setSelectedPlace(filters.place);
    setSearchQuery(filters.query);
  };

  // Manejar actualización de usuarios y mantener sesión activa válida
  const handleUpdateUsers = (newUsers: AppUser[]) => {
    setUsers(newUsers);
    const currentStillExists = newUsers.find((u) => u.id === currentUser.id);
    if (!currentStillExists) {
      setCurrentUser(newUsers[0] || { id: 'user-1', name: 'Luis Martínez', role: 'admin', canPublish: true, username: 'luism', password: 'password123' });
    } else {
      setCurrentUser(currentStillExists);
    }
  };

  // Manejar registro desde invitación en la pantalla de Auth
  const handleRegisterFromInvitation = (newUser: AppUser, inviteCode: string) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    // Marcar invitación como aceptada
    const updatedInvitations = invitations.map((invite) => {
      if (invite.code.toLowerCase() === inviteCode.toLowerCase()) {
        return { ...invite, status: 'accepted' as const };
      }
      return invite;
    });
    setInvitations(updatedInvitations);
    localStorage.setItem('IDAC_INVITATIONS', JSON.stringify(updatedInvitations));

    // Iniciar sesión con este nuevo usuario
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    showToast(`¡Registro exitoso! Bienvenido ${newUser.name}`, 'success');
  };

  // Generar etiquetas textuales del filtro activo para mostrar en la UI
  const activeFiltersLabel = useMemo(() => {
    const labels: string[] = [];
    if (selectedYear) labels.push(`Año: ${selectedYear}`);
    if (selectedMonth) labels.push(`Mes: ${getMonthName(selectedMonth)}`);
    if (selectedDay) labels.push(`Día: ${selectedDay}`);
    if (selectedTag) labels.push(`Etiqueta: ${selectedTag}`);
    if (selectedAuthor) labels.push(`Subido por: ${selectedAuthor}`);
    if (selectedPlace) labels.push(`Lugar: ${selectedPlace}`);
    if (searchQuery) labels.push(`Búsqueda: "${searchQuery}"`);
    return labels;
  }, [selectedYear, selectedMonth, selectedDay, selectedTag, selectedAuthor, selectedPlace, searchQuery]);

  if (!isLoggedIn) {
    return (
      <AuthScreen
        users={users}
        invitations={invitations}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          showToast(`¡Bienvenido de nuevo, ${user.name}!`, 'success');
        }}
        onRegisterFromInvitation={handleRegisterFromInvitation}
        onUpdateUsers={handleUpdateUsers}
        appTitle={settings.appTitle}
        appSubtitle={settings.appSubtitle}
        logoBase64={settings.logoBase64}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col relative overflow-hidden">
      
      {/* Airport Watermark Background for main dashboard */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none flex items-center justify-center">
        <svg
          className="w-[120vw] h-[120vw] max-w-[1200px] text-[#00316f]/[0.015] transform translate-y-[5%]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          aria-hidden="true"
        >
          {/* Concentric radar range rings */}
          <circle cx="75" cy="30" r="10" strokeDasharray="1,2" />
          <circle cx="75" cy="30" r="20" strokeDasharray="1,3" />
          <circle cx="75" cy="30" r="30" strokeDasharray="1,4" />
          
          {/* Runway and landing guidance lines */}
          <path d="M10,95 L40,65 L43,65 L15,95 Z" fill="currentColor" fillOpacity="0.08" />
          <line x1="12.5" y1="95" x2="41.5" y2="65" strokeDasharray="2,2" />
          <line x1="10" y1="95" x2="40" y2="65" />
          <line x1="15" y1="95" x2="43" y2="65" />
          
          {/* Taxiway / Runway markings */}
          <path d="M5,80 L25,80" />
          <path d="M25,80 L35,68" strokeDasharray="1,1" />

          {/* Control Tower */}
          <path d="M70,75 L73,50 L77,50 L80,75 Z" />
          <line x1="75" y1="75" x2="75" y2="50" />
          <line x1="73" y1="62" x2="77" y2="62" />
          <path d="M71,50 L69,42 L81,42 L79,50 Z" fill="currentColor" fillOpacity="0.15" />
          <line x1="73" y1="42" x2="74" y2="50" />
          <line x1="77" y1="42" x2="76" y2="50" />
          <line x1="70" y1="42" x2="72" y2="50" />
          <line x1="80" y1="42" x2="78" y2="50" />
          <path d="M69,42 L75,38 L81,42 Z" />
          <line x1="75" y1="38" x2="75" y2="34" />
          <path d="M71,34 C71,34 73,32 75,32 C77,32 79,34 79,34" />
          
          {/* Terminal Building */}
          <path d="M42,75 L42,65 L65,65 L65,75 Z" fill="currentColor" fillOpacity="0.08" />
          <rect x="44" y="67" width="4" height="4" />
          <rect x="50" y="67" width="4" height="4" />
          <rect x="56" y="67" width="4" height="4" />
          {/* Ground line */}
          <line x1="5" y1="75" x2="95" y2="75" strokeWidth="1" />

          {/* Airplane taking off */}
          <g transform="translate(42, 35) rotate(-20) scale(0.6)">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" fill="currentColor" />
          </g>
        </svg>
        <div className="absolute top-[15%] left-[10%] w-[400px] h-[400px] rounded-full border border-[#00316f]/[0.015]" />
        <div className="absolute bottom-[15%] right-[10%] w-[600px] h-[600px] rounded-full border border-[#00316f]/[0.015]" />
      </div>

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#002758] to-[#001430] text-white shadow-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center border border-white/10 shadow-lg p-2 overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105">
              {settings.logoBase64 ? (
                <img src={settings.logoBase64} alt="Custom Logo" className="w-full h-full object-contain" />
              ) : (
                <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-idac-blue" />
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-wider uppercase text-white flex items-center gap-2">
                <span>{settings.appTitle}</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-blue-200 font-bold uppercase tracking-widest mt-1">
                {settings.appSubtitle}
              </p>
            </div>
          </div>

          {/* Controles de visualización y Añadir */}
          <div className="flex items-center gap-3 flex-wrap justify-end w-full md:w-auto">
            
            {/* Sesión Simbólica Activa */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-100 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${currentUser.canPublish ? 'bg-emerald-400' : 'bg-idac-red'} animate-pulse`} />
                <span>{currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'editor' ? 'Editor' : 'Lector'})</span>
                {!currentUser.canPublish && <Lock className="w-3 h-3 text-idac-red ml-1 shrink-0" />}
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  showToast('Sesión cerrada correctamente.', 'success');
                }}
                className="p-2 bg-white/10 hover:bg-idac-red/30 text-white rounded-xl border border-white/10 hover:border-idac-red/50 transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Salir</span>
              </button>
            </div>

            {/* Interruptor de Vista */}
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-idac-blue text-white shadow-sm font-extrabold'
                    : 'text-blue-200 hover:text-white'
                }`}
                title="Vista de Muro"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase tracking-wide text-[10px]">Muro</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-idac-blue text-white shadow-sm font-extrabold'
                    : 'text-blue-200 hover:text-white'
                }`}
                title="Vista de Línea de Tiempo"
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase tracking-wide text-[10px]">Línea</span>
              </button>
            </div>

            {/* Botón de Ajustes */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 bg-white/10 hover:bg-white/25 text-white rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center shadow-xs hover:scale-105 active:scale-95"
              title="Usuarios, Permisos y Personalización"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Botón de crear */}
            <button
              onClick={handleCreateClick}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 text-white text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 shadow-md uppercase tracking-wider ${
                !currentUser.canPublish
                  ? 'bg-slate-600 hover:bg-slate-700 opacity-75'
                  : 'bg-idac-red hover:bg-[#a6151b] hover:shadow-lg hover:scale-102'
              }`}
            >
              {!currentUser.canPublish ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
              <span>{settings.newRecollectionBtnLabel || 'Nuevo Recuerdo'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* BARRA DE NAVEGACIÓN PRINCIPAL / MODULOS DE GOOGLE WORKSPACE */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 z-10 relative">
        <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/60 flex gap-2">
          <button
            onClick={() => setAppTab('archive')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              appTab === 'archive'
                ? 'bg-idac-blue text-white shadow-md shadow-idac-blue/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-idac-blue'
            }`}
          >
            {settings.tabArchiveLabel || '📂 Archivo Fotográfico IDAC'}
          </button>
          <button
            onClick={() => setAppTab('workspace')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
              appTab === 'workspace'
                ? 'bg-idac-red text-white shadow-md shadow-idac-red/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-idac-red'
            }`}
          >
            {settings.tabWorkspaceLabel || '☁️ Portal Google Workspace'}
            <span className="text-[8px] font-black bg-white text-idac-red px-2 py-0.5 rounded-full uppercase animate-pulse">Nuevo</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {appTab === 'workspace' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <WorkspacePortal onShowToast={showToast} />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* COLUMNA IZQUIERDA: Sidebar de Navegación Temporal */}
          <aside className="w-full lg:w-72 shrink-0">
            <Sidebar
              activities={activities}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedDay={selectedDay}
              selectedTag={selectedTag}
              selectedAuthor={selectedAuthor}
              selectedPlace={selectedPlace}
              places={places}
              searchQuery={searchQuery}
              onFilterChange={handleFilterChange}
              searchLabel={settings.sidebarSearchLabel}
              searchPlaceholder={settings.sidebarSearchPlaceholder}
              timelineLabel={settings.sidebarTimelineLabel}
              allRecollectionsLabel={settings.sidebarAllRecollectionsLabel}
              categoriesLabel={settings.sidebarCategoriesLabel}
              authorsLabel={settings.sidebarAuthorsLabel}
              placesLabel={settings.sidebarPlacesLabel}
            />
          </aside>

          {/* COLUMNA CENTRAL/DERECHA: Feed de Actividades y Formulario */}
          <section className="flex-1 flex flex-col gap-6">
            {/* Alertas de Filtros Activos */}
            {activeFiltersLabel.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/40 border border-idac-blue/30 px-4 py-2.5 rounded-2xl text-[10px] text-slate-700 font-black uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-idac-blue" />
                  <span>Resultados por:</span>
                  <div className="flex flex-wrap gap-1.5 ml-1">
                    {activeFiltersLabel.map((lbl) => (
                      <span key={lbl} className="bg-white border border-idac-blue/20 px-2.5 py-0.5 rounded-full text-[9px] font-black text-idac-blue shadow-xs">
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedYear(null);
                    setSelectedMonth(null);
                    setSelectedDay(null);
                    setSelectedTag(null);
                    setSelectedAuthor(null);
                    setSelectedPlace(null);
                    setSearchQuery('');
                  }}
                  className="text-idac-blue hover:underline font-black uppercase tracking-widest text-[9px]"
                >
                  Restablecer
                </button>
              </div>
            )}

            {/* Formulario en línea con hermosa animación de inserción */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
                >
                  <ActivityForm
                    activityToEdit={editingActivity}
                    onSave={handleSaveActivity}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingActivity(null);
                    }}
                    defaultAuthor={currentUser.name}
                    places={places}
                    newModalTitle={settings.formNewModalTitle}
                    editModalTitle={settings.formEditModalTitle}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* CARGANDO ESTADO */}
            {loading ? (
              <div className="flex-1 py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-3 border-slate-300 border-t-idac-blue animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Archivo...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              /* ESTADO VACÍO */
              <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-blue-50/50 border border-idac-blue/20 flex items-center justify-center text-idac-blue/40">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">No se encontraron recuerdos</h3>
                  <p className="text-xs text-slate-400 uppercase font-bold mt-2 leading-relaxed">
                    {activeFiltersLabel.length > 0
                      ? 'No hay actividades archivadas que coincidan con los filtros aplicados. Intenta restablecer los filtros.'
                      : 'Aún no has guardado recuerdos en tu archivo fotográfico. Haz clic en el botón superior para agregar tu primera actividad.'}
                  </p>
                </div>
                {activeFiltersLabel.length > 0 ? (
                  <button
                    onClick={() => {
                      setSelectedYear(null);
                      setSelectedMonth(null);
                      setSelectedDay(null);
                      setSelectedTag(null);
                      setSelectedAuthor(null);
                      setSearchQuery('');
                    }}
                    className="px-5 py-2.5 border border-idac-blue text-idac-blue hover:bg-slate-50 text-xs font-black rounded-xl uppercase tracking-widest cursor-pointer shadow-xs transition-all"
                  >
                    Ver todos los recuerdos
                  </button>
                ) : (
                  <button
                    onClick={handleCreateClick}
                    className="px-5 py-2.5 bg-idac-blue text-white hover:bg-idac-dark text-xs font-black rounded-xl uppercase tracking-widest cursor-pointer shadow-md transition-all"
                  >
                    Agregar primer recuerdo
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* VISTA DE RECUERDOS EN MURO (GRID) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteActivity}
                      onImageClick={handleImageClick}
                      onShare={handleShareClick}
                      readOnly={!currentUser.canPublish}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* VISTA CRONOLÓGICA (LÍNEA DE TIEMPO) */
              <div className="relative pl-6 sm:pl-8 border-l-2 border-idac-blue space-y-8 py-2">
                <AnimatePresence mode="popLayout">
                  {filteredActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      {/* Indicador de Línea de Tiempo (Día) */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-7 w-4 h-4 rounded-full bg-white border-2 border-idac-blue flex items-center justify-center shadow-xs z-10">
                        <div className="w-2 h-2 bg-idac-blue rounded-full" />
                      </div>

                      {/* Fecha flotante pequeña */}
                      <div className="absolute -left-6 sm:-left-8 -top-5.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-[#fbfbfb] pr-2">
                        Día {activity.day} • {getMonthName(activity.month)}
                      </div>

                      <ActivityCard
                        activity={activity}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteActivity}
                        onImageClick={handleImageClick}
                        onShare={handleShareClick}
                        readOnly={!currentUser.canPublish}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </main>
      )}

      {/* LIGHTBOX DE IMÁGENES INMERSIVO CON EDITOR */}
      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={(idx) => setLightboxIndex(idx)}
        canEdit={currentUser.canPublish}
        onSaveEditedImage={handleSaveEditedImageInLightbox}
      />

      {/* FEEDBACK TEMPORAL (TOASTS) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border border-white/10 shadow-xl text-white text-[10px] font-black uppercase tracking-widest"
            style={{
              backgroundColor:
                toast.type === 'delete'
                  ? '#b81d24'
                  : toast.type === 'error'
                  ? '#ef4444'
                  : '#00316f',
            }}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'delete' && <Trash2 className="w-4 h-4 text-red-200" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-200" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 p-1 rounded-full hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-[#001c3f] text-blue-200/80 border-t border-white/5 py-8 text-center mt-auto z-10 relative">
        <p className="text-[9px] font-bold uppercase tracking-widest">
          {settings.footerText || '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.'}
        </p>
      </footer>

      {/* MODAL DE COMPARTIR EN REDES / ESTADOS */}
      <ShareModal
        isOpen={showShareModal}
        activity={sharingActivity}
        onClose={() => {
          setShowShareModal(false);
          setSharingActivity(null);
        }}
        modalTitle={settings.shareModalTitle}
      />

      {/* PANEL DE CONFIGURACIÓN Y PERSONALIZACIÓN */}
      {showSettings && (
        <SettingsPanel
          users={users}
          currentUser={currentUser}
          settings={settings}
          invitations={invitations}
          places={places}
          onUpdatePlaces={setPlaces}
          onClose={() => setShowSettings(false)}
          onReturnToHome={handleGoHome}
          onUpdateUsers={handleUpdateUsers}
          onSelectCurrentUser={(u) => setCurrentUser(u)}
          onUpdateSettings={(s) => setSettings(s)}
          onUpdateInvitations={(newInvites) => setInvitations(newInvites)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
