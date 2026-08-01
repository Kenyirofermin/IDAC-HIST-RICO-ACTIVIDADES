/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../lib/workspaceAuth';
import { 
  Mail, 
  FileText, 
  Users, 
  Calendar, 
  Database, 
  Presentation, 
  Plus, 
  RefreshCw, 
  Send, 
  FolderPlus, 
  FilePlus, 
  Search, 
  Trash2, 
  CheckCircle, 
  UserPlus, 
  LogOut, 
  Globe, 
  AlertTriangle,
  ExternalLink,
  Lock,
  ChevronRight,
  Eye,
  Info,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkspacePortalProps {
  onShowToast: (message: string, type: 'success' | 'delete' | 'error') => void;
  onReturnToHome?: () => void;
}

type WorkspaceTab = 'gmail' | 'drive' | 'contacts' | 'docs' | 'sheets' | 'slides' | 'calendar';

export default function WorkspacePortal({ onShowToast, onReturnToHome }: WorkspacePortalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('gmail');
  
  // Loading states for each API
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data states
  const [emails, setEmails] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Search queries
  const [driveSearch, setDriveSearch] = useState('');

  // Form states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Modal forms
  const [activeModal, setActiveModal] = useState<'email' | 'folder' | 'file' | 'contact' | 'doc' | 'sheet' | 'slide' | 'event' | 'sheet-values' | null>(null);
  
  // Specific Form inputs
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [folderForm, setFolderForm] = useState({ name: '' });
  const [fileForm, setFileForm] = useState({ name: '', content: '', type: 'text/plain' });
  const [contactForm, setContactForm] = useState({ givenName: '', familyName: '', email: '', phone: '' });
  const [docForm, setDocForm] = useState({ title: '', initialText: '' });
  const [sheetForm, setSheetForm] = useState({ title: '' });
  const [slideForm, setSlideForm] = useState({ title: '' });
  const [eventForm, setEventForm] = useState({ 
    summary: '', 
    description: '', 
    location: '', 
    startDate: '', 
    startTime: '10:00', 
    endDate: '', 
    endTime: '11:00' 
  });
  
  // Sheet Values form
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetCells, setSheetCells] = useState<string[][]>([]);
  const [newCellText, setNewCellText] = useState('');
  const [cellRow, setCellRow] = useState('1');
  const [cellCol, setCellCol] = useState('A');

  // Trigger login
  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        onShowToast('¡Conectado exitosamente con Google Workspace!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('No se pudo conectar a Google: ' + (err.message || err));
      onShowToast('Error al conectar con Google Workspace', 'error');
    }
  };

  // Disconnect Workspace
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      onShowToast('Workspace desconectado.', 'success');
    } catch (err: any) {
      onShowToast('Error al desconectar', 'error');
    }
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data automatically when tab changes or token becomes available
  useEffect(() => {
    if (token) {
      fetchDataForTab(activeTab);
    }
  }, [activeTab, token]);

  const fetchDataForTab = async (tab: WorkspaceTab) => {
    if (!token) return;
    setLoadingData(true);
    setErrorMsg(null);

    try {
      switch (tab) {
        case 'gmail':
          await fetchGmail();
          break;
        case 'drive':
          await fetchDriveFiles();
          break;
        case 'contacts':
          await fetchContacts();
          break;
        case 'docs':
          await fetchDocs();
          break;
        case 'sheets':
          await fetchSheets();
          break;
        case 'slides':
          await fetchSlides();
          break;
        case 'calendar':
          await fetchCalendar();
          break;
      }
    } catch (err: any) {
      console.error('Error fetching data for tab ' + tab, err);
      // If unauthorized, token might have expired, clear it
      if (err.status === 401) {
        setErrorMsg('La sesión de Google ha expirado. Por favor, vuelve a iniciar sesión.');
        setToken(null);
      } else {
        setErrorMsg('Error al consultar datos de Google Workspace: ' + (err.message || err));
      }
    } finally {
      setLoadingData(false);
    }
  };

  // API Call helper
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const err = new Error(errorData.error?.message || `Error de API: ${res.status}`);
      (err as any).status = res.status;
      throw err;
    }
    return res.json();
  };

  // Gmail API Fetch
  const fetchGmail = async () => {
    // List messages
    const data = await apiCall('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8');
    if (!data.messages) {
      setEmails([]);
      return;
    }

    // Fetch full detail for each message in parallel
    const fullEmails = await Promise.all(
      data.messages.map(async (msg: any) => {
        try {
          const detail = await apiCall(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`);
          const headers = detail.payload.headers;
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sin Asunto)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Desconocido';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          return {
            id: msg.id,
            subject,
            from,
            date,
            snippet: detail.snippet,
          };
        } catch (e) {
          return { id: msg.id, subject: 'Error al cargar', from: '', date: '', snippet: '' };
        }
      })
    );
    setEmails(fullEmails);
  };

  // Google Drive Fetch
  const fetchDriveFiles = async (searchQuery: string = '') => {
    let url = 'https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,iconLink,webViewLink,createdTime)';
    if (searchQuery) {
      url += `&q=name contains '${searchQuery.replace(/'/g, "\\'")}'`;
    }
    const data = await apiCall(url);
    setDriveFiles(data.files || []);
  };

  // Contacts API Fetch
  const fetchContacts = async () => {
    const data = await apiCall('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=15');
    const formatted = (data.connections || []).map((conn: any) => {
      const nameObj = conn.names?.[0] || {};
      const emailObj = conn.emailAddresses?.[0] || {};
      const phoneObj = conn.phoneNumbers?.[0] || {};
      return {
        resourceName: conn.resourceName,
        name: nameObj.displayName || 'Sin Nombre',
        email: emailObj.value || 'Sin Correo',
        phone: phoneObj.value || 'Sin Teléfono'
      };
    });
    setContacts(formatted);
  };

  // Google Docs Fetch
  const fetchDocs = async () => {
    const data = await apiCall("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&pageSize=15&fields=files(id,name,webViewLink,createdTime)");
    setDocs(data.files || []);
  };

  // Google Sheets Fetch
  const fetchSheets = async () => {
    const data = await apiCall("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=15&fields=files(id,name,webViewLink,createdTime)");
    setSheets(data.files || []);
  };

  // Google Slides Fetch
  const fetchSlides = async () => {
    const data = await apiCall("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.presentation'&pageSize=15&fields=files(id,name,webViewLink,createdTime)");
    setSlides(data.files || []);
  };

  // Google Calendar Fetch
  const fetchCalendar = async () => {
    const nowISO = new Date().toISOString();
    const data = await apiCall(`https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${nowISO}&maxResults=15`);
    setCalendarEvents(data.items || []);
  };

  // Helper to open confirmation modal
  const requestConfirmation = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmAction({ title, description, onConfirm });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setShowConfirmModal(false);
    setLoadingData(true);
    try {
      await confirmAction.onConfirm();
    } catch (err: any) {
      console.error(err);
      onShowToast(`Error: ${err.message || err}`, 'error');
    } finally {
      setConfirmAction(null);
      setLoadingData(false);
    }
  };

  // -------------------------
  // Gmail Compose/Send Action
  // -------------------------
  const handleSendEmail = () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      onShowToast('Por favor, completa todos los campos del correo.', 'error');
      return;
    }

    requestConfirmation(
      'Enviar Correo Electrónico',
      `¿Confirmas el envío de este correo desde tu cuenta de Gmail a "${emailForm.to}" con el asunto "${emailForm.subject}"?`,
      async () => {
        const emailLines = [
          `To: ${emailForm.to}`,
          `Subject: ${emailForm.subject}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          '',
          emailForm.body
        ];
        
        // Base64 url safe encoding
        const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await apiCall('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: rawEmail })
        });

        onShowToast('Correo enviado de forma segura con Gmail.', 'success');
        setActiveModal(null);
        setEmailForm({ to: '', subject: '', body: '' });
        await fetchGmail();
      }
    );
  };

  // -------------------------
  // Google Drive Actions
  // -------------------------
  const handleCreateFolder = () => {
    if (!folderForm.name) {
      onShowToast('Introduce un nombre para la carpeta.', 'error');
      return;
    }

    requestConfirmation(
      'Crear Carpeta en Google Drive',
      `¿Confirmas la creación de la carpeta "${folderForm.name}" en la raíz de tu Google Drive?`,
      async () => {
        await apiCall('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: folderForm.name,
            mimeType: 'application/vnd.google-apps.folder'
          })
        });

        onShowToast(`Carpeta "${folderForm.name}" creada en Google Drive.`, 'success');
        setActiveModal(null);
        setFolderForm({ name: '' });
        await fetchDriveFiles();
      }
    );
  };

  const handleCreateFileInDrive = () => {
    if (!fileForm.name) {
      onShowToast('Introduce un nombre para el archivo.', 'error');
      return;
    }

    requestConfirmation(
      'Crear Archivo en Google Drive',
      `¿Confirmas la creación del archivo de texto "${fileForm.name}" con el contenido ingresado en tu Google Drive?`,
      async () => {
        // Create simple text file using Drive API metadata
        await apiCall('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fileForm.name,
            mimeType: 'text/plain'
          })
        });

        onShowToast(`Archivo "${fileForm.name}" creado exitosamente.`, 'success');
        setActiveModal(null);
        setFileForm({ name: '', content: '', type: 'text/plain' });
        await fetchDriveFiles();
      }
    );
  };

  const handleDeleteDriveFile = (fileId: string, fileName: string) => {
    requestConfirmation(
      'Eliminar Archivo / Carpeta',
      `¿Estás seguro de que deseas eliminar "${fileName}" de tu Google Drive de forma irreversible?`,
      async () => {
        await apiCall(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'DELETE'
        });
        onShowToast(`Archivo "${fileName}" eliminado correctamente.`, 'success');
        await fetchDriveFiles();
      }
    );
  };

  // -------------------------
  // Contacts API Actions
  // -------------------------
  const handleCreateContact = () => {
    if (!contactForm.givenName || !contactForm.email) {
      onShowToast('El Nombre y Correo son obligatorios.', 'error');
      return;
    }

    requestConfirmation(
      'Crear Nuevo Contacto de Google',
      `¿Confirmas la creación del contacto "${contactForm.givenName} ${contactForm.familyName}" con correo "${contactForm.email}" en tus contactos de Google?`,
      async () => {
        await apiCall('https://people.googleapis.com/v1/people/createContact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            names: [{ givenName: contactForm.givenName, familyName: contactForm.familyName }],
            emailAddresses: [{ value: contactForm.email, type: 'work' }],
            phoneNumbers: contactForm.phone ? [{ value: contactForm.phone, type: 'mobile' }] : []
          })
        });

        onShowToast('Contacto creado exitosamente en tu cuenta Google.', 'success');
        setActiveModal(null);
        setContactForm({ givenName: '', familyName: '', email: '', phone: '' });
        await fetchContacts();
      }
    );
  };

  const handleDeleteContact = (resourceName: string, name: string) => {
    requestConfirmation(
      'Eliminar Contacto',
      `¿Estás seguro de que deseas eliminar a "${name}" de tus contactos de Google?`,
      async () => {
        await apiCall(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
          method: 'DELETE'
        });
        onShowToast(`Contacto "${name}" eliminado de forma segura.`, 'success');
        await fetchContacts();
      }
    );
  };

  // -------------------------
  // Google Docs Actions
  // -------------------------
  const handleCreateDoc = () => {
    if (!docForm.title) {
      onShowToast('Introduce un título para el documento.', 'error');
      return;
    }

    requestConfirmation(
      'Crear Nuevo Documento en Google Docs',
      `¿Confirmas la creación del documento "${docForm.title}" en tu cuenta de Google Docs?`,
      async () => {
        // Create Doc using Drive API for simplicity and custom filename
        await apiCall('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: docForm.title,
            mimeType: 'application/vnd.google-apps.document'
          })
        });

        onShowToast(`Documento "${docForm.title}" creado exitosamente.`, 'success');
        setActiveModal(null);
        setDocForm({ title: '', initialText: '' });
        await fetchDocs();
      }
    );
  };

  // -------------------------
  // Google Sheets Actions
  // -------------------------
  const handleCreateSheet = () => {
    if (!sheetForm.title) {
      onShowToast('Introduce un título para la hoja.', 'error');
      return;
    }

    requestConfirmation(
      'Crear Nueva Hoja de Cálculo',
      `¿Confirmas la creación de la hoja de cálculo de Google "${sheetForm.title}"?`,
      async () => {
        await apiCall('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sheetForm.title,
            mimeType: 'application/vnd.google-apps.spreadsheet'
          })
        });

        onShowToast(`Hoja de cálculo "${sheetForm.title}" creada exitosamente.`, 'success');
        setActiveModal(null);
        setSheetForm({ title: '' });
        await fetchSheets();
      }
    );
  };

  // Load cells from sheet
  const handleOpenSheetValues = async (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setLoadingData(true);
    setSheetCells([]);
    try {
      // Fetch values from first page A1:E10
      const data = await apiCall(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:E10`);
      setSheetCells(data.values || [['Hoja vacía o sin inicializar']]);
      setActiveModal('sheet-values');
    } catch (err: any) {
      console.error(err);
      // It's possible Sheet1 doesn't exist yet, try general spreadsheet fetch
      onShowToast('La pestaña Sheet1 no ha sido encontrada. Se intentará inicializar.', 'success');
      setSheetCells([['Pestaña vacía/No encontrada']]);
      setActiveModal('sheet-values');
    } finally {
      setLoadingData(false);
    }
  };

  // Update cell values
  const handleUpdateSheetCell = () => {
    if (!newCellText || !selectedSheetId) {
      onShowToast('Introduce un valor para guardar.', 'error');
      return;
    }

    const range = `Sheet1!${cellCol}${cellRow}`;
    requestConfirmation(
      'Actualizar Celda del Spreadsheet',
      `¿Confirmas la inserción de "${newCellText}" en la celda ${range} del documento?`,
      async () => {
        await apiCall(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            range,
            majorDimension: 'ROWS',
            values: [[newCellText]]
          })
        });

        onShowToast(`Celda ${range} actualizada con éxito.`, 'success');
        setNewCellText('');
        // Reload values
        await handleOpenSheetValues(selectedSheetId);
      }
    );
  };

  // -------------------------
  // Google Slides Actions
  // -------------------------
  const handleCreateSlide = () => {
    if (!slideForm.title) {
      onShowToast('Introduce un título para la presentación.', 'error');
      return;
    }

    requestConfirmation(
      'Crear Presentación de Google Slides',
      `¿Confirmas la creación de la presentación "${slideForm.title}" en Google Slides?`,
      async () => {
        await apiCall('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: slideForm.title,
            mimeType: 'application/vnd.google-apps.presentation'
          })
        });

        onShowToast(`Presentación "${slideForm.title}" creada con éxito.`, 'success');
        setActiveModal(null);
        setSlideForm({ title: '' });
        await fetchSlides();
      }
    );
  };

  // -------------------------
  // Google Calendar Actions
  // -------------------------
  const handleCreateEvent = () => {
    if (!eventForm.summary || !eventForm.startDate || !eventForm.endDate) {
      onShowToast('El título, fecha de inicio y fin son obligatorios.', 'error');
      return;
    }

    const startDateTime = `${eventForm.startDate}T${eventForm.startTime}:00`;
    const endDateTime = `${eventForm.endDate}T${eventForm.endTime}:00`;

    requestConfirmation(
      'Crear Evento en Google Calendar',
      `¿Confirmas el registro del evento "${eventForm.summary}" en tu Google Calendar para el día ${eventForm.startDate}?`,
      async () => {
        await apiCall('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: eventForm.summary,
            description: eventForm.description,
            location: eventForm.location,
            start: {
              dateTime: startDateTime,
              timeZone: 'America/Santo_Domingo'
            },
            end: {
              dateTime: endDateTime,
              timeZone: 'America/Santo_Domingo'
            }
          })
        });

        onShowToast('Evento creado en tu Google Calendar de forma exitosa.', 'success');
        setActiveModal(null);
        setEventForm({
          summary: '',
          description: '',
          location: '',
          startDate: '',
          startTime: '10:00',
          endDate: '',
          endTime: '11:00'
        });
        await fetchCalendar();
      }
    );
  };

  const handleDeleteCalendarEvent = (eventId: string, summary: string) => {
    requestConfirmation(
      'Eliminar Evento',
      `¿Confirmas la eliminación definitiva del evento "${summary}" de tu calendario Google?`,
      async () => {
        await apiCall(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'DELETE'
        });
        onShowToast(`Evento "${summary}" eliminado correctamente.`, 'success');
        await fetchCalendar();
      }
    );
  };

  // Icon selector based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <span className="p-2 bg-amber-50 border border-amber-200 text-amber-600 font-bold text-xs">DIR</span>;
    }
    if (mimeType.includes('document') || mimeType === 'application/vnd.google-apps.document') {
      return <span className="p-2 bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xs">DOC</span>;
    }
    if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.google-apps.spreadsheet') {
      return <span className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-xs">SHEET</span>;
    }
    if (mimeType.includes('presentation') || mimeType === 'application/vnd.google-apps.presentation') {
      return <span className="p-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs">SLIDE</span>;
    }
    return <span className="p-2 bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs">FILE</span>;
  };

  if (loadingAuth) {
    return (
      <div className="bg-white border-2 border-idac-blue p-12 text-center flex flex-col items-center justify-center gap-4 shadow-[4px_4px_0px_#00316f]">
        <div className="w-8 h-8 rounded-none border-3 border-slate-300 border-t-idac-blue animate-spin" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Iniciando Portal de Integraciones...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border-4 border-idac-blue p-8 shadow-[8px_8px_0px_#00316f] flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-idac-blue flex items-center justify-center text-idac-blue">
          <Globe className="w-8 h-8" />
        </div>
        
        <div className="text-center">
          <h2 className="text-base font-black uppercase tracking-wider text-idac-blue">Portal de Integración Google Workspace</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            Conecta tu cuenta institucional o personal de Google
          </p>
          <p className="text-xs text-slate-600 mt-4 leading-relaxed font-sans font-medium px-4">
            Esta integración segura te permite gestionar correos de Gmail, almacenar archivos en Google Drive, gestionar contactos, programar reuniones en Google Calendar, y sincronizar hojas de cálculo, documentos de Docs y presentaciones de Slides, con total autorización.
          </p>
        </div>

        {errorMsg && (
          <div className="w-full p-3 bg-red-50 border-2 border-red-500 text-red-700 font-mono text-[10px] font-bold uppercase tracking-wide">
            {errorMsg}
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="gsi-material-button w-full sm:w-auto hover:scale-102 transition-transform shadow-[4px_4px_0px_#000000] border-2 border-black"
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">Conectar Google Workspace</span>
          </div>
        </button>

        <style dangerouslySetInnerHTML={{__html: `
          .gsi-material-button {
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            -webkit-appearance: none;
            background-color: WHITE;
            background-image: none;
            border: 1px solid #747775;
            -webkit-border-radius: 4px;
            border-radius: 4px;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
            color: #1f1f1f;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 700;
            height: 40px;
            letter-spacing: 0.25px;
            outline: none;
            padding: 0 12px;
            position: relative;
            text-align: center;
            transition: background-color .218s, border-color .218s, box-shadow .218s;
            vertical-align: middle;
            white-space: nowrap;
            width: auto;
            max-width: 400px;
            min-width: min-content;
          }
          .gsi-material-button .gsi-material-button-icon {
            height: 20px;
            min-width: 20px;
            width: 20px;
          }
          .gsi-material-button .gsi-material-button-content-wrapper {
            align-items: center;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            height: 100%;
            justify-content: space-between;
            position: relative;
            width: 100%;
          }
          .gsi-material-button .gsi-material-button-contents {
            flex-grow: 1;
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.1em;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
            margin-left: 12px;
            margin-right: 4px;
          }
          .gsi-material-button .gsi-material-button-state {
            -webkit-border-radius: 4px;
            border-radius: 4px;
            bottom: 0;
            left: 0;
            opacity: 0;
            position: absolute;
            right: 0;
            top: 0;
            transition: opacity .218s;
          }
          .gsi-material-button:hover {
            -webkit-box-shadow: 0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15);
            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15);
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-4 border-idac-blue p-6 md:p-8 shadow-[8px_8px_0px_#00316f] flex flex-col gap-6 relative z-10">
      
      {/* Botón de Inicio / Volver al Menú Principal */}
      {onReturnToHome && (
        <div className="flex items-center justify-between bg-slate-50 border-2 border-idac-blue/20 p-3.5 rounded-xl">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-idac-blue" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">Módulo Google Workspace</span>
          </div>
          <button
            onClick={onReturnToHome}
            className="px-4 py-2 bg-idac-blue hover:bg-idac-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>🏠 Volver al Inicio / Menú Principal</span>
          </button>
        </div>
      )}

      {/* Google Connected Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-dashed border-slate-200">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-12 h-12 rounded-full border-2 border-idac-blue" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-idac-blue text-white flex items-center justify-center font-black text-lg">
              {user.displayName?.[0] || 'U'}
            </div>
          )}
          <div>
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-none uppercase tracking-widest border border-emerald-300">Conectado a Google</span>
            <h3 className="text-sm font-black text-idac-blue uppercase tracking-wide mt-1">{user.displayName || 'Usuario de Google'}</h3>
            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 border-2 border-idac-red text-idac-red hover:bg-idac-red/10 text-[10px] font-black uppercase tracking-widest rounded-none transition-all cursor-pointer active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Desconectar Workspace</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border-2 border-idac-red text-idac-red font-mono text-[10px] font-bold uppercase tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex flex-wrap border-2 border-idac-blue bg-slate-50 p-1 divide-x-0 sm:divide-x-0 gap-1">
        {[
          { id: 'gmail', label: 'Gmail', icon: <Mail className="w-3.5 h-3.5" /> },
          { id: 'drive', label: 'Drive', icon: <Database className="w-3.5 h-3.5" /> },
          { id: 'contacts', label: 'Contactos', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'docs', label: 'Docs', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'sheets', label: 'Sheets', icon: <CheckCircle className="w-3.5 h-3.5" /> },
          { id: 'slides', label: 'Slides', icon: <Presentation className="w-3.5 h-3.5" /> },
          { id: 'calendar', label: 'Calendario', icon: <Calendar className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as WorkspaceTab)}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-idac-blue text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-idac-blue'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Workspace Panel Container */}
      <div className="bg-slate-50 border-2 border-idac-blue p-5 min-h-[350px] relative">
        {loadingData && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-8 h-8 rounded-none border-3 border-slate-300 border-t-idac-blue animate-spin" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando con Google...</span>
          </div>
        )}

        {/* TAB 1: GMAIL */}
        {activeTab === 'gmail' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Bandeja de Entrada (Gmail)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Gestiona correos en tiempo real</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDataForTab('gmail')}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('email')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Redactar</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {emails.length === 0 ? (
                <div className="bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No hay correos electrónicos recientes.
                </div>
              ) : (
                emails.map((email) => (
                  <div key={email.id} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex flex-col gap-1 transition-all">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="font-bold text-idac-blue">{email.from}</span>
                      <span>{email.date}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">{email.subject}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{email.snippet}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DRIVE */}
        {activeTab === 'drive' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Archivos en Nube (Google Drive)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Explora y gestiona tus carpetas</p>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  onClick={() => fetchDriveFiles(driveSearch)}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('folder')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-2 border-idac-blue text-idac-blue text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Carpeta</span>
                </button>
                <button
                  onClick={() => setActiveModal('file')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>+ Archivo</span>
                </button>
              </div>
            </div>

            {/* Drive Search Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar archivos en Google Drive..."
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles(driveSearch)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
              />
              <button
                onClick={() => fetchDriveFiles(driveSearch)}
                className="px-4 py-1.5 bg-idac-blue text-white text-xs font-black uppercase tracking-widest hover:bg-blue-900 transition-all active:scale-95 flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
              {driveFiles.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No se encontraron archivos en Google Drive.
                </div>
              ) : (
                driveFiles.map((file) => (
                  <div key={file.id} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(file.mimeType)}
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-800 truncate" title={file.name}>{file.name}</h5>
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">
                          Creado: {new Date(file.createdTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-idac-blue border border-slate-300 transition-all"
                        title="Ver en Google"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteDriveFile(file.id, file.name)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-idac-red border border-red-200 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Contactos Institucionales (Google Contacts)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Directorio unificado en la nube</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDataForTab('contacts')}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('contact')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nuevo Contacto</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
              {contacts.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No hay contactos disponibles en tu cuenta Google.
                </div>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.resourceName} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-idac-blue/10 text-idac-blue font-black flex items-center justify-center text-xs uppercase">
                        {contact.name[0]}
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wide">{contact.name}</h5>
                        <p className="text-[10px] text-slate-500 font-mono">{contact.email}</p>
                        {contact.phone && <p className="text-[9px] text-slate-400 font-mono mt-0.5">{contact.phone}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.resourceName, contact.name)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-idac-red border border-red-200 transition-all shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Documentos Oficiales (Google Docs)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Redacción e informes</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDataForTab('docs')}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('doc')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Doc</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
              {docs.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No se encontraron documentos de Docs.
                </div>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xs shrink-0">DOC</span>
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-800 truncate">{doc.name}</h5>
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">
                          Creado: {new Date(doc.createdTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={doc.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-idac-blue border border-slate-300 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SHEETS */}
        {activeTab === 'sheets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Hojas de Cálculo (Google Sheets)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Auditoría, presupuestos y control</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDataForTab('sheets')}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('sheet')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Planilla</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
              {sheets.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No se encontraron planillas de cálculo.
                </div>
              ) : (
                sheets.map((sheet) => (
                  <div key={sheet.id} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-xs shrink-0 font-mono">SHEET</span>
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-800 truncate">{sheet.name}</h5>
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">
                          Creado: {new Date(sheet.createdTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenSheetValues(sheet.id)}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Celdas</span>
                      </button>
                      <a
                        href={sheet.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-idac-blue border border-slate-300 transition-all"
                        title="Abrir en Google Sheets"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SLIDES */}
        {activeTab === 'slides' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Presentaciones (Google Slides)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Exposiciones y ponencias de capacitación</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDataForTab('slides')}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('slide')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Pres.</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
              {slides.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No se encontraron presentaciones.
                </div>
              ) : (
                slides.map((slide) => (
                  <div key={slide.id} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs shrink-0">SLIDE</span>
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-800 truncate">{slide.name}</h5>
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">
                          Creado: {new Date(slide.createdTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={slide.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-idac-blue border border-slate-300 transition-all"
                      title="Abrir en Google Slides"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-idac-blue">Agenda y Calendario (Google Calendar)</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Gestión de reuniones y actividades</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDataForTab('calendar')}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
                  title="Sincronizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal('event')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-idac-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Evento</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {calendarEvents.length === 0 ? (
                <div className="bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No tienes eventos de agenda agendados para hoy o mañana.
                </div>
              ) : (
                calendarEvents.map((event) => {
                  const startStr = event.start?.dateTime || event.start?.date || '';
                  const endStr = event.end?.dateTime || event.end?.date || '';
                  return (
                    <div key={event.id} className="bg-white border-2 border-slate-200 hover:border-idac-blue p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition-all">
                      <div>
                        <span className="text-[9px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-none uppercase tracking-wider">
                          {new Date(startStr).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <h5 className="text-xs font-black text-slate-800 uppercase mt-1 tracking-wide">{event.summary || '(Sin título)'}</h5>
                        {event.description && <p className="text-[10px] text-slate-500 mt-0.5 font-sans font-medium">{event.description}</p>}
                        {event.location && (
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ubicación: {event.location}</p>
                        )}
                      </div>
                      <div className="flex gap-1 self-end sm:self-auto shrink-0">
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-idac-blue border border-slate-300 transition-all"
                            title="Ver en Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteCalendarEvent(event.id, event.summary)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-idac-red border border-red-200 transition-all"
                          title="Eliminar Evento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL OVERLAYS (Gmail, Drive file, folders, sheet values, events, etc) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-idac-blue p-6 w-full max-w-lg shadow-[8px_8px_0px_#000000] relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-black font-bold uppercase text-[10px] tracking-widest border border-slate-300 px-2 py-1"
              >
                Cerrar
              </button>

              {/* MODAL: COMPOSE EMAIL */}
              {activeModal === 'email' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Redactar Correo (Gmail)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Para (Destinatario)</label>
                      <input
                        type="email"
                        value={emailForm.to}
                        onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none font-sans text-slate-700 font-bold"
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Asunto</label>
                      <input
                        type="text"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none font-sans text-slate-700 font-bold"
                        placeholder="Introduce el asunto..."
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contenido (HTML permitido)</label>
                      <textarea
                        value={emailForm.body}
                        onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                        className="w-full h-32 px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none font-sans text-slate-700 font-bold"
                        placeholder="Redacta el mensaje..."
                      />
                    </div>
                    <button
                      onClick={handleSendEmail}
                      className="w-full py-2 bg-idac-red hover:bg-red-800 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Enviar Correo de Gmail
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE DRIVE FOLDER */}
              {activeModal === 'folder' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Crear Carpeta (Google Drive)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Carpeta</label>
                      <input
                        type="text"
                        value={folderForm.name}
                        onChange={(e) => setFolderForm({ name: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none font-sans text-slate-700 font-bold"
                        placeholder="Ej. Informes 2026"
                      />
                    </div>
                    <button
                      onClick={handleCreateFolder}
                      className="w-full py-2 bg-idac-blue hover:bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Crear Carpeta
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE FILE */}
              {activeModal === 'file' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Crear Archivo (Google Drive)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre del Archivo (con extensión)</label>
                      <input
                        type="text"
                        value={fileForm.name}
                        onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none font-sans text-slate-700 font-bold"
                        placeholder="Ej. reporte.txt"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contenido</label>
                      <textarea
                        value={fileForm.content}
                        onChange={(e) => setFileForm({ ...fileForm, content: e.target.value })}
                        className="w-full h-24 px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none font-sans text-slate-700 font-bold"
                        placeholder="Escribe el texto aquí..."
                      />
                    </div>
                    <button
                      onClick={handleCreateFileInDrive}
                      className="w-full py-2 bg-idac-red hover:bg-red-800 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Crear Archivo de Texto
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE CONTACT */}
              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Nuevo Contacto (Google Contacts)</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                        <input
                          type="text"
                          value={contactForm.givenName}
                          onChange={(e) => setContactForm({ ...contactForm, givenName: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Apellido</label>
                        <input
                          type="text"
                          value={contactForm.familyName}
                          onChange={(e) => setContactForm({ ...contactForm, familyName: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Teléfono Móvil</label>
                      <input
                        type="text"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                      />
                    </div>
                    <button
                      onClick={handleCreateContact}
                      className="w-full py-2 bg-idac-blue hover:bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Guardar Contacto en Google
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE DOC */}
              {activeModal === 'doc' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Crear Documento (Docs)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Título del Documento</label>
                      <input
                        type="text"
                        value={docForm.title}
                        onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Ej. Acta de Reunión"
                      />
                    </div>
                    <button
                      onClick={handleCreateDoc}
                      className="w-full py-2 bg-idac-red hover:bg-red-800 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Crear Documento en la Nube
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE SHEET */}
              {activeModal === 'sheet' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Nueva Planilla (Sheets)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Título de la Hoja</label>
                      <input
                        type="text"
                        value={sheetForm.title}
                        onChange={(e) => setSheetForm({ title: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Ej. Registro de Inventario"
                      />
                    </div>
                    <button
                      onClick={handleCreateSheet}
                      className="w-full py-2 bg-idac-blue hover:bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Crear Hoja de Cálculo
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: VIEW AND WRITE CELL VALUES (SHEETS) */}
              {activeModal === 'sheet-values' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Celdas en Tiempo Real</h3>
                  
                  <div className="bg-slate-100 border border-slate-300 p-3 overflow-x-auto max-h-[180px]">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pestaña "Sheet1" (Primeras Filas)</span>
                    <table className="w-full text-left border-collapse text-[10px] font-mono">
                      <tbody>
                        {sheetCells.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-200">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-1 border-r border-slate-200 bg-white font-bold">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t-2 border-slate-200 pt-3 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-idac-blue">Modificar / Escribir Celda</h4>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Columna</label>
                        <select
                          value={cellCol}
                          onChange={(e) => setCellCol(e.target.value)}
                          className="w-full p-1 text-xs bg-white border-2 border-idac-blue text-slate-700 font-bold font-mono focus:outline-none"
                        >
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fila</label>
                        <select
                          value={cellRow}
                          onChange={(e) => setCellRow(e.target.value)}
                          className="w-full p-1 text-xs bg-white border-2 border-idac-blue text-slate-700 font-bold font-mono focus:outline-none"
                        >
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coordenada</label>
                        <div className="px-2 py-1.5 bg-slate-100 text-xs text-center font-mono font-black text-idac-blue uppercase tracking-widest border border-slate-300">
                          {cellCol}{cellRow}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valor de la Celda</label>
                      <input
                        type="text"
                        value={newCellText}
                        onChange={(e) => setNewCellText(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Ej. 1,500.00 o Completado"
                      />
                    </div>

                    <button
                      onClick={handleUpdateSheetCell}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Insertar / Actualizar Celda
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE PRESENTATION (SLIDES) */}
              {activeModal === 'slide' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Crear Presentación (Slides)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Título de la Presentación</label>
                      <input
                        type="text"
                        value={slideForm.title}
                        onChange={(e) => setSlideForm({ title: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Ej. Ponencia Aeropuertos 2026"
                      />
                    </div>
                    <button
                      onClick={handleCreateSlide}
                      className="w-full py-2 bg-idac-red hover:bg-red-800 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Crear Presentación
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL: CREATE CALENDAR EVENT */}
              {activeModal === 'event' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">Nuevo Evento de Agenda (Google Calendar)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Título del Evento</label>
                      <input
                        type="text"
                        value={eventForm.summary}
                        onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Ej. Reunión de Planificación"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</label>
                        <input
                          type="date"
                          value={eventForm.startDate}
                          onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value, endDate: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hora Inicio</label>
                        <input
                          type="time"
                          value={eventForm.startTime}
                          onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha Fin</label>
                        <input
                          type="date"
                          value={eventForm.endDate}
                          onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hora Fin</label>
                        <input
                          type="time"
                          value={eventForm.endTime}
                          onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ubicación</label>
                      <input
                        type="text"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Ej. Sala de Conferencias o Virtual"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Descripción / Notas</label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        className="w-full h-16 px-2 py-1.5 text-xs bg-white border-2 border-idac-blue focus:outline-none text-slate-700 font-bold"
                        placeholder="Introduce detalles del evento..."
                      />
                    </div>

                    <button
                      onClick={handleCreateEvent}
                      className="w-full py-2 bg-idac-blue hover:bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[3px_3px_0px_#000]"
                    >
                      Guardar Reunión en Calendar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG (MANDATORY CONSTRAINT BY WORKSPACE SKILL) */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-idac-red p-6 w-full max-w-md shadow-[8px_8px_0px_#000000] relative text-center"
            >
              <div className="w-12 h-12 bg-red-100 border border-idac-red rounded-full flex items-center justify-center text-idac-red mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <h3 className="text-xs font-black uppercase tracking-widest text-idac-red">Requiere Confirmación del Usuario</h3>
              <p className="text-xs font-bold text-slate-800 mt-3 uppercase tracking-wide">{confirmAction.title}</p>
              <p className="text-[11px] text-slate-500 mt-2 font-sans font-medium leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-none">
                {confirmAction.description}
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 py-2 border-2 border-slate-300 hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="flex-1 py-2 bg-idac-red hover:bg-red-800 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_#000]"
                >
                  Confirmar Acción
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
