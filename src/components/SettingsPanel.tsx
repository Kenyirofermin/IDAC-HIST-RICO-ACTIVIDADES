import React, { useState, useRef } from 'react';
import { AppUser, PersonalizationSettings, UserInvitation } from '../types';
import { 
  X, 
  UserPlus, 
  Check, 
  Trash2, 
  Palette, 
  Users, 
  Settings, 
  Upload, 
  RefreshCw, 
  Shield, 
  ShieldAlert, 
  Sparkles,
  UserCheck,
  Mail,
  Key,
  ShieldCheck,
  Copy,
  Database,
  Server,
  Plus,
  Globe,
  HelpCircle,
  Edit,
  Save,
  Link,
  Send,
  UserCheck2,
  MapPin,
  Home,
  CheckCircle2,
  MessageSquare,
  Phone,
  MessageCircle,
  BellRing
} from 'lucide-react';

interface SettingsPanelProps {
  users: AppUser[];
  currentUser: AppUser;
  settings: PersonalizationSettings;
  invitations: UserInvitation[];
  onClose: () => void;
  onReturnToHome?: () => void;
  onUpdateUsers: (newUsers: AppUser[]) => void;
  onSelectCurrentUser: (user: AppUser) => void;
  onUpdateSettings: (newSettings: PersonalizationSettings) => void;
  onUpdateInvitations: (newInvitations: UserInvitation[]) => void;
  onShowToast: (message: string, type: 'success' | 'delete' | 'error') => void;
  places: string[];
  onUpdatePlaces: (newPlaces: string[]) => void;
}

const PRESET_COLORS = [
  { name: 'Azul IDAC (Original)', primary: '#00316f', dark: '#001f44', accent: '#b81d24' },
  { name: 'Rojo IDAC (Alternativo)', primary: '#b81d24', dark: '#7c1014', accent: '#00316f' },
  { name: 'Verde Bosque', primary: '#065f46', dark: '#022c22', accent: '#d97706' },
  { name: 'Violeta Real', primary: '#581c87', dark: '#2e1065', accent: '#db2777' },
  { name: 'Naranja Ocaso', primary: '#c2410c', dark: '#7c2d12', accent: '#0284c7' },
  { name: 'Gris Grafito', primary: '#334155', dark: '#0f172a', accent: '#3b82f6' },
  { name: 'Negro Profundo', primary: '#0f172a', dark: '#020617', accent: '#b81d24' },
];

