/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity } from '../types';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Facebook,
  Send,
  Image as ImageIcon,
  Share2,
  Search,
  Globe,
  Mail,
  MessageSquare,
  Sparkles,
  Smartphone,
  Plus,
  Hash,
  Share,
  Linkedin,
  Instagram,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatFriendlyDate } from '../utils';

interface ShareModalProps {
  isOpen: boolean;
  activity: Activity | null;
  onClose: () => void;
  modalTitle?: string;
}

interface SocialNetwork {
  id: string;
  name: string;
  category: 'popular' | 'messaging' | 'social' | 'work' | 'other';
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  getShareUrl?: (text: string, url: string, title: string) => string;
  customAction?: (text: string, url: string, title: string) => void;
  instructions?: string;
}

export default function ShareModal({ isOpen, activity, onClose, modalTitle }: ShareModalProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomNetworkInput, setShowCustomNetworkInput] = useState(false);
  const [customNetworkName, setCustomNetworkName] = useState('');
  const [customNetworkSuccess, setCustomNetworkSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!activity) return null;

  const { title, date, notes, photos, place, author, tags } = activity;

  const shareUrl = window.location.href;

  // Formato de texto elegante
  const shareText = `📸 *ARCHIVO FOTOGRÁFICO IDAC* 📸\n\n*${title.toUpperCase()}*\n📍 *Ubicación:* ${place || 'Oficina Central / General'}\n📅 *Fecha:* ${formatFriendlyDate(date)}\n✍️ *Registrado por:* ${author || 'IDAC'}\n\n"${notes}"\n\n_Preservando la historia de la aviación civil dominicana._ 🇩🇴✈️`;

  const hashtagText = `#IDAC #AviacionDominicana #DominicanRepublic #HistorialFotografico #IDACRD ${tags ? tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ') : ''}`;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopiedText(true);
      triggerToast('¡Resumen completo copiado al portapapeles!');
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Error al copiar texto:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      triggerToast('¡Enlace directo copiado!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Error al copiar enlace:', err);
    }
  };

  const handleCopyHashtags = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${hashtagText}\n\nEnlace: ${shareUrl}`);
      setCopiedHashtags(true);
      triggerToast('¡Resumen con Hashtags copiado para Instagram/TikTok!');
      setTimeout(() => setCopiedHashtags(false), 2000);
    } catch (err) {
      console.error('Error al copiar hashtags:', err);
    }
  };

  // Compartir nativo del sistema
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `IDAC - ${title}`,
          text: shareText,
          url: shareUrl,
        });
        triggerToast('¡Compartido mediante el menú nativo!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error en Compartir Nativo:', err);
        }
      }
    } else {
      handleCopyText();
    }
  };

  // Definición completa de Redes Sociales populares y especializadas
  const socialNetworks: SocialNetwork[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      category: 'messaging',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-200',
      badgeBg: 'bg-emerald-600',
      badgeText: 'Mensajería',
      iconName: 'MessageCircle',
      getShareUrl: (text, url) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\nEnlace: ' + url)}`,
    },
    {
      id: 'whatsapp_business',
      name: 'WhatsApp Business',
      category: 'messaging',
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      borderColor: 'border-teal-200',
      badgeBg: 'bg-teal-700',
      badgeText: 'Negocios',
      iconName: 'MessageCircle',
      getShareUrl: (text, url) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\nEnlace oficial: ' + url)}`,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      category: 'social',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
      badgeBg: 'bg-blue-600',
      badgeText: 'Red Social',
      iconName: 'Facebook',
      getShareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    },
    {
      id: 'messenger',
      name: 'FB Messenger',
      category: 'messaging',
      color: 'text-sky-700',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      borderColor: 'border-sky-200',
      badgeBg: 'bg-sky-600',
      badgeText: 'Chat',
      iconName: 'MessageSquare',
      getShareUrl: (text, url) => `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(url)}`,
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      category: 'social',
      color: 'text-slate-900',
      bgColor: 'bg-slate-100 hover:bg-slate-200',
      borderColor: 'border-slate-300',
      badgeBg: 'bg-slate-900',
      badgeText: 'Noticias / X',
      iconName: 'Send',
      getShareUrl: (text, url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ' - Archivo Fotográfico IDAC')}&url=${encodeURIComponent(url)}`,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      category: 'messaging',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      borderColor: 'border-sky-200',
      badgeBg: 'bg-sky-500',
      badgeText: 'Canales / Chat',
      iconName: 'Send',
      getShareUrl: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
      id: 'instagram',
      name: 'Instagram (Post/Story)',
      category: 'social',
      color: 'text-pink-700',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      borderColor: 'border-pink-200',
      badgeBg: 'bg-pink-600',
      badgeText: 'Historias / Feed',
      iconName: 'Instagram',
      instructions: 'Copia el texto adaptado y abre Instagram para pegarlo en tu Historia o Publicación.',
      customAction: async (text, url) => {
        await navigator.clipboard.writeText(`${text}\n\nEnlace: ${url}\n\n#IDAC #AviacionDominicana`);
        triggerToast('¡Texto copiado para Instagram! Abre la App de Instagram para publicar.');
        window.open('https://www.instagram.com', '_blank');
      }
    },
    {
      id: 'threads',
      name: 'Threads',
      category: 'social',
      color: 'text-zinc-900',
      bgColor: 'bg-zinc-100 hover:bg-zinc-200',
      borderColor: 'border-zinc-300',
      badgeBg: 'bg-zinc-900',
      badgeText: 'Hilos',
      iconName: 'MessageSquare',
      getShareUrl: (text, url) => `https://www.threads.net/intent/post?text=${encodeURIComponent(text + '\n' + url)}`,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      category: 'work',
      color: 'text-blue-900',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-300',
      badgeBg: 'bg-blue-800',
      badgeText: 'Profesional',
      iconName: 'Linkedin',
      getShareUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      category: 'social',
      color: 'text-red-700',
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200',
      badgeBg: 'bg-red-600',
      badgeText: 'Tableros',
      iconName: 'Globe',
      getShareUrl: (text, url, title) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title + ' - ' + text)}`,
    },
    {
      id: 'reddit',
      name: 'Reddit',
      category: 'social',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      borderColor: 'border-orange-200',
      badgeBg: 'bg-orange-600',
      badgeText: 'Comunidad',
      iconName: 'Globe',
      getShareUrl: (text, url, title) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' - IDAC')}`,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      category: 'social',
      color: 'text-slate-900',
      bgColor: 'bg-slate-100 hover:bg-slate-200',
      borderColor: 'border-slate-300',
      badgeBg: 'bg-slate-900',
      badgeText: 'Videos',
      iconName: 'Globe',
      customAction: async (text, url) => {
        await navigator.clipboard.writeText(`${text}\n\n#IDAC #AviacionCivil #Dominicana\n${url}`);
        triggerToast('¡Resumen de TikTok copiado! Listo para el pie de foto de tu video.');
        window.open('https://www.tiktok.com', '_blank');
      }
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      category: 'social',
      color: 'text-amber-800',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      borderColor: 'border-amber-200',
      badgeBg: 'bg-amber-500',
      badgeText: 'Snaps',
      iconName: 'Globe',
      getShareUrl: (text, url) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    },
    {
      id: 'email',
      name: 'Correo Electrónico (Email)',
      category: 'messaging',
      color: 'text-indigo-800',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      borderColor: 'border-indigo-200',
      badgeBg: 'bg-indigo-700',
      badgeText: 'Email',
      iconName: 'Mail',
      getShareUrl: (text, url, title) => `mailto:?subject=${encodeURIComponent('Archivo IDAC: ' + title)}&body=${encodeURIComponent(text + '\n\nVer archivo completo en: ' + url)}`,
    },
    {
      id: 'sms',
      name: 'SMS / Mensaje de Texto',
      category: 'messaging',
      color: 'text-emerald-800',
      bgColor: 'bg-emerald-50/70 hover:bg-emerald-100',
      borderColor: 'border-emerald-200',
      badgeBg: 'bg-emerald-700',
      badgeText: 'Móvil',
      iconName: 'MessageSquare',
      getShareUrl: (text, url) => `sms:?body=${encodeURIComponent(text + ' - ' + url)}`,
    },
    {
      id: 'discord',
      name: 'Discord',
      category: 'messaging',
      color: 'text-indigo-900',
      bgColor: 'bg-indigo-100 hover:bg-indigo-200',
      borderColor: 'border-indigo-300',
      badgeBg: 'bg-indigo-800',
      badgeText: 'Servidores',
      iconName: 'MessageSquare',
      customAction: async (text, url) => {
        const discordFormatted = `**✈️ ARCHIVO FOTOGRÁFICO IDAC**\n> **${title}**\n> 📍 ${place || 'IDAC'}\n> 📅 ${formatFriendlyDate(date)}\n\n${notes}\n\n🔗 ${url}`;
        await navigator.clipboard.writeText(discordFormatted);
        triggerToast('¡Texto formateado para Discord copiado al portapapeles!');
      }
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'work',
      color: 'text-purple-900',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200',
      badgeBg: 'bg-purple-700',
      badgeText: 'Equipos',
      iconName: 'MessageSquare',
      getShareUrl: (text, url) => `https://slack.com/app_redirect?channel=general`,
      customAction: async (text, url) => {
        await navigator.clipboard.writeText(`*IDAC Archivo:* ${title}\n${url}\n> ${notes}`);
        triggerToast('¡Resumen para Slack copiado!');
      }
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      category: 'work',
      color: 'text-blue-900',
      bgColor: 'bg-blue-50/80 hover:bg-blue-100',
      borderColor: 'border-blue-300',
      badgeBg: 'bg-blue-800',
      badgeText: 'Corporativo',
      iconName: 'MessageSquare',
      getShareUrl: (text, url, title) => `https://teams.microsoft.com/share?href=${encodeURIComponent(url)}&text=${encodeURIComponent(title + '\n' + text)}`,
    },
    {
      id: 'signal',
      name: 'Signal',
      category: 'messaging',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
      badgeBg: 'bg-blue-600',
      badgeText: 'Seguro',
      iconName: 'MessageCircle',
      customAction: async (text, url) => {
        await navigator.clipboard.writeText(`${text}\n\nEnlace: ${url}`);
        triggerToast('¡Texto para Signal copiado!');
      }
    },
    {
      id: 'viber',
      name: 'Viber',
      category: 'messaging',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200',
      badgeBg: 'bg-purple-600',
      badgeText: 'Chat',
      iconName: 'MessageCircle',
      getShareUrl: (text, url) => `viber://forward?text=${encodeURIComponent(text + ' ' + url)}`,
    },
    {
      id: 'line',
      name: 'LINE',
      category: 'messaging',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-300',
      badgeBg: 'bg-emerald-600',
      badgeText: 'Chat Asia/Global',
      iconName: 'MessageCircle',
      getShareUrl: (text, url) => `https://line.me/R/msg/text/?${encodeURIComponent(text + '\n' + url)}`,
    },
    {
      id: 'wechat',
      name: 'WeChat',
      category: 'messaging',
      color: 'text-green-800',
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-300',
      badgeBg: 'bg-green-700',
      badgeText: 'Global / WeChat',
      iconName: 'MessageCircle',
      customAction: async (text, url) => {
        await navigator.clipboard.writeText(`${text}\n\nLink: ${url}`);
        triggerToast('¡Contenido para WeChat copiado!');
      }
    },
    {
      id: 'bluesky',
      name: 'Bluesky',
      category: 'social',
      color: 'text-sky-800',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      borderColor: 'border-sky-300',
      badgeBg: 'bg-sky-600',
      badgeText: 'Descentralizada',
      iconName: 'Globe',
      getShareUrl: (text, url, title) => `https://bsky.app/intent/compose?text=${encodeURIComponent(title + ' - ' + url)}`,
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      category: 'social',
      color: 'text-indigo-900',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      borderColor: 'border-indigo-300',
      badgeBg: 'bg-indigo-700',
      badgeText: 'Fediverso',
      iconName: 'Globe',
      getShareUrl: (text, url, title) => `https://mastodonshare.com/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
      id: 'tumblr',
      name: 'Tumblr',
      category: 'social',
      color: 'text-slate-800',
      bgColor: 'bg-slate-100 hover:bg-slate-200',
      borderColor: 'border-slate-300',
      badgeBg: 'bg-slate-800',
      badgeText: 'Blog',
      iconName: 'Globe',
      getShareUrl: (text, url, title) => `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(url)}&caption=${encodeURIComponent(title)}`,
    },
    {
      id: 'vk',
      name: 'VKontakte (VK)',
      category: 'social',
      color: 'text-blue-800',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-300',
      badgeBg: 'bg-blue-700',
      badgeText: 'Red Internacional',
      iconName: 'Globe',
      getShareUrl: (text, url, title) => `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
  ];

  // Filtrado de redes por categoría y búsqueda
  const filteredNetworks = socialNetworks.filter(net => {
    const matchesCategory = activeCategory === 'all' || net.category === activeCategory;
    const matchesSearch = net.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          net.badgeText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleShareToNetwork = (net: SocialNetwork) => {
    if (net.customAction) {
      net.customAction(shareText, shareUrl, title);
    } else if (net.getShareUrl) {
      const url = net.getShareUrl(shareText, shareUrl, title);
      window.open(url, '_blank', 'noopener,noreferrer');
      triggerToast(`Abriendo ${net.name}...`);
    }
  };

  // Manejador de red social no listada personalizada
  const handleCustomNetworkShare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customNetworkName.trim()) {
      triggerToast('Ingresa el nombre de la red social o aplicación');
      return;
    }

    const nameClean = customNetworkName.trim();
    const formattedMessage = `📸 *COMPARTIDO EN ${nameClean.toUpperCase()}* 📸\n\n${shareText}\n\nEnlace: ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCustomNetworkSuccess(true);
      triggerToast(`¡Texto adaptado para ${nameClean} copiado al portapapeles!`);

      // Intentar abrir mediante el menú nativo o web
      if (navigator.share) {
        navigator.share({
          title: `${title} - Compartido en ${nameClean}`,
          text: formattedMessage,
          url: shareUrl,
        }).catch(() => {});
      }

      setTimeout(() => setCustomNetworkSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper de icono Lucide según el nombre
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageCircle': return <MessageCircle className="w-5 h-5" />;
      case 'Facebook': return <Facebook className="w-5 h-5" />;
      case 'Send': return <Send className="w-5 h-5" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5" />;
      case 'Linkedin': return <Linkedin className="w-5 h-5" />;
      case 'Instagram': return <Instagram className="w-5 h-5" />;
      case 'Mail': return <Mail className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop con desenfoque elegante */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border-4 border-idac-blue overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Cabecera del Modal con Colores Institucionales IDAC */}
            <div className="bg-[#00316f] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b-4 border-[#b81d24]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Share2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <span>{modalTitle || '📢 Compartir en Redes Sociales'}</span>
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                    Todas las Redes Sociales Populares + Aplicaciones No Listadas
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notificación Flotante Toast Interna */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-600 text-white px-4 py-2 text-xs font-black uppercase tracking-wider text-center shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Contenido Desplazable del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">

              {/* OPCIÓN PRINCIPAL 1: BOTÓN DE MENÚ NATIVO DEL SISTEMA */}
              <div className="bg-gradient-to-r from-idac-blue to-idac-dark p-4 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/15 rounded-2xl shrink-0">
                    <Smartphone className="w-6 h-6 text-emerald-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">
                      📱 Compartir con Menú Nativo del Dispositivo
                    </h4>
                    <p className="text-[10px] text-blue-100 font-medium">
                      Abre el menú oficial de tu celular o computadora para enviar a cualquier app instalada (Signal, WeChat, Viber, Bluetooth, AirDrop, etc.).
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNativeShare}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <Share className="w-4 h-4" />
                  <span>Abrir Menú del Sistema</span>
                </button>
              </div>

              {/* VISTA PREVIA CORTA DEL RECUERDO */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                {photos && photos.length > 0 && (
                  <div className="w-full sm:w-24 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    <img src={photos[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase text-idac-red tracking-wider">
                      📍 {place || 'IDAC Central'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      {formatFriendlyDate(date)}
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-idac-blue truncate uppercase mt-0.5">
                    {title}
                  </h5>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic mt-1">
                    "{notes}"
                  </p>
                </div>
              </div>

              {/* BUSCADOR DE REDES Y FILTROS POR CATEGORÍA */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-idac-blue" />
                    <span>Selecciona una Red Social o Aplicación:</span>
                  </span>

                  {/* Campo de búsqueda */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar red social..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-idac-blue"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtros por Categoría */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
                  {[
                    { id: 'all', label: 'Todas las Redes' },
                    { id: 'messaging', label: '💬 Mensajería y Chat' },
                    { id: 'social', label: '🌐 Redes Populares' },
                    { id: 'work', label: '💼 Trabajo y Trabajo Pro' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-idac-blue text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GRILLA DE REDES SOCIALES Y APLICACIONES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredNetworks.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => handleShareToNetwork(net)}
                    className={`flex flex-col items-start justify-between p-3 rounded-2xl border ${net.bgColor} ${net.borderColor} transition-all duration-200 group text-left cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.02] active:scale-98`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`${net.color} group-hover:scale-110 transition-transform`}>
                        {renderIcon(net.iconName)}
                      </div>
                      <span className={`text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-md ${net.badgeBg}`}>
                        {net.badgeText}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate w-full">
                      {net.name}
                    </span>
                  </button>
                ))}
              </div>

              {filteredNetworks.length === 0 && (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                  <Globe className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">
                    No se encontraron redes listadas con "{searchQuery}".
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Puedes usar la opción de "Otras Redes No Listadas" a continuación.
                  </p>
                </div>
              )}

              {/* SECCIÓN ESPECIAL: OTRAS REDES NO LISTADAS O PERSONALIZADAS */}
              <div className="border-2 border-dashed border-idac-blue/30 bg-blue-50/30 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-idac-blue" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-idac-blue">
                      Otras Redes Sociales No Listadas
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowCustomNetworkInput(!showCustomNetworkInput)}
                    className="text-[10px] font-black text-idac-blue uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showCustomNetworkInput ? 'Ocultar Campo' : 'Ingresar Red Especial'}</span>
                    {showCustomNetworkInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[10px] text-slate-600 leading-normal">
                  ¿Quieres compartir en una red social o plataforma que no aparece en la lista anterior (ej. BeReal, Medium, Substack, Rumble, Kuaishou, etc.)? Ingresa su nombre y se formateará el mensaje listo para enviar.
                </p>

                {showCustomNetworkInput && (
                  <form onSubmit={handleCustomNetworkShare} className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={customNetworkName}
                      onChange={(e) => setCustomNetworkName(e.target.value)}
                      placeholder="Ej. BeReal, Medium, Substack, Gettr, Twitch..."
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-idac-blue"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-idac-blue hover:bg-idac-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{customNetworkSuccess ? '¡Texto Adaptado Copiado!' : 'Copiar para esta Red'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* HERRAMIENTAS DIRECTAS DE PORTAPAPELES */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                  Herramientas y Portapapeles
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Copiar Resumen Completo */}
                  <button
                    onClick={handleCopyText}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      copiedText
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 hover:border-idac-blue text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {copiedText ? '¡Resumen Copiado!' : 'Copiar Resumen'}
                      </span>
                    </div>
                  </button>

                  {/* Copiar Enlace Directo */}
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 hover:border-idac-blue text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4 text-slate-400" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                      </span>
                    </div>
                  </button>

                  {/* Copiar Hashtags y Texto para Instagram/TikTok */}
                  <button
                    onClick={handleCopyHashtags}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      copiedHashtags
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 hover:border-idac-blue text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {copiedHashtags ? <Check className="w-4 h-4 text-emerald-600" /> : <Hash className="w-4 h-4 text-slate-400" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {copiedHashtags ? '¡Con Hashtags Copiado!' : 'Texto con Hashtags'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0">
              <span>Instituto Dominicano de Aviación Civil (IDAC)</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
