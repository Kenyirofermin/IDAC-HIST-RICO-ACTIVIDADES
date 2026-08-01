/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Activity {
  id: string;
  title: string;
  date: string; // Formato YYYY-MM-DD
  year: number;  // Extraído de date
  month: number; // Extraído de date (1-12)
  day: number;   // Extraído de date (1-31)
  notes: string;
  photos: string[]; // URLs de base64 o URLs de imágenes de Unsplash
  tags?: string[];
  author?: string; // Nombre de la persona que subió las fotos
  createdAt: string; // Timestamp de creación
  place?: string;    // Lugar/sección para organización alfabética
}

export interface ActivityGroup {
  year: number;
  months: {
    month: number;
    days: {
      day: number;
      activities: Activity[];
    }[];
  }[];
}

export type ViewMode = 'timeline' | 'grid';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  canPublish: boolean;
  username?: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  receiveNotifications?: boolean;
  status?: 'active' | 'inactive' | 'pending';
  activatedAt?: string;
  lastEmailSentAt?: string;
  whatsappNumber?: string;
  whatsappEnabled?: boolean;
  whatsappNotifyOnUpload?: boolean;
  lastWhatsappSentAt?: string;
}

export interface PersonalizationSettings {
  appTitle: string;
  appSubtitle: string;
  primaryColor: string;
  darkColor: string;
  accentColor: string;
  logoBase64: string | null;
  adminEmail: string;
  cloudStorageProvider: 'gcs' | 's3' | 'firebase' | 'local';
  cloudStorageBucket: string;
  cloudStorageRegion: string;
  // Customizable labels and titles for any section in the project
  tabArchiveLabel?: string;
  tabWorkspaceLabel?: string;
  sidebarSearchLabel?: string;
  sidebarSearchPlaceholder?: string;
  sidebarTimelineLabel?: string;
  sidebarAllRecollectionsLabel?: string;
  sidebarCategoriesLabel?: string;
  sidebarAuthorsLabel?: string;
  sidebarPlacesLabel?: string;
  newRecollectionBtnLabel?: string;
  
  // Settings Panel Tab Labels
  panelTitle?: string;
  panelTabSessionLabel?: string;
  panelTabUsersLabel?: string;
  panelTabInvitationsLabel?: string;
  panelTabStorageLabel?: string;
  panelTabPersonalizationLabel?: string;
  panelTabPlacesLabel?: string;
  
  // Modal & Form Titles
  formNewModalTitle?: string;
  formEditModalTitle?: string;
  shareModalTitle?: string;
  workspaceSectionTitle?: string;
  
  footerText?: string;
  // WhatsApp Global Dispatch Config
  whatsappGlobalEnabled?: boolean;
  whatsappBusinessPhone?: string;
  whatsappApiToken?: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  canPublish: boolean;
  code: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