export default function SettingsPanel({
  users,
  currentUser,
  settings,
  invitations,
  onClose,
  onReturnToHome,
  onUpdateUsers,
  onSelectCurrentUser,
  onUpdateSettings,
  onUpdateInvitations,
  onShowToast,
  places,
  onUpdatePlaces,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'simulation' | 'users' | 'invitations' | 'personalization' | 'storage' | 'places'>('simulation');

  // Form states for new user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [newUserCanPublish, setNewUserCanPublish] = useState(true);

  // States for authorizing via email quickly
  const [authorizeEmailInput, setAuthorizeEmailInput] = useState('');

  // States for editing user profiles (customizable names & emails)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserEmail, setEditingUserEmail] = useState('');
  const [editingUserUsername, setEditingUserUsername] = useState('');
  const [editingUserWhatsappNumber, setEditingUserWhatsappNumber] = useState('');
  const [editingUserWhatsappEnabled, setEditingUserWhatsappEnabled] = useState(true);

  // States for editing current active user directly
  const [editingActiveName, setEditingActiveName] = useState(currentUser.name);
  const [editingActiveEmail, setEditingActiveEmail] = useState(currentUser.email);
  const [editingActiveWhatsappNumber, setEditingActiveWhatsappNumber] = useState(currentUser.whatsappNumber || '');
  const [editingActiveWhatsappEnabled, setEditingActiveWhatsappEnabled] = useState(currentUser.whatsappEnabled !== false);
  const [editingActiveWhatsappNotifyUpload, setEditingActiveWhatsappNotifyUpload] = useState(currentUser.whatsappNotifyOnUpload !== false);

  // Modal State for WhatsApp Preview & Dispatch
  const [whatsappPreviewModal, setWhatsappPreviewModal] = useState<{
    recipientName: string;
    phone: string;
    message: string;
    waUrl: string;
  } | null>(null);

  React.useEffect(() => {
    setEditingActiveName(currentUser.name);
    setEditingActiveEmail(currentUser.email);
    setEditingActiveWhatsappNumber(currentUser.whatsappNumber || '');
    setEditingActiveWhatsappEnabled(currentUser.whatsappEnabled !== false);
    setEditingActiveWhatsappNotifyUpload(currentUser.whatsappNotifyOnUpload !== false);
  }, [currentUser]);

  // States for inviting collaborators
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [inviteCanPublish, setInviteCanPublish] = useState(true);

  // States for place management
  const [newPlaceInput, setNewPlaceInput] = useState('');
  const [editingPlaceIdx, setEditingPlaceIdx] = useState<number | null>(null);
  const [editingPlaceValue, setEditingPlaceValue] = useState('');

  // Custom visual & Admin settings state
  const [customTitle, setCustomTitle] = useState(settings.appTitle);
  const [customSubtitle, setCustomSubtitle] = useState(settings.appSubtitle);
  const [customHexColor, setCustomHexColor] = useState(settings.primaryColor);
  const [customDarkColor, setCustomDarkColor] = useState(settings.darkColor);
  const [customAccentColor, setCustomAccentColor] = useState(settings.accentColor);
  const [customAdminEmail, setCustomAdminEmail] = useState(settings.adminEmail || 'luismartinez150@gmail.com');

  // Customizable titles & labels states
  const [customTabArchiveLabel, setCustomTabArchiveLabel] = useState(settings.tabArchiveLabel || '📂 Archivo Fotográfico IDAC');
  const [customTabWorkspaceLabel, setCustomTabWorkspaceLabel] = useState(settings.tabWorkspaceLabel || '☁️ Portal Google Workspace');
  const [customSidebarSearchLabel, setCustomSidebarSearchLabel] = useState(settings.sidebarSearchLabel || 'Buscar Archivo');
  const [customSidebarSearchPlaceholder, setCustomSidebarSearchPlaceholder] = useState(settings.sidebarSearchPlaceholder || 'Título, nota o categoría...');
  const [customSidebarTimelineLabel, setCustomSidebarTimelineLabel] = useState(settings.sidebarTimelineLabel || 'Línea Temporal');
  const [customSidebarAllRecollectionsLabel, setCustomSidebarAllRecollectionsLabel] = useState(settings.sidebarAllRecollectionsLabel || 'Todos los recuerdos');
  const [customSidebarCategoriesLabel, setCustomSidebarCategoriesLabel] = useState(settings.sidebarCategoriesLabel || 'Categorías');
  const [customSidebarAuthorsLabel, setCustomSidebarAuthorsLabel] = useState(settings.sidebarAuthorsLabel || 'Subido Por');
  const [customSidebarPlacesLabel, setCustomSidebarPlacesLabel] = useState(settings.sidebarPlacesLabel || 'Lugares / Secciones');
  const [customNewRecollectionBtnLabel, setCustomNewRecollectionBtnLabel] = useState(settings.newRecollectionBtnLabel || 'Nuevo Recuerdo');
  
  // Settings Panel Tab Labels
  const [customPanelTitle, setCustomPanelTitle] = useState(settings.panelTitle || 'Panel de Control IDAC');
  const [customPanelTabSessionLabel, setCustomPanelTabSessionLabel] = useState(settings.panelTabSessionLabel || 'Sesión Activa');
  const [customPanelTabUsersLabel, setCustomPanelTabUsersLabel] = useState(settings.panelTabUsersLabel || 'Usuarios');
  const [customPanelTabInvitationsLabel, setCustomPanelTabInvitationsLabel] = useState(settings.panelTabInvitationsLabel || 'Invitaciones');
  const [customPanelTabStorageLabel, setCustomPanelTabStorageLabel] = useState(settings.panelTabStorageLabel || 'Almacenamiento');
  const [customPanelTabPersonalizationLabel, setCustomPanelTabPersonalizationLabel] = useState(settings.panelTabPersonalizationLabel || 'Personalización');
  const [customPanelTabPlacesLabel, setCustomPanelTabPlacesLabel] = useState(settings.panelTabPlacesLabel || 'Lugares / Secciones');

  // Modal / Form Titles
  const [customFormNewModalTitle, setCustomFormNewModalTitle] = useState(settings.formNewModalTitle || 'Nuevo Recuerdo de Actividad');
  const [customFormEditModalTitle, setCustomFormEditModalTitle] = useState(settings.formEditModalTitle || 'Editar Recuerdo');
  const [customShareModalTitle, setCustomShareModalTitle] = useState(settings.shareModalTitle || '📢 Compartir en Redes Sociales');
  const [customWorkspaceSectionTitle, setCustomWorkspaceSectionTitle] = useState(settings.workspaceSectionTitle || '☁️ Portal Google Workspace');

  const [customFooterText, setCustomFooterText] = useState(settings.footerText || '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.');

  React.useEffect(() => {
    setCustomTitle(settings.appTitle);
    setCustomSubtitle(settings.appSubtitle);
    setCustomHexColor(settings.primaryColor);
    setCustomDarkColor(settings.darkColor);
    setCustomAccentColor(settings.accentColor);
    setCustomAdminEmail(settings.adminEmail || 'luismartinez150@gmail.com');
    setCustomTabArchiveLabel(settings.tabArchiveLabel || '📂 Archivo Fotográfico IDAC');
    setCustomTabWorkspaceLabel(settings.tabWorkspaceLabel || '☁️ Portal Google Workspace');
    setCustomSidebarSearchLabel(settings.sidebarSearchLabel || 'Buscar Archivo');
    setCustomSidebarSearchPlaceholder(settings.sidebarSearchPlaceholder || 'Título, nota o categoría...');
    setCustomSidebarTimelineLabel(settings.sidebarTimelineLabel || 'Línea Temporal');
    setCustomSidebarAllRecollectionsLabel(settings.sidebarAllRecollectionsLabel || 'Todos los recuerdos');
    setCustomSidebarCategoriesLabel(settings.sidebarCategoriesLabel || 'Categorías');
    setCustomSidebarAuthorsLabel(settings.sidebarAuthorsLabel || 'Subido Por');
    setCustomSidebarPlacesLabel(settings.sidebarPlacesLabel || 'Lugares / Secciones');
    setCustomNewRecollectionBtnLabel(settings.newRecollectionBtnLabel || 'Nuevo Recuerdo');
    setCustomPanelTitle(settings.panelTitle || 'Panel de Control IDAC');
    setCustomPanelTabSessionLabel(settings.panelTabSessionLabel || 'Sesión Activa');
    setCustomPanelTabUsersLabel(settings.panelTabUsersLabel || 'Usuarios');
    setCustomPanelTabInvitationsLabel(settings.panelTabInvitationsLabel || 'Invitaciones');
    setCustomPanelTabStorageLabel(settings.panelTabStorageLabel || 'Almacenamiento');
    setCustomPanelTabPersonalizationLabel(settings.panelTabPersonalizationLabel || 'Personalización');
    setCustomPanelTabPlacesLabel(settings.panelTabPlacesLabel || 'Lugares / Secciones');
    setCustomFormNewModalTitle(settings.formNewModalTitle || 'Nuevo Recuerdo de Actividad');
    setCustomFormEditModalTitle(settings.formEditModalTitle || 'Editar Recuerdo');
    setCustomShareModalTitle(settings.shareModalTitle || '📢 Compartir en Redes Sociales');
    setCustomWorkspaceSectionTitle(settings.workspaceSectionTitle || '☁️ Portal Google Workspace');
    setCustomFooterText(settings.footerText || '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.');
  }, [settings]);

  // Cloud Storage Settings state
  const [cloudProvider, setCloudProvider] = useState<'gcs' | 's3' | 'firebase' | 'local'>(settings.cloudStorageProvider || 'local');
  const [cloudBucket, setCloudBucket] = useState(settings.cloudStorageBucket || 'idac-archive-bucket');
  const [cloudRegion, setCloudRegion] = useState(settings.cloudStorageRegion || 'us-east1');

  // States for Admin Password Resetting
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // States for Email Preview Modal & User Activation
  const [emailPreviewModal, setEmailPreviewModal] = useState<{
    recipient: string;
    subject: string;
    body: string;
    user: AppUser;
  } | null>(null);

  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle user activation status (Active / Inactive)
  const handleToggleUserStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextStatus = (u.status || 'active') === 'active' ? 'inactive' : 'active';
        return {
          ...u,
          status: nextStatus as 'active' | 'inactive',
          activatedAt: nextStatus === 'active' ? new Date().toISOString() : u.activatedAt
        };
      }
      return u;
    });
    onUpdateUsers(updated);

    const targetUser = updated.find(u => u.id === userId);
    if (targetUser) {
      if (currentUser.id === userId) {
        onSelectCurrentUser(targetUser);
      }
      onShowToast(`Estado del usuario "${targetUser.name}" cambiado a ${targetUser.status === 'active' ? 'ACTIVADO 🟢' : 'INACTIVO 🔴'}.`, 'success');
    }
  };

  // Send Activation / Notification Email
  const handleSendActivationEmail = (user: AppUser) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          status: 'active' as const,
          activatedAt: u.activatedAt || new Date().toISOString(),
          lastEmailSentAt: nowStr
        };
      }
      return u;
    });
    onUpdateUsers(updated);

    setEmailPreviewModal({
      recipient: user.email,
      subject: `[IDAC ARCHIVO] Confirmación y Activación de Cuenta: ${user.name}`,
      body: `Estimado(a) ${user.name},\n\nLe informamos que su cuenta institucional en el Portal de Archivo Fotográfico IDAC ha sido ACTIVADA con éxito.\n\n• Usuario de acceso: ${user.username || user.email}\n• Correo asignado: ${user.email}\n• Rol del sistema: ${user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Colaborador' : 'Lector'}\n• Permiso de Publicación: ${user.canPublish ? 'Habilitado (Puede subir recuerdos)' : 'Deshabilitado (Solo vista)'}\n\nPuede acceder directamente al sistema utilizando sus credenciales institucionales.\n\nAtentamente,\nDirección de Tecnología y Comunicaciones - IDAC`,
      user: { ...user, status: 'active', lastEmailSentAt: nowStr }
    });

    onShowToast(`📧 Correo de activación enviado a ${user.email}`, 'success');
  };


  // Add User with Email Support
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      onShowToast('El nombre de usuario es obligatorio.', 'error');
      return;
    }

    const emailToUse = newUserEmail.trim().toLowerCase() || `${newUserName.toLowerCase().replace(/\s+/g, '')}@idac.gob.do`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      onShowToast('Formato de correo electrónico inválido.', 'error');
      return;
    }

    // Check if email already registered
    if (users.some(u => u.email.toLowerCase() === emailToUse)) {
      onShowToast('Este correo electrónico ya está registrado.', 'error');
      return;
    }

    const newUser: AppUser = {
      id: 'user-' + Date.now(),
      name: newUserName.trim(),
      email: emailToUse,
      role: newUserRole,
      canPublish: newUserRole === 'viewer' ? false : newUserCanPublish,
    };

    const updated = [...users, newUser];
    onUpdateUsers(updated);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserCanPublish(true);
    setNewUserRole('editor');
    onShowToast(`Usuario "${newUser.name}" registrado correctamente.`, 'success');
  };

  // Quick authorize users to publish by email address
  const handleAuthorizeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToAuthorize = authorizeEmailInput.trim().toLowerCase();
    if (!emailToAuthorize) {
      onShowToast('Por favor ingrese un correo electrónico.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToAuthorize)) {
      onShowToast('Formato de correo electrónico inválido.', 'error');
      return;
    }

    // Check if user already exists
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === emailToAuthorize);
    if (existingIndex !== -1) {
      const updated = [...users];
      updated[existingIndex] = {
        ...updated[existingIndex],
        canPublish: true,
        role: updated[existingIndex].role === 'viewer' ? 'editor' : updated[existingIndex].role
      };
      onUpdateUsers(updated);
      
      // If we updated the active user, sync its state
      if (currentUser.email.toLowerCase() === emailToAuthorize) {
        onSelectCurrentUser(updated[existingIndex]);
      }
      onShowToast(`Usuario con correo ${emailToAuthorize} autorizado para publicar con éxito.`, 'success');
    } else {
      // Create a brand new user authorized for publishing
      const computedName = emailToAuthorize.split('@')[0]
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const newUser: AppUser = {
        id: 'user-' + Date.now(),
        name: computedName,
        email: emailToAuthorize,
        role: 'editor',
        canPublish: true
      };
      onUpdateUsers([...users, newUser]);
      onShowToast(`Nuevo colaborador "${computedName}" registrado y autorizado para publicar.`, 'success');
    }
    setAuthorizeEmailInput('');
  };

  // Edit user profile (customizable name, username, email & WhatsApp)
  const handleStartEditUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setEditingUserName(user.name);
    setEditingUserEmail(user.email);
    setEditingUserUsername(user.username || '');
    setEditingUserWhatsappNumber(user.whatsappNumber || '');
    setEditingUserWhatsappEnabled(user.whatsappEnabled !== false);
  };

  const handleSaveEditUser = () => {
    if (!editingUserName.trim()) {
      onShowToast('El nombre no puede estar vacío.', 'error');
      return;
    }
    if (!editingUserEmail.trim()) {
      onShowToast('El correo no puede estar vacío.', 'error');
      return;
    }
    const usernameInput = editingUserUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!usernameInput) {
      onShowToast('El nombre de usuario (login) no puede estar vacío.', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUserEmail.trim())) {
      onShowToast('Formato de correo electrónico inválido.', 'error');
      return;
    }

    // Check if another user has this email
    const duplicateEmail = users.some(u => u.id !== editingUserId && u.email.toLowerCase() === editingUserEmail.trim().toLowerCase());
    if (duplicateEmail) {
      onShowToast('Este correo electrónico ya está registrado por otro usuario.', 'error');
      return;
    }

    // Check if another user has this username
    const duplicateUsername = users.some(u => u.id !== editingUserId && u.username?.toLowerCase() === usernameInput);
    if (duplicateUsername) {
      onShowToast('Este nombre de usuario ya está registrado por otro usuario.', 'error');
      return;
    }

    const updated = users.map(u => {
      if (u.id === editingUserId) {
        return {
          ...u,
          name: editingUserName.trim(),
          email: editingUserEmail.trim().toLowerCase(),
          username: usernameInput,
          whatsappNumber: editingUserWhatsappNumber.trim(),
          whatsappEnabled: editingUserWhatsappEnabled
        };
      }
      return u;
    });

    onUpdateUsers(updated);

    // Sync active session if changed
    const currentUpdated = updated.find(u => u.id === currentUser.id);
    if (currentUpdated) {
      onSelectCurrentUser(currentUpdated);
    }

    setEditingUserId(null);
    onShowToast('Perfil de usuario y configuración de WhatsApp actualizados con éxito.', 'success');
  };

  // Delete User
  const handleDeleteUser = (id: string, name: string) => {
    if (users.length <= 1) {
      onShowToast('Debe haber al menos un usuario registrado.', 'error');
      return;
    }
    if (currentUser.id === id) {
      onShowToast('No puedes eliminar el usuario activo actualmente.', 'error');
      return;
    }

    const updated = users.filter((u) => u.id !== id);
    onUpdateUsers(updated);
    onShowToast(`Usuario "${name}" eliminado.`, 'delete');
  };

  // Save Active User WhatsApp Settings
  const handleSaveActiveWhatsappSettings = () => {
    if (editingActiveWhatsappEnabled && !editingActiveWhatsappNumber.trim()) {
      onShowToast('Ingresa tu número de WhatsApp para activar las notificaciones.', 'error');
      return;
    }

    const updated = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          whatsappNumber: editingActiveWhatsappNumber.trim(),
          whatsappEnabled: editingActiveWhatsappEnabled,
          whatsappNotifyOnUpload: editingActiveWhatsappNotifyUpload
        };
      }
      return u;
    });

    onUpdateUsers(updated);

    const updatedCurrent = {
      ...currentUser,
      whatsappNumber: editingActiveWhatsappNumber.trim(),
      whatsappEnabled: editingActiveWhatsappEnabled,
      whatsappNotifyOnUpload: editingActiveWhatsappNotifyUpload
    };
    onSelectCurrentUser(updatedCurrent);

    onShowToast(`Configuración de WhatsApp guardada (${editingActiveWhatsappEnabled ? 'ACTIVADA 🟢' : 'DESACTIVADA 🔴'}).`, 'success');
  };

  // Test WhatsApp dispatch modal / action
  const handleTestWhatsappDispatch = (targetUser: AppUser) => {
    const phone = targetUser.whatsappNumber || editingActiveWhatsappNumber || '+18095550199';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `💬 *[IDAC ARCHIVO] Prueba de Notificación por WhatsApp*\n\nHola ${targetUser.name},\nEste es un mensaje de prueba del sistema de notificaciones del Archivo Fotográfico IDAC.\n\nRecibirás alertas automáticas en este número cada vez que se suba o actualice un recuerdo fotográfico.\n\n🌐 *Portal:* ${window.location.origin}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}`;

    setWhatsappPreviewModal({
      recipientName: targetUser.name,
      phone: phone,
      message: message,
      waUrl: waUrl
    });

    onShowToast(`📱 Alerta WhatsApp generada para ${targetUser.name}.`, 'success');
  };

  // Toggle user WhatsApp status by Admin
  const handleToggleUserWhatsappAdmin = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextState = !(u.whatsappEnabled !== false);
        return {
          ...u,
          whatsappEnabled: nextState
        };
      }
      return u;
    });
    onUpdateUsers(updated);

    const targetUser = updated.find(u => u.id === userId);
    if (targetUser) {
      if (currentUser.id === userId) {
        onSelectCurrentUser(targetUser);
      }
      onShowToast(`WhatsApp para ${targetUser.name}: ${targetUser.whatsappEnabled ? 'ACTIVADO 🟢' : 'DESACTIVADO 🔴'}.`, 'success');
    }
  };

  // Toggle user publish permission
  const handleTogglePublish = (id: string) => {
    const updated = users.map((u) => {
      if (u.id === id) {
        const canPublish = !u.canPublish;
        const role: 'admin' | 'editor' | 'viewer' = canPublish ? (u.role === 'viewer' ? 'editor' : u.role) : 'viewer';
        return { ...u, canPublish, role };
      }
      return u;
    });
    onUpdateUsers(updated);

    // If we updated the current active user, sync its state
    const currentUpdated = updated.find((u) => u.id === currentUser.id);
    if (currentUpdated) {
      onSelectCurrentUser(currentUpdated);
    }
    onShowToast('Permisos de usuario actualizados.', 'success');
  };

  // Invite collaborators
  const handleInviteCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim().toLowerCase();
    if (!emailToInvite) {
      onShowToast('Por favor ingrese un correo electrónico para invitar.', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToInvite)) {
      onShowToast('Formato de correo electrónico inválido.', 'error');
      return;
    }

    // Check if already registered
    if (users.some(u => u.email.toLowerCase() === emailToInvite)) {
      onShowToast('Este usuario ya está registrado en el sistema.', 'error');
      return;
    }

    // Check if already invited
    if (invitations.some(i => i.email.toLowerCase() === emailToInvite && i.status === 'pending')) {
      onShowToast('Ya existe una invitación pendiente para este correo electrónico.', 'error');
      return;
    }

    // Generate random code IDAC-XXXX
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codeSuffix = '';
    for (let i = 0; i < 4; i++) {
      codeSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const inviteCode = `IDAC-${codeSuffix}`;

    const newInvite: UserInvitation = {
      id: 'inv-' + Date.now(),
      email: emailToInvite,
      role: inviteRole,
      canPublish: inviteRole === 'viewer' ? false : inviteCanPublish,
      code: inviteCode,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onUpdateInvitations([...invitations, newInvite]);
    setInviteEmail('');

    setEmailPreviewModal({
      recipient: emailToInvite,
      subject: `[IDAC ARCHIVO] Invitación para unirse al Archivo Fotográfico IDAC`,
      body: `Estimado(a) Colaborador(a),\n\nHa sido invitado a formar parte del equipo del Archivo Fotográfico Institucional IDAC.\n\n• Correo invitado: ${emailToInvite}\n• Rol asignado: ${inviteRole === 'admin' ? 'Administrador' : inviteRole === 'editor' ? 'Colaborador' : 'Lector'}\n• Código de Activación: ${inviteCode}\n\nPara completar su registro y activar su cuenta, ingrese al portal y utilice su Código de Activación (${inviteCode}).\n\nAtentamente,\nDirección de Tecnología y Comunicaciones - IDAC`,
      user: {
        id: newInvite.id,
        name: emailToInvite,
        email: emailToInvite,
        role: inviteRole,
        canPublish: newInvite.canPublish,
        status: 'active'
      }
    });

    onShowToast(`Invitación creada y correo enviado a ${emailToInvite}. Código: ${inviteCode}`, 'success');
  };

  const handleDeleteInvitation = (id: string, email: string) => {
    const updated = invitations.filter(i => i.id !== id);
    onUpdateInvitations(updated);
    onShowToast(`Invitación para ${email} eliminada.`, 'delete');
  };

  // Simulate accepting invitation (instantly registers the user)
  const handleAcceptInvitation = (invite: UserInvitation) => {
    // Generate name from email
    const name = invite.email.split('@')[0]
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const computedUsername = invite.email.split('@')[0].toLowerCase().replace(/\s+/g, '');

    const newUser: AppUser = {
      id: 'user-' + Date.now(),
      name,
      email: invite.email,
      role: invite.role,
      canPublish: invite.canPublish,
      username: computedUsername,
      password: 'password123',
      securityQuestion: '¿Cuál es tu avión favorito?',
      securityAnswer: 'Boeing 787'
    };

    // Mark invitation as accepted
    const updatedInvites = invitations.map(i => {
      if (i.id === invite.id) {
        return { ...i, status: 'accepted' as const };
      }
      return i;
    });

    onUpdateInvitations(updatedInvites);
    onUpdateUsers([...users, newUser]);
    onShowToast(`¡Simulación exitosa! ${newUser.name} se unió. Usuario: ${computedUsername} / Clave: password123`, 'success');
  };

  // Admin resets user password
  const handleResetPasswordSubmit = (userId: string) => {
    if (!newPasswordInput.trim()) {
      onShowToast('La contraseña no puede estar vacía.', 'error');
      return;
    }
    if (newPasswordInput.length < 6) {
      onShowToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    const updated = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          password: newPasswordInput.trim()
        };
      }
      return u;
    });

    onUpdateUsers(updated);
    setResettingPasswordUserId(null);
    setNewPasswordInput('');
    onShowToast('Contraseña de colaborador restablecida con éxito.', 'success');
  };

  // Save Branding, visual settings, and Customizable Admin Email
  const handleApplyBrandingAndAdmin = () => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(customHexColor)) {
      onShowToast('Código hexadecimal de color primario inválido.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customAdminEmail.trim())) {
      onShowToast('Formato de correo electrónico del Administrador inválido.', 'error');
      return;
    }

    onUpdateSettings({
      ...settings,
      appTitle: customTitle.trim() || 'Archivo Fotográfico',
      appSubtitle: customSubtitle.trim() || 'Preserva tus actividades',
      primaryColor: customHexColor,
      darkColor: customDarkColor || '#0a0f1d',
      accentColor: customAccentColor || '#b81d24',
      adminEmail: customAdminEmail.trim().toLowerCase(),
      tabArchiveLabel: customTabArchiveLabel.trim() || '📂 Archivo Fotográfico IDAC',
      tabWorkspaceLabel: customTabWorkspaceLabel.trim() || '☁️ Portal Google Workspace',
      sidebarSearchLabel: customSidebarSearchLabel.trim() || 'Buscar Archivo',
      sidebarSearchPlaceholder: customSidebarSearchPlaceholder.trim() || 'Título, nota o categoría...',
      sidebarTimelineLabel: customSidebarTimelineLabel.trim() || 'Línea Temporal',
      sidebarAllRecollectionsLabel: customSidebarAllRecollectionsLabel.trim() || 'Todos los recuerdos',
      sidebarCategoriesLabel: customSidebarCategoriesLabel.trim() || 'Categorías',
      sidebarAuthorsLabel: customSidebarAuthorsLabel.trim() || 'Subido Por',
      sidebarPlacesLabel: customSidebarPlacesLabel.trim() || 'Lugares / Secciones',
      newRecollectionBtnLabel: customNewRecollectionBtnLabel.trim() || 'Nuevo Recuerdo',
      panelTitle: customPanelTitle.trim() || 'Panel de Control IDAC',
      panelTabSessionLabel: customPanelTabSessionLabel.trim() || 'Sesión Activa',
      panelTabUsersLabel: customPanelTabUsersLabel.trim() || 'Usuarios',
      panelTabInvitationsLabel: customPanelTabInvitationsLabel.trim() || 'Invitaciones',
      panelTabStorageLabel: customPanelTabStorageLabel.trim() || 'Almacenamiento',
      panelTabPersonalizationLabel: customPanelTabPersonalizationLabel.trim() || 'Personalización',
      panelTabPlacesLabel: customPanelTabPlacesLabel.trim() || 'Lugares / Secciones',
      formNewModalTitle: customFormNewModalTitle.trim() || 'Nuevo Recuerdo de Actividad',
      formEditModalTitle: customFormEditModalTitle.trim() || 'Editar Recuerdo',
      shareModalTitle: customShareModalTitle.trim() || '📢 Compartir en Redes Sociales',
      workspaceSectionTitle: customWorkspaceSectionTitle.trim() || '☁️ Portal Google Workspace',
      footerText: customFooterText.trim() || '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.',
    });
    
    // Also update any admin users in user list to reflect new admin email
    const updatedUsers = users.map(u => {
      if (u.role === 'admin') {
        return { ...u, email: customAdminEmail.trim().toLowerCase() };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);

    onShowToast('Branding, textos y correo del administrador actualizados.', 'success');
  };

  // Save Customizable Cloud Storage settings
  const handleApplyCloudStorage = () => {
    if (!cloudBucket.trim()) {
      onShowToast('La ruta o nombre del bucket es obligatorio.', 'error');
      return;
    }

    onUpdateSettings({
      ...settings,
      cloudStorageProvider: cloudProvider,
      cloudStorageBucket: cloudBucket.trim(),
      cloudStorageRegion: cloudRegion.trim() || 'us-east1'
    });

    onShowToast('Configuración de almacenamiento en la nube guardada.', 'success');
  };


  // Preset Color Click
  const handleApplyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setCustomHexColor(preset.primary);
    setCustomDarkColor(preset.dark);
    setCustomAccentColor(preset.accent);

    onUpdateSettings({
      ...settings,
      primaryColor: preset.primary,
      darkColor: preset.dark,
      accentColor: preset.accent,
    });
    onShowToast('Paleta de colores aplicada.', 'success');
  };

  // Custom Color Submit
  const handleApplyCustomColors = () => {
    // Basic hex check
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(customHexColor)) {
      onShowToast('Código hexadecimal de color primario inválido.', 'error');
      return;
    }

    onUpdateSettings({
      ...settings,
      appTitle: customTitle.trim() || 'Archivo Fotográfico',
      appSubtitle: customSubtitle.trim() || 'Preserva tus actividades',
      primaryColor: customHexColor,
      darkColor: customDarkColor || '#0a0f1d',
      accentColor: customAccentColor || '#b81d24',
      tabArchiveLabel: customTabArchiveLabel.trim() || '📂 Archivo Fotográfico IDAC',
      tabWorkspaceLabel: customTabWorkspaceLabel.trim() || '☁️ Portal Google Workspace',
      sidebarSearchLabel: customSidebarSearchLabel.trim() || 'Buscar Archivo',
      sidebarSearchPlaceholder: customSidebarSearchPlaceholder.trim() || 'Título, nota o categoría...',
      sidebarTimelineLabel: customSidebarTimelineLabel.trim() || 'Línea Temporal',
      sidebarAllRecollectionsLabel: customSidebarAllRecollectionsLabel.trim() || 'Todos los recuerdos',
      newRecollectionBtnLabel: customNewRecollectionBtnLabel.trim() || 'Nuevo Recuerdo',
      footerText: customFooterText.trim() || '© 2026 Archivo Fotográfico de Actividades - IDAC. Todos los recuerdos guardados de forma segura en tu navegador.',
    });
    onShowToast('Personalización visual guardada.', 'success');
  };

  // Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      onShowToast('La imagen es demasiado grande. Máximo 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onUpdateSettings({
        ...settings,
        logoBase64: base64,
      });
      onShowToast('Logo corporativo actualizado con éxito.', 'success');
    };
    reader.onerror = () => {
      onShowToast('Error al leer el archivo de imagen.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    onUpdateSettings({
      ...settings,
      logoBase64: null,
    });
    onShowToast('Logo restablecido al diseño predeterminado.', 'success');
  };

  // Place Management actions
  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newPlaceInput.trim();
    if (!val) return;
    if (places.includes(val)) {
      onShowToast('Este lugar o sección ya existe en la lista.', 'error');
      return;
    }
    onUpdatePlaces([...places, val]);
    setNewPlaceInput('');
    onShowToast(`Lugar "${val}" agregado exitosamente.`, 'success');
  };

  const handleStartEditPlace = (idx: number, currentVal: string) => {
    setEditingPlaceIdx(idx);
    setEditingPlaceValue(currentVal);
  };

  const handleSaveEditPlace = (idx: number) => {
    const val = editingPlaceValue.trim();
    if (!val) return;
    if (places.some((p, i) => i !== idx && p.toLowerCase() === val.toLowerCase())) {
      onShowToast('Ya existe otra sección con ese nombre.', 'error');
      return;
    }
    const updated = [...places];
    updated[idx] = val;
    onUpdatePlaces(updated);
    setEditingPlaceIdx(null);
    onShowToast('Nombre de la sección actualizado.', 'success');
  };

  const handleDeletePlace = (idx: number, val: string) => {
    const updated = places.filter((_, i) => i !== idx);
    onUpdatePlaces(updated);
    onShowToast(`Sección "${val}" eliminada de la lista.`, 'delete');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl border border-slate-100 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Cabecera del Panel */}
        <div className="bg-gradient-to-r from-idac-blue to-[#001d44] text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <Settings className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {settings.panelTitle || 'Panel de Control IDAC'}
              </h2>
              <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest mt-0.5">
                Usuarios, Permisos y Personalización del Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onReturnToHome && (
              <button
                type="button"
                onClick={onReturnToHome}
                className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 shadow-xs"
                title="Volver al Menú Principal / Inicio"
              >
                <Home className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">🏠 Menú Principal</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 py-2 px-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-idac-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{settings.panelTabSessionLabel || 'Sesión Activa'}</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer ${
              activeTab === 'users'
                ? 'bg-idac-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{settings.panelTabUsersLabel || 'Usuarios'}</span>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex-1 py-2 px-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer ${
              activeTab === 'invitations'
                ? 'bg-idac-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{settings.panelTabInvitationsLabel || 'Invitaciones'}</span>
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 px-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-idac-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{settings.panelTabStorageLabel || 'Almacenamiento'}</span>
          </button>
          <button
            onClick={() => setActiveTab('personalization')}
            className={`flex-1 py-2 px-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer ${
              activeTab === 'personalization'
                ? 'bg-idac-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{settings.panelTabPersonalizationLabel || 'Personalización'}</span>
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-2 px-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px] cursor-pointer ${
              activeTab === 'places'
                ? 'bg-idac-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{settings.panelTabPlacesLabel || 'Lugares / Secciones'}</span>
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          
          {/* PESTAÑA 1: SESIÓN ACTIVA / SIMULADOR */}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              {/* Barra Superior con botón de Inicio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Sección: Sesión Activa del Usuario</span>
                </span>
                <button
                  type="button"
                  onClick={onReturnToHome || onClose}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-idac-blue" />
                  <span>🏠 Volver al Inicio</span>
                </button>
              </div>

              <div className="p-4 bg-blue-50/30 border border-idac-blue/20 rounded-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Simulador de Roles de Usuario</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
                  Para probar cómo funciona el sistema de seguridad y permisos de publicación, selecciona cualquier usuario de la lista a continuación para actuar como él.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {users.map((user) => {
                  const isActive = currentUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => onSelectCurrentUser(user)}
                      className={`p-4 border transition-all cursor-pointer flex flex-col justify-between gap-3 rounded-xl ${
                        isActive
                          ? 'border-idac-blue bg-blue-50/40 shadow-xs ring-2 ring-idac-blue/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-900 block">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5 block">
                            Rol: {user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Colaborador' : 'Lector'}
                          </span>
                        </div>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-idac-blue text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 border-t border-slate-100 pt-2 text-[10px]">
                        {user.canPublish ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-black uppercase tracking-widest">
                            <Shield className="w-3.5 h-3.5" /> Puede Publicar
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-idac-red font-black uppercase tracking-widest">
                            <ShieldAlert className="w-3.5 h-3.5" /> Solo Lectura
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulario de Edición Directa del Usuario de la Sesión Activa */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span>✍️ Cambiar Nombre / Datos del Usuario Seleccionado</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                    <input
                      type="text"
                      value={editingActiveName}
                      onChange={(e) => setEditingActiveName(e.target.value)}
                      placeholder="Nombre Completo"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-idac-blue font-bold text-slate-800 uppercase tracking-wider"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                    <input
                      type="email"
                      value={editingActiveEmail}
                      onChange={(e) => setEditingActiveEmail(e.target.value)}
                      placeholder="correo@idac.gob.do"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-idac-blue font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingActiveName.trim()) {
                        onShowToast('El nombre no puede estar vacío.', 'error');
                        return;
                      }
                      if (!editingActiveEmail.trim()) {
                        onShowToast('El correo no puede estar vacío.', 'error');
                        return;
                      }
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(editingActiveEmail.trim())) {
                        onShowToast('Formato de correo electrónico inválido.', 'error');
                        return;
                      }

                      // Check for duplicate emails for other users
                      const duplicateEmail = users.some(u => u.id !== currentUser.id && u.email.toLowerCase() === editingActiveEmail.trim().toLowerCase());
                      if (duplicateEmail) {
                        onShowToast('Este correo ya pertenece a otro usuario.', 'error');
                        return;
                      }

                      // Update in users list
                      const updatedUsers = users.map(u => {
                        if (u.id === currentUser.id) {
                          return {
                            ...u,
                            name: editingActiveName.trim(),
                            email: editingActiveEmail.trim().toLowerCase()
                          };
                        }
                        return u;
                      });
                      
                      onUpdateUsers(updatedUsers);
                      
                      // Update active session
                      onSelectCurrentUser({
                        ...currentUser,
                        name: editingActiveName.trim(),
                        email: editingActiveEmail.trim().toLowerCase()
                      });

                      onShowToast(`Perfil de "${editingActiveName.trim()}" guardado con éxito.`, 'success');
                    }}
                    className="px-5 py-2.5 bg-idac-blue hover:bg-idac-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✅ Aceptar y Guardar Datos</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Nota: Si seleccionas un usuario con el permiso "Solo Lectura", los botones para agregar, editar o eliminar recuerdos estarán bloqueados para simular los límites de su perfil de seguridad.
              </div>

              {/* Tus Ajustes de Notificación por Correo */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Ajustes de Notificación por Correo</span>
                </h4>
                <label className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase tracking-wide cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentUser.receiveNotifications !== false}
                    onChange={() => {
                      const updated = users.map(u => {
                        if (u.id === currentUser.id) {
                          return { ...u, receiveNotifications: u.receiveNotifications === false ? true : false };
                        }
                        return u;
                      });
                      onUpdateUsers(updated);
                      onShowToast('Tu preferencia de notificación por correo ha sido actualizada.', 'success');
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-idac-blue focus:ring-idac-blue cursor-pointer"
                  />
                  <span>Recibir alertas por correo electrónico cuando haya cambios en el archivo</span>
                </label>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-relaxed">
                  Te avisaremos a <span className="font-mono text-slate-600">{currentUser.email}</span> cada vez que un colaborador agregue, edite o elimine algún archivo fotográfico del archivo IDAC.
                </p>
              </div>

              {/* Tus Ajustes de Notificación por WhatsApp */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-xs">
                      <MessageSquare className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span>Notificaciones por WhatsApp</span>
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md border ${
                          editingActiveWhatsappEnabled 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {editingActiveWhatsappEnabled ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Alertas instantáneas a tu celular de cada subida o cambio de foto
                      </p>
                    </div>
                  </div>

                  {/* Toggle Activar / Desactivar */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={editingActiveWhatsappEnabled}
                      onChange={(e) => setEditingActiveWhatsappEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>Número de Celular WhatsApp</span>
                      </label>
                      <input
                        type="text"
                        placeholder="+1 809 555 0199"
                        value={editingActiveWhatsappNumber}
                        onChange={(e) => setEditingActiveWhatsappNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-slate-800 font-bold shadow-2xs"
                      />
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Prefijos RD:</span>
                        <button
                          type="button"
                          onClick={() => setEditingActiveWhatsappNumber('+1809')}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 text-[8px] font-mono font-bold rounded hover:bg-emerald-50 text-slate-600 cursor-pointer"
                        >
                          +1 (809)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingActiveWhatsappNumber('+1829')}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 text-[8px] font-mono font-bold rounded hover:bg-emerald-50 text-slate-600 cursor-pointer"
                        >
                          +1 (829)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingActiveWhatsappNumber('+1849')}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 text-[8px] font-mono font-bold rounded hover:bg-emerald-50 text-slate-600 cursor-pointer"
                        >
                          +1 (849)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-2 bg-white/90 p-3 border border-emerald-200/80 rounded-xl shadow-2xs">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-wide cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingActiveWhatsappNotifyUpload}
                          onChange={(e) => setEditingActiveWhatsappNotifyUpload(e.target.checked)}
                          className="w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Notificarme por cada subida de foto</span>
                      </label>
                      <p className="text-[8.5px] text-slate-500 font-bold uppercase leading-tight">
                        Recibirás un mensaje automático con el título, fecha, autor y notas del recuerdo cuando se agregue al archivo.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/80">
                    <button
                      type="button"
                      onClick={() => handleTestWhatsappDispatch(currentUser)}
                      className="px-3.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>📲 Probar Notificación WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveActiveWhatsappSettings}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>💾 Guardar Preferencias de WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: USUARIOS Y PERMISOS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* Barra Superior con botón de Inicio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Sección: Usuarios, Colaboradores y Permisos</span>
                </span>
                <button
                  type="button"
                  onClick={onReturnToHome || onClose}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-idac-blue" />
                  <span>🏠 Volver al Inicio</span>
                </button>
              </div>

              {/* Sección 1: Autorizar usuario por Correo Electrónico */}
              <div className="p-4 bg-blue-50/20 border border-idac-blue/15 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-idac-blue" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                    Autorizar Publicación por Correo Electrónico
                  </h3>
                </div>
                <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                  Busca o registra instantáneamente a un colaborador ingresando su dirección de correo para otorgarle permisos de publicación directos en el archivo.
                </p>
                <form onSubmit={handleAuthorizeEmail} className="flex gap-2 flex-col sm:flex-row">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="correo@idac.gob.do"
                      value={authorizeEmailInput}
                      onChange={(e) => setAuthorizeEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-idac-blue font-bold uppercase tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-idac-red text-white text-[10px] font-black rounded-xl hover:bg-idac-dark transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>✅ Aceptar y Autorizar Correo</span>
                  </button>
                </form>
              </div>

              {/* Registrar nuevo usuario */}
              <form onSubmit={handleAddUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-idac-blue" />
                  <span>Registrar Nuevo Usuario / Perfil Completo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej. Ing. Juan Pérez"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      placeholder="juan.perez@idac.gob.do"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-mono text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol del Sistema</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => {
                        const role = e.target.value as 'admin' | 'editor' | 'viewer';
                        setNewUserRole(role);
                        setNewUserCanPublish(role !== 'viewer');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-bold uppercase tracking-wider"
                    >
                      <option value="admin">Administrador (Publica/Edita)</option>
                      <option value="editor">Colaborador (Publica/Edita)</option>
                      <option value="viewer">Lector (Solo Vista)</option>
                    </select>
                  </div>

                  <div className="flex items-end pb-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        id="can-publish-check"
                        type="checkbox"
                        checked={newUserCanPublish}
                        disabled={newUserRole === 'viewer'}
                        onChange={(e) => setNewUserCanPublish(e.target.checked)}
                        className="w-4 h-4 text-idac-blue border-slate-300 rounded-md focus:ring-idac-blue cursor-pointer"
                      />
                      <label htmlFor="can-publish-check" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">
                        Permitir que este usuario publique fotos y recuerdos
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-200 pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-idac-blue text-white text-[10px] font-black rounded-xl hover:bg-idac-dark transition-all cursor-pointer uppercase tracking-widest shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✅ Aceptar y Registrar Usuario</span>
                  </button>
                </div>
              </form>

              {/* Lista de usuarios registrados */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                    Colaboradores Registrados ({users.length})
                  </h3>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUserStatusFilter('all')}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        userStatusFilter === 'all'
                          ? 'bg-idac-blue text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Todos ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserStatusFilter('active')}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        userStatusFilter === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Activos 🟢 ({users.filter(u => u.status !== 'inactive').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserStatusFilter('inactive')}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        userStatusFilter === 'inactive'
                          ? 'bg-idac-red text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Inactivos 🔴 ({users.filter(u => u.status === 'inactive').length})
                    </button>
                  </div>
                </div>
                
                <div className="border border-slate-200 divide-y divide-slate-100 rounded-xl overflow-hidden shadow-xs">
                  {users
                    .filter(u => {
                      if (userStatusFilter === 'active') return u.status !== 'inactive';
                      if (userStatusFilter === 'inactive') return u.status === 'inactive';
                      return true;
                    })
                    .map((user) => (
                    <div key={user.id} className="bg-white p-3.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Modo edición activo */}
                        {editingUserId === user.id ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                              <input
                                type="text"
                                value={editingUserName}
                                onChange={(e) => setEditingUserName(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-idac-blue/30 rounded-lg focus:outline-none font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Usuario (Login)</label>
                              <input
                                type="text"
                                value={editingUserUsername}
                                onChange={(e) => setEditingUserUsername(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-idac-blue/30 rounded-lg focus:outline-none font-mono text-slate-700 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Correo</label>
                              <input
                                type="email"
                                value={editingUserEmail}
                                onChange={(e) => setEditingUserEmail(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-idac-blue/30 rounded-lg focus:outline-none font-mono text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Número WhatsApp</label>
                              <input
                                type="text"
                                placeholder="+1 809 555 0199"
                                value={editingUserWhatsappNumber}
                                onChange={(e) => setEditingUserWhatsappNumber(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none font-mono text-slate-800 font-bold"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">{user.name}</span>
                              <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 rounded-md">
                                {user.role === 'admin' ? 'Admin' : user.role === 'editor' ? 'Colaborador' : 'Lector'}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-md ${
                                user.status === 'inactive'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {user.status === 'inactive' ? '🔴 Cuenta Inactiva' : '🟢 Cuenta Activa'}
                              </span>

                              {/* Badge WhatsApp */}
                              <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-md flex items-center gap-1 ${
                                user.whatsappEnabled !== false && user.whatsappNumber
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                                <span>
                                  {user.whatsappEnabled !== false && user.whatsappNumber
                                    ? `WA: ${user.whatsappNumber}`
                                    : 'WA Desactivado'}
                                </span>
                              </span>

                              {currentUser.id === user.id && (
                                <span className="px-1.5 py-0.5 bg-idac-blue/10 text-idac-blue text-[8px] font-black uppercase tracking-widest border border-idac-blue/20 rounded-md">
                                  Sesión Activa
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 block">
                              {user.email} {user.username && `• @${user.username}`}
                              {user.lastEmailSentAt && (
                                <span className="text-idac-blue font-sans text-[9px] font-bold ml-2">
                                  ✉️ Correo enviado: {user.lastEmailSentAt}
                                </span>
                              )}
                              {user.lastWhatsappSentAt && (
                                <span className="text-emerald-600 font-sans text-[9px] font-bold ml-2">
                                  💬 WhatsApp enviado: {user.lastWhatsappSentAt}
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.receiveNotifications !== false}
                                  onChange={() => {
                                    const updated = users.map(u => {
                                      if (u.id === user.id) {
                                        return { ...u, receiveNotifications: u.receiveNotifications === false ? true : false };
                                      }
                                      return u;
                                    });
                                    onUpdateUsers(updated);
                                    onShowToast(`Preferencia de notificaciones de ${user.name} actualizada.`, 'success');
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-idac-blue focus:ring-idac-blue cursor-pointer"
                                />
                                <span>Correos</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.whatsappEnabled !== false}
                                  onChange={() => handleToggleUserWhatsappAdmin(user.id)}
                                  className="w-3.5 h-3.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span>Alertas WhatsApp</span>
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                          
                          {/* Controles de edición */}
                          {editingUserId === user.id ? (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={handleSaveEditUser}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase px-3"
                                title="Guardar cambios"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Guardar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Botón Probar Alerta WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleTestWhatsappDispatch(user)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Probar envío de WhatsApp a este usuario"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">Alerta WA</span>
                              </button>

                              {/* Botón enviar correo de activación */}
                              <button
                                type="button"
                                onClick={() => handleSendActivationEmail(user)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-idac-blue/20 text-idac-blue text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Enviar o reenviar correo de bienvenida y activación"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Correo Activación</span>
                              </button>

                              {/* Toggle Estado Activo / Inactivo */}
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(user.id)}
                                className={`px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer rounded-lg flex items-center gap-1 ${
                                  user.status === 'inactive'
                                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                }`}
                                title={user.status === 'inactive' ? 'Activar usuario' : 'Desactivar acceso de usuario'}
                              >
                                {user.status === 'inactive' ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Activar</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Desactivar</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEditUser(user)}
                                className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer rounded-lg"
                                title="Editar nombre y correo"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {currentUser.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (resettingPasswordUserId === user.id) {
                                      setResettingPasswordUserId(null);
                                      setNewPasswordInput('');
                                    } else {
                                      setResettingPasswordUserId(user.id);
                                      setNewPasswordInput('');
                                    }
                                  }}
                                  className={`p-2 border transition-all cursor-pointer rounded-lg ${
                                    resettingPasswordUserId === user.id
                                      ? 'bg-idac-blue text-white border-idac-blue/30'
                                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                                  }`}
                                  title="Restablecer Contraseña (Admin)"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleTogglePublish(user.id)}
                                className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer rounded-lg ${
                                  user.canPublish
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-idac-red border-red-200 hover:bg-red-100'
                                }`}
                              >
                                {user.canPublish ? 'Puede Publicar' : 'Solo Vista'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                disabled={currentUser.id === user.id || users.length <= 1}
                                className="p-2 text-slate-400 hover:text-idac-red hover:border-idac-red border border-transparent hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all cursor-pointer rounded-lg"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Formulario de restablecimiento de contraseña (Inline) */}
                      {resettingPasswordUserId === user.id && (
                        <div className="p-3.5 bg-slate-50 border border-idac-blue/15 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              Restablecer contraseña para <span className="text-slate-700">{user.name}</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Mínimo 6 caracteres"
                              value={newPasswordInput}
                              onChange={(e) => setNewPasswordInput(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-idac-blue font-mono font-bold"
                            />
                          </div>
                          <div className="flex items-end gap-1.5 self-end">
                            <button
                              onClick={() => handleResetPasswordSubmit(user.id)}
                              className="px-3 py-1.5 bg-[#00316f] hover:bg-[#001f44] text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer shadow-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setResettingPasswordUserId(null);
                                setNewPasswordInput('');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: INVITACIONES */}
          {activeTab === 'invitations' && (
            <div className="space-y-6">
              
              {/* Barra Superior con botón de Inicio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Sección: Invitaciones de Registro</span>
                </span>
                <button
                  type="button"
                  onClick={onReturnToHome || onClose}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-idac-blue" />
                  <span>🏠 Volver al Inicio</span>
                </button>
              </div>

              {/* Formulario de invitación */}
              <form onSubmit={handleInviteCollaborator} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-idac-blue" />
                  <span>Invitar Nuevo Colaborador</span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                  Envía una invitación formal. Se generará un código de acceso único que el colaborador podrá usar para unirse instantáneamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="invitado@idac.gob.do"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol Propuesto</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => {
                        const role = e.target.value as 'admin' | 'editor' | 'viewer';
                        setInviteRole(role);
                        setInviteCanPublish(role !== 'viewer');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-bold uppercase tracking-wider"
                    >
                      <option value="editor">Colaborador (Publica/Edita)</option>
                      <option value="admin">Administrador (Control Total)</option>
                      <option value="viewer">Lector (Solo Vista)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="invite-can-publish-check"
                      type="checkbox"
                      checked={inviteCanPublish}
                      disabled={inviteRole === 'viewer'}
                      onChange={(e) => setInviteCanPublish(e.target.checked)}
                      className="w-4 h-4 text-idac-blue border-slate-300 rounded-md focus:ring-idac-blue cursor-pointer"
                    />
                    <label htmlFor="invite-can-publish-check" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">
                      Permitir que publique de forma predeterminada
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-idac-blue text-white text-[10px] font-black rounded-xl hover:bg-idac-dark transition-all cursor-pointer uppercase tracking-widest shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✅ Aceptar y Enviar Invitación</span>
                  </button>
                </div>
              </form>

              {/* Lista de invitaciones */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Invitaciones Enviadas ({invitations.length})
                </h3>

                {invitations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    No hay invitaciones activas en este momento.
                  </p>
                ) : (
                  <div className="border border-slate-200 divide-y divide-slate-100 rounded-xl overflow-hidden shadow-xs">
                    {invitations.map((invite) => (
                      <div key={invite.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">{invite.email}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 rounded-md">
                              {invite.role === 'admin' ? 'Admin' : invite.role === 'editor' ? 'Colaborador' : 'Lector'}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-md ${
                              invite.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {invite.status === 'pending' ? 'Pendiente' : 'Aceptada'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                            <span>Código:</span>
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 text-slate-600 font-bold rounded-md">{invite.code}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          {invite.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptInvitation(invite)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Simular que el invitado hace clic en el enlace para unirse"
                            >
                              <UserCheck className="w-3 h-3" /> Simular Aceptación
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteInvitation(invite.id, invite.email)}
                            className="p-1.5 text-slate-400 hover:text-idac-red hover:border-idac-red border border-transparent hover:bg-red-50 transition-all cursor-pointer"
                            title="Eliminar invitación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA: ALMACENAMIENTO NUBE */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              
              {/* Barra Superior con botón de Inicio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Sección: Servidor y Almacenamiento Cloud</span>
                </span>
                <button
                  type="button"
                  onClick={onReturnToHome || onClose}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-idac-blue" />
                  <span>🏠 Volver al Inicio</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-idac-blue" />
                  <span>Configuración de Almacenamiento en la Nube</span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                  Establece la ubicación remota donde se resguardarán los archivos originales y metadatos fotográficos de manera segura.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor Cloud</label>
                    <select
                      value={cloudProvider}
                      onChange={(e) => setCloudProvider(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-bold uppercase tracking-wider"
                    >
                      <option value="gcs">Google Cloud Storage (GCS)</option>
                      <option value="firebase">Firebase Cloud Storage</option>
                      <option value="aws">Amazon Web Services (S3)</option>
                      <option value="local">Almacenamiento Local (Simulado/IndexedDB)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Bucket / Directorio</label>
                    <input
                      type="text"
                      placeholder="idac-archivo-fotografico"
                      value={cloudBucket}
                      onChange={(e) => setCloudBucket(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-mono font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Región del Servidor</label>
                    <input
                      type="text"
                      placeholder="us-east1"
                      value={cloudRegion}
                      onChange={(e) => setCloudRegion(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-mono font-bold text-slate-700"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <button
                      type="button"
                      onClick={handleApplyCloudStorage}
                      className="w-full py-2.5 bg-idac-blue text-white text-[10px] font-black rounded-xl hover:bg-idac-dark transition-all cursor-pointer uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>✅ Aceptar y Aplicar Configuración Cloud</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tarjeta de estado de almacenamiento */}
              <div className="p-4 bg-emerald-50/20 border border-emerald-600/15 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                      Conexión Activa y Operativa
                    </span>
                  </div>
                  <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md border border-emerald-800 uppercase tracking-widest">
                    Encriptado AES-256
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-slate-700">
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Uso de Red</span>
                    <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">0.02 TB / ∞</span>
                  </div>
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Latencia</span>
                    <span className="text-xs font-black text-emerald-600 font-mono mt-0.5 block">32 ms</span>
                  </div>
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl shadow-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Archivos</span>
                    <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">Nube Directa</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono text-center font-bold break-all pt-1 select-all border-t border-slate-100">
                  Ruta de Destino Actual: {cloudProvider === 'gcs' ? 'gs://' : cloudProvider === 'aws' ? 's3://' : 'local://'}{cloudBucket || 'idac-bucket-v1'}/fotos/
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: PERSONALIZACIÓN */}
          {activeTab === 'personalization' && (
            <div className="space-y-6">
              
              {/* Barra Superior con botón de Inicio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Sección: Personalización de Marca y Textos</span>
                </span>
                <button
                  type="button"
                  onClick={onReturnToHome || onClose}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-idac-blue" />
                  <span>🏠 Volver al Inicio</span>
                </button>
              </div>

              {/* Ajustes Generales de Textos */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Branding General del Portal
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Título del Portal</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Slogan / Subtítulo</label>
                    <input
                      type="text"
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo del Administrador Principal</label>
                  <input
                    type="email"
                    value={customAdminEmail}
                    onChange={(e) => setCustomAdminEmail(e.target.value)}
                    placeholder="luismartinez150@gmail.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-mono font-bold text-slate-700"
                  />
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                    Este correo representa al súper administrador del portal y recibe todas las solicitudes de acceso y alertas de almacenamiento.
                  </p>
                </div>

                {/* Ajustes Avanzados de Textos y Etiquetas de la Página */}
                <div className="border-t border-slate-200 pt-4 space-y-5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>✍️ Personalización de Nombres y Títulos de Secciones del Proyecto</span>
                  </h4>
                  
                  {/* Seccion: Navegacion Principal */}
                  <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-idac-blue uppercase tracking-widest block">
                      1. Navegación Principal y Botones Globals
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Archivo Fotográfico"</label>
                        <input
                          type="text"
                          value={customTabArchiveLabel}
                          onChange={(e) => setCustomTabArchiveLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Google Workspace"</label>
                        <input
                          type="text"
                          value={customTabWorkspaceLabel}
                          onChange={(e) => setCustomTabWorkspaceLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Botón "Nuevo Recuerdo"</label>
                        <input
                          type="text"
                          value={customNewRecollectionBtnLabel}
                          onChange={(e) => setCustomNewRecollectionBtnLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seccion: Barra Lateral Sidebar */}
                  <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-idac-blue uppercase tracking-widest block">
                      2. Títulos de la Barra Lateral (Sidebar)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sección "Buscar Archivo"</label>
                        <input
                          type="text"
                          value={customSidebarSearchLabel}
                          onChange={(e) => setCustomSidebarSearchLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Placeholder "Búsqueda"</label>
                        <input
                          type="text"
                          value={customSidebarSearchPlaceholder}
                          onChange={(e) => setCustomSidebarSearchPlaceholder(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sección "Línea Temporal"</label>
                        <input
                          type="text"
                          value={customSidebarTimelineLabel}
                          onChange={(e) => setCustomSidebarTimelineLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Botón "Todos los recuerdos"</label>
                        <input
                          type="text"
                          value={customSidebarAllRecollectionsLabel}
                          onChange={(e) => setCustomSidebarAllRecollectionsLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sección "Categorías"</label>
                        <input
                          type="text"
                          value={customSidebarCategoriesLabel}
                          onChange={(e) => setCustomSidebarCategoriesLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sección "Subido Por / Colaboradores"</label>
                        <input
                          type="text"
                          value={customSidebarAuthorsLabel}
                          onChange={(e) => setCustomSidebarAuthorsLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sección "Lugares / Secciones"</label>
                        <input
                          type="text"
                          value={customSidebarPlacesLabel}
                          onChange={(e) => setCustomSidebarPlacesLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seccion: Panel de Control */}
                  <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-idac-blue uppercase tracking-widest block">
                      3. Títulos y Pestañas del Panel de Control
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Título General del Panel</label>
                        <input
                          type="text"
                          value={customPanelTitle}
                          onChange={(e) => setCustomPanelTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Sesión Activa"</label>
                        <input
                          type="text"
                          value={customPanelTabSessionLabel}
                          onChange={(e) => setCustomPanelTabSessionLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Usuarios"</label>
                        <input
                          type="text"
                          value={customPanelTabUsersLabel}
                          onChange={(e) => setCustomPanelTabUsersLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Invitaciones"</label>
                        <input
                          type="text"
                          value={customPanelTabInvitationsLabel}
                          onChange={(e) => setCustomPanelTabInvitationsLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Almacenamiento"</label>
                        <input
                          type="text"
                          value={customPanelTabStorageLabel}
                          onChange={(e) => setCustomPanelTabStorageLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Personalización"</label>
                        <input
                          type="text"
                          value={customPanelTabPersonalizationLabel}
                          onChange={(e) => setCustomPanelTabPersonalizationLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pestaña "Lugares / Secciones"</label>
                        <input
                          type="text"
                          value={customPanelTabPlacesLabel}
                          onChange={(e) => setCustomPanelTabPlacesLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seccion: Modales y Diálogos */}
                  <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-idac-blue uppercase tracking-widest block">
                      4. Títulos de Modales y Ventanas emergentes
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modal "Nuevo Recuerdo"</label>
                        <input
                          type="text"
                          value={customFormNewModalTitle}
                          onChange={(e) => setCustomFormNewModalTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modal "Editar Recuerdo"</label>
                        <input
                          type="text"
                          value={customFormEditModalTitle}
                          onChange={(e) => setCustomFormEditModalTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modal "Compartir en Redes"</label>
                        <input
                          type="text"
                          value={customShareModalTitle}
                          onChange={(e) => setCustomShareModalTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-idac-blue font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Texto del Pie de Página (Footer Copyright)</label>
                    <textarea
                      value={customFooterText}
                      onChange={(e) => setCustomFooterText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Subir Logo */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-idac-blue" />
                  <span>Logotipo Personalizado</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-16 h-16 bg-white border-2 border-idac-blue flex items-center justify-center overflow-hidden shrink-0 rounded-xl">
                    {settings.logoBase64 ? (
                      <img src={settings.logoBase64} alt="Custom Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-idac-blue bg-blue-100 flex items-center justify-center font-black text-[9px] text-idac-blue">
                        IDAC
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-idac-blue hover:bg-idac-dark text-white text-[10px] font-black rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3 h-3" /> Subir Imagen
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {settings.logoBase64 && (
                        <button
                          type="button"
                          onClick={handleResetLogo}
                          className="px-3 py-1.5 bg-white border border-idac-red text-idac-red hover:bg-red-50 text-[10px] font-black rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Restablecer
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                      Sube una imagen cuadrada de tu institución o empresa (Max 2MB). Reemplazará el icono de la cámara en la barra superior.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Colores Temáticos */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                    Colores de Marca & Tema
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cambia la base azul oscuro</span>
                </div>

                {/* Preajustes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_COLORS.map((preset) => {
                    const isSelected = settings.primaryColor === preset.primary;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2 border rounded-xl text-left flex flex-col gap-1.5 transition-all cursor-pointer hover:bg-slate-50 ${
                          isSelected ? 'border-idac-blue bg-blue-50/20 ring-2 ring-idac-blue/10' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded-md border border-slate-300" style={{ backgroundColor: preset.primary }} />
                          <div className="w-4 h-4 rounded-md border border-slate-300" style={{ backgroundColor: preset.dark }} />
                          <div className="w-4 h-4 rounded-md border border-slate-300" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider leading-tight truncate w-full">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selector de Color Personalizado */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
                    Definir Colores Personalizados en Hexadecimal
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Color Primario</label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={customHexColor}
                          onChange={(e) => setCustomHexColor(e.target.value)}
                          className="w-8 h-8 p-0 border border-slate-300 rounded-md cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={customHexColor}
                          onChange={(e) => setCustomHexColor(e.target.value)}
                          placeholder="#00316f"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-idac-blue font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Color Oscuro (Frontera)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={customDarkColor}
                          onChange={(e) => setCustomDarkColor(e.target.value)}
                          className="w-8 h-8 p-0 border border-slate-300 rounded-md cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={customDarkColor}
                          onChange={(e) => setCustomDarkColor(e.target.value)}
                          placeholder="#001f44"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-idac-blue font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Color de Acento</label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={customAccentColor}
                          onChange={(e) => setCustomAccentColor(e.target.value)}
                          className="w-8 h-8 p-0 border border-slate-300 rounded-md cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={customAccentColor}
                          onChange={(e) => setCustomAccentColor(e.target.value)}
                          placeholder="#b81d24"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-idac-blue font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Guardar */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleApplyBrandingAndAdmin}
                  className="px-6 py-3 bg-idac-blue hover:bg-idac-dark text-white text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-widest shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✅ Aceptar y Aplicar Cambios de Personalización</span>
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA: LUGARES / SECCIONES */}
          {activeTab === 'places' && (
            <div className="space-y-6">
              
              {/* Barra Superior con botón de Inicio */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-idac-blue" />
                  <span>Sección: Secciones y Lugares del Archivo</span>
                </span>
                <button
                  type="button"
                  onClick={onReturnToHome || onClose}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-idac-blue" />
                  <span>🏠 Volver al Inicio</span>
                </button>
              </div>

              <div className="p-4 bg-blue-50/20 border border-idac-blue/15 rounded-xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-idac-blue" />
                  <span>Secciones y Lugares del Archivo Fotográfico</span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                  Crea y personaliza las secciones o lugares donde se clasificarán tus fotografías y actividades. Las secciones se ordenan alfabéticamente en la línea de tiempo.
                </p>
              </div>

              {/* Formulario para agregar una nueva sección */}
              <form onSubmit={handleAddPlace} className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="Ej. Aeropuerto Las Américas, Helipuerto, Oficina Central"
                  value={newPlaceInput}
                  onChange={(e) => setNewPlaceInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-idac-blue font-bold uppercase tracking-wider"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-idac-blue text-white text-[10px] font-black rounded-xl hover:bg-idac-dark transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✅ Aceptar y Agregar Sección</span>
                </button>
              </form>

              {/* Lista de secciones personalizadas */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Secciones Actuales ({places.length})</h4>
                <div className="border border-slate-200 divide-y divide-slate-100 rounded-xl overflow-hidden shadow-xs">
                  {places.map((place, idx) => (
                    <div key={place + idx} className="p-3 bg-white flex items-center justify-between gap-4">
                      {editingPlaceIdx === idx ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingPlaceValue}
                            onChange={(e) => setEditingPlaceValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-idac-blue/30 rounded-lg focus:outline-none font-bold uppercase tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditPlace(idx)}
                            className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Aceptar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlaceIdx(null)}
                            className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                            {place}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditPlace(idx, place)}
                              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-all"
                              title="Editar nombre"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlace(idx, place)}
                              className="p-1.5 border border-transparent hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-idac-red rounded-lg cursor-pointer transition-all"
                              title="Eliminar sección"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BARRA FIXA INFERIOR DE ACCIONES (INICIO Y ACEPTAR CAMBIOS) */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={onReturnToHome || onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <Home className="w-4 h-4 text-idac-blue" />
            <span>🏠 Volver al Inicio / Menú Principal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleApplyBrandingAndAdmin();
              onShowToast('✅ Cambios en la configuración aceptados y aplicados correctamente.', 'success');
              if (onReturnToHome) {
                onReturnToHome();
              } else {
                onClose();
              }
            }}
            className="px-6 py-2 bg-idac-blue hover:bg-idac-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✅ Aceptar Todos los Cambios</span>
          </button>
        </div>

      </div>

      {/* MODAL DE VISTA PREVIA Y CONFIRMACIÓN DE ENVÍO DE CORREO */}
      {emailPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-idac-blue text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-300" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Notificación de Correo Enviada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailPreviewModal(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-[11px] font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Servidor SMTP IDAC: Mensaje de activación despachado con éxito al destinatario.</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] w-16">Para:</span>
                  <span className="font-mono font-bold text-idac-blue">{emailPreviewModal.recipient}</span>
                </div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] w-16">Asunto:</span>
                  <span className="font-bold text-slate-800">{emailPreviewModal.subject}</span>
                </div>
                <div>
                  <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Mensaje:</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {emailPreviewModal.body}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailPreviewModal.body);
                    onShowToast('Cuerpo del correo copiado al portapapeles.', 'success');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Copiar Mensaje
                </button>
                <button
                  type="button"
                  onClick={() => setEmailPreviewModal(null)}
                  className="px-5 py-2 bg-idac-blue hover:bg-idac-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Entendido / Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA Y ENVÍO REAL / SIMULADO DE NOTIFICACIÓN WHATSAPP */}
      {whatsappPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-200" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Notificación Despachada por WhatsApp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappPreviewModal(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 text-[11px] font-bold">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>Alerta procesada. Puedes abrir el mensaje directamente en WhatsApp Web o en la App oficial.</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] w-20">Destinatario:</span>
                  <span className="font-bold text-slate-800">{whatsappPreviewModal.recipientName}</span>
                </div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] w-20">Teléfono:</span>
                  <span className="font-mono font-bold text-emerald-700">{whatsappPreviewModal.phone}</span>
                </div>
                <div>
                  <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] block mb-1">Burbuja de Mensaje WhatsApp:</span>
                  <div className="p-3.5 bg-emerald-950 text-emerald-100 border border-emerald-800 rounded-2xl font-sans text-xs whitespace-pre-wrap leading-relaxed shadow-inner">
                    {whatsappPreviewModal.message}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={whatsappPreviewModal.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>📲 Abrir Chat Oficial en WhatsApp</span>
                </a>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappPreviewModal.message);
                      onShowToast('Mensaje de WhatsApp copiado al portapapeles.', 'success');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Copiar Texto
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappPreviewModal(null)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
