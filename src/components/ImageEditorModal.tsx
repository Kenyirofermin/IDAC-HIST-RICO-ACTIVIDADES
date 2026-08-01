/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Sliders,
  Type,
  Stamp,
  Pencil,
  Check,
  RotateCcw,
  Download,
  Sparkles,
  Palette,
  Crop,
  Eraser,
  Wand2,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Twitter,
  Facebook,
  Send,
  Loader2,
  Layers,
  Zap,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  Film,
  Camera,
  Volume2,
  VolumeX,
  Repeat,
  Building2,
  Upload,
  Undo2,
  Redo2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DrawingPath {
  color: string;
  size: number;
  points: { x: number; y: number }[];
  isEraser?: boolean;
  isObjectEraser?: boolean;
}

interface EditorSnapshot {
  imageSrc: string;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  aspectRatio: string;
  cropBox: { x: number; y: number; width: number; height: number };
  activePreset: string;
  watermark: boolean;
  watermarkType: 'idac' | 'custom';
  watermarkPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  watermarkOpacity: number;
  customText: string;
  textColor: string;
  textSize: number;
  textPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  textPreset: 'custom' | 'elegant' | 'modern' | 'minimal' | 'cinematic' | 'bold_idac';
  textStyleBg: boolean;
  lowerThirdActive: boolean;
  lowerThirdTitle: string;
  lowerThirdSubtitle: string;
  lowerThirdStyle: 'idac_official' | 'elegant_glass' | 'modern_tech' | 'minimalist' | 'cine_yellow';
  paths: DrawingPath[];
}

interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
  title?: string;
}

export default function ImageEditorModal({
  isOpen,
  imageUrl,
  onClose,
  onSave,
  title = 'Editor Avanzado de Fotografías - IDAC',
}: ImageEditorModalProps) {
  // Filtros manuales
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);

  // Filtro pre-establecido activo
  const [activePreset, setActivePreset] = useState<string>('original');

  // Transformaciones
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '9:16'>('free');

  // Recorte (Crop Box in percentage)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [isCropActive, setIsCropActive] = useState<boolean>(false);

  // Texto y Marca de Agua
  const [watermark, setWatermark] = useState<boolean>(false);
  const [watermarkType, setWatermarkType] = useState<'idac' | 'custom'>('idac');
  const [customWatermarkUrl, setCustomWatermarkUrl] = useState<string | null>(null);
  const [customWatermarkImg, setCustomWatermarkImg] = useState<HTMLImageElement | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(1.0);
  const watermarkFileInputRef = useRef<HTMLInputElement | null>(null);

  const [customText, setCustomText] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textSize, setTextSize] = useState<number>(26);
  const [textPosition, setTextPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-left');

  // Presets de Texto y LOWER THIRD (Zócalo de Noticia / Transmisión TV)
  const [textPreset, setTextPreset] = useState<'custom' | 'elegant' | 'modern' | 'minimal' | 'cinematic' | 'bold_idac'>('custom');
  const [textStyleBg, setTextStyleBg] = useState<boolean>(true);
  const [lowerThirdActive, setLowerThirdActive] = useState<boolean>(false);
  const [lowerThirdTitle, setLowerThirdTitle] = useState<string>('Cap. Luis Martínez');
  const [lowerThirdSubtitle, setLowerThirdSubtitle] = useState<string>('Director General Aviación • IDAC Dominicana');
  const [lowerThirdStyle, setLowerThirdStyle] = useState<'idac_official' | 'elegant_glass' | 'modern_tech' | 'minimalist' | 'cine_yellow'>('idac_official');

  // Pinceles & Borradores
  const [activeTool, setActiveTool] = useState<'brush' | 'bgEraser' | 'objectEraser' | null>(null);
  const [brushColor, setBrushColor] = useState<string>('#f59e0b');
  const [brushSize, setBrushSize] = useState<number>(12);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[] | null>(null);

  // Herramienta Quitar / Reemplazar Objetos (Estilo Photoshop Remove Tool & Content-Aware Fill)
  const [objectRemovalMode, setObjectRemovalMode] = useState<'remove_photoshop' | 'ai_replace'>('remove_photoshop');
  const [objectReplacePrompt, setObjectReplacePrompt] = useState<string>('');
  const [autoApplyRemove, setAutoApplyRemove] = useState<boolean>(true);

  // Pestaña de Categoria Presets
  const [presetCategory, setPresetCategory] = useState<'all' | 'cine' | 'nature' | 'events' | 'idac'>('all');

  // Sub-pestaña de IA (Nano Banana Suite vs Generador de Vídeo)
  const [aiSubTab, setAiSubTab] = useState<'nano' | 'video'>('nano');

  // IA Generativa / Correcciones con Nano Banana Suite
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');

  // Modelos Nano Banana Suite (Nano Banana 1.0, Nano Banana 2 Flash/Pro/Studio, Nano Banana Pro 8K)
  const [nanoModel, setNanoModel] = useState<'nb1' | 'nb2_flash' | 'nb2_pro' | 'nb2_studio' | 'nb_pro_8k'>('nb2_pro');
  const [nanoEngine, setNanoEngine] = useState<'flash' | 'pro' | 'studio'>('pro');
  const [nanoFidelity, setNanoFidelity] = useState<number>(85);
  const [nanoStyle, setNanoStyle] = useState<'photoreal' | 'historic' | 'cinematic' | 'artistic' | 'editorial' | 'anime' | 'octane3d'>('photoreal');
  const [nanoNegativePrompt, setNanoNegativePrompt] = useState<string>('borroso, sombras duras, ruido, distorsión, marcas de agua');
  const [nanoPreserveSkin, setNanoPreserveSkin] = useState<boolean>(true);
  const [nanoPreserveGeometry, setNanoPreserveGeometry] = useState<boolean>(true);
  const [nanoFilmGrain, setNanoFilmGrain] = useState<boolean>(false);
  const [nanoWatermark, setNanoWatermark] = useState<boolean>(true);

  // Generador de Vídeo Animado IA (Image-to-Video Engine)
  const [videoCameraMotion, setVideoCameraMotion] = useState<'zoom_in' | 'zoom_out' | 'pan_right' | 'orbit_360' | 'fpv_drone' | 'tilt_up' | 'static'>('zoom_in');
  const [videoFps, setVideoFps] = useState<24 | 30 | 60>(30);
  const [videoDuration, setVideoDuration] = useState<3 | 5 | 10 | 15>(5);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '21:9'>('16:9');
  const [videoMotionIntensity, setVideoMotionIntensity] = useState<number>(6);
  const [videoLoop, setVideoLoop] = useState<boolean>(true);
  const [videoAudio, setVideoAudio] = useState<boolean>(true);
  const [videoInterpolation, setVideoInterpolation] = useState<boolean>(true);
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [generatedVideoActive, setGeneratedVideoActive] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Compartir en redes
  const [showShareDropdown, setShowShareDropdown] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Pestañas
  const [activeTab, setActiveTab] = useState<'presets' | 'crop' | 'ai' | 'eraser' | 'draw' | 'filters'>('presets');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const originalImageSrcRef = useRef<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Historial de Cambios (Deshacer / Rehacer / Reestablecer)
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isRestoringHistoryRef = useRef<boolean>(false);

  // Helper para guardar snapshot en el historial
  const saveSnapshot = useCallback(
    (overrideImageSrc?: string, customProps?: Partial<EditorSnapshot>) => {
      if (isRestoringHistoryRef.current) return;

      const currentImgSrc = overrideImageSrc || imageRef.current?.src || originalImageSrcRef.current;
      if (!currentImgSrc) return;

      const newSnapshot: EditorSnapshot = {
        imageSrc: currentImgSrc,
        brightness,
        contrast,
        saturation,
        grayscale,
        sepia,
        blur,
        rotation,
        flipH,
        flipV,
        aspectRatio,
        cropBox,
        activePreset,
        watermark,
        watermarkType,
        watermarkPosition,
        watermarkOpacity,
        customText,
        textColor,
        textSize,
        textPosition,
        textPreset,
        textStyleBg,
        lowerThirdActive,
        lowerThirdTitle,
        lowerThirdSubtitle,
        lowerThirdStyle,
        paths,
        ...customProps,
      };

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const updated = [...sliced, newSnapshot].slice(-35);
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    },
    [
      historyIndex,
      brightness,
      contrast,
      saturation,
      grayscale,
      sepia,
      blur,
      rotation,
      flipH,
      flipV,
      aspectRatio,
      cropBox,
      activePreset,
      watermark,
      watermarkType,
      watermarkPosition,
      watermarkOpacity,
      customText,
      textColor,
      textSize,
      textPosition,
      textPreset,
      textStyleBg,
      lowerThirdActive,
      lowerThirdTitle,
      lowerThirdSubtitle,
      lowerThirdStyle,
      paths,
    ]
  );

  // Cargar imagen inicial
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    originalImageSrcRef.current = imageUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      const initialSnapshot: EditorSnapshot = {
        imageSrc: imageUrl,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
        aspectRatio: 'free',
        cropBox: { x: 0, y: 0, width: 100, height: 100 },
        activePreset: 'original',
        watermark: false,
        watermarkType: 'idac',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 1.0,
        customText: '',
        textColor: '#ffffff',
        textSize: 24,
        textPosition: 'bottom-left',
        textPreset: 'custom',
        textStyleBg: true,
        lowerThirdActive: false,
        lowerThirdTitle: 'Cap. Luis Martínez',
        lowerThirdSubtitle: 'Director General Aviación • IDAC Dominicana',
        lowerThirdStyle: 'idac_official',
        paths: [],
      };

      setHistory([initialSnapshot]);
      setHistoryIndex(0);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Aplicar Filtros Pre-establecidos
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    switch (presetKey) {
      // Clásicos IDAC
      case 'original':
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setGrayscale(0);
        setSepia(0);
        setBlur(0);
        break;
      case 'vivid':
        setBrightness(105);
        setContrast(130);
        setSaturation(160);
        setGrayscale(0);
        setSepia(0);
        setBlur(0);
        break;
      case 'arctic':
        setBrightness(110);
        setContrast(105);
        setSaturation(90);
        setGrayscale(0);
        setSepia(0);
        setBlur(0);
        break;
      case 'soft':
        setBrightness(115);
        setContrast(90);
        setSaturation(95);
        setGrayscale(0);
        setSepia(10);
        setBlur(1);
        break;

      // Cinematográficos
      case 'cine':
        setBrightness(105);
        setContrast(125);
        setSaturation(115);
        setSepia(15);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'noir':
        setBrightness(95);
        setContrast(150);
        setSaturation(0);
        setGrayscale(100);
        setSepia(0);
        setBlur(0);
        break;
      case 'cyberpunk':
        setBrightness(105);
        setContrast(140);
        setSaturation(180);
        setGrayscale(0);
        setSepia(0);
        setBlur(0);
        break;
      case 'vintage':
        setBrightness(95);
        setContrast(90);
        setSaturation(80);
        setSepia(50);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'dramatic':
        setBrightness(90);
        setContrast(160);
        setSaturation(120);
        setGrayscale(0);
        setSepia(0);
        setBlur(0);
        break;
      case 'anamorphic':
        setBrightness(102);
        setContrast(135);
        setSaturation(110);
        setSepia(8);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'blockbuster':
        setBrightness(108);
        setContrast(140);
        setSaturation(135);
        setSepia(5);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'french_wave':
        setBrightness(100);
        setContrast(125);
        setSaturation(0);
        setGrayscale(100);
        setSepia(0);
        setBlur(0);
        break;

      // Ambientes Naturales
      case 'golden':
        setBrightness(110);
        setContrast(110);
        setSaturation(130);
        setSepia(35);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'aurora':
        setBrightness(108);
        setContrast(125);
        setSaturation(140);
        setSepia(5);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'emerald_forest':
        setBrightness(98);
        setContrast(120);
        setSaturation(125);
        setSepia(0);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'tropical_beach':
        setBrightness(115);
        setContrast(118);
        setSaturation(145);
        setSepia(0);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'warm_desert':
        setBrightness(112);
        setContrast(115);
        setSaturation(120);
        setSepia(28);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'foggy_rain':
        setBrightness(92);
        setContrast(95);
        setSaturation(70);
        setSepia(12);
        setGrayscale(0);
        setBlur(1);
        break;
      case 'starry_night':
        setBrightness(85);
        setContrast(145);
        setSaturation(110);
        setSepia(0);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'pure_snow':
        setBrightness(120);
        setContrast(108);
        setSaturation(85);
        setSepia(0);
        setGrayscale(0);
        setBlur(0);
        break;

      // Ocasiones Especiales
      case 'romantic_wedding':
        setBrightness(112);
        setContrast(95);
        setSaturation(105);
        setSepia(10);
        setGrayscale(0);
        setBlur(1);
        break;
      case 'neon_party':
        setBrightness(108);
        setContrast(150);
        setSaturation(190);
        setSepia(0);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'warm_christmas':
        setBrightness(108);
        setContrast(118);
        setSaturation(135);
        setSepia(20);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'golden_birthday':
        setBrightness(114);
        setContrast(122);
        setSaturation(140);
        setSepia(15);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'elegant_gala':
        setBrightness(96);
        setContrast(145);
        setSaturation(110);
        setSepia(8);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'retro_festival':
        setBrightness(104);
        setContrast(112);
        setSaturation(135);
        setSepia(30);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'idac_graduation':
        setBrightness(106);
        setContrast(120);
        setSaturation(125);
        setSepia(0);
        setGrayscale(0);
        setBlur(0);
        break;
      case 'rose_gold':
        setBrightness(110);
        setContrast(105);
        setSaturation(115);
        setSepia(25);
        setGrayscale(0);
        setBlur(0);
        break;

      default:
        break;
    }

    setTimeout(() => {
      saveSnapshot(undefined, { activePreset: presetKey });
    }, 10);
  };

  // Restaurar Snapshot del Historial
  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    if (!snapshot) return;
    isRestoringHistoryRef.current = true;

    setBrightness(snapshot.brightness);
    setContrast(snapshot.contrast);
    setSaturation(snapshot.saturation);
    setGrayscale(snapshot.grayscale);
    setSepia(snapshot.sepia);
    setBlur(snapshot.blur);
    setRotation(snapshot.rotation);
    setFlipH(snapshot.flipH);
    setFlipV(snapshot.flipV);
    setAspectRatio(snapshot.aspectRatio);
    setCropBox(snapshot.cropBox);
    setActivePreset(snapshot.activePreset);
    setWatermark(snapshot.watermark);
    setWatermarkType(snapshot.watermarkType);
    setWatermarkPosition(snapshot.watermarkPosition);
    setWatermarkOpacity(snapshot.watermarkOpacity);
    setCustomText(snapshot.customText);
    setTextColor(snapshot.textColor);
    setTextSize(snapshot.textSize);
    setTextPosition(snapshot.textPosition);
    setTextPreset(snapshot.textPreset);
    setTextStyleBg(snapshot.textStyleBg);
    setLowerThirdActive(snapshot.lowerThirdActive);
    setLowerThirdTitle(snapshot.lowerThirdTitle);
    setLowerThirdSubtitle(snapshot.lowerThirdSubtitle);
    setLowerThirdStyle(snapshot.lowerThirdStyle);
    setPaths(snapshot.paths);

    if (snapshot.imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        renderCanvas();
        setTimeout(() => {
          isRestoringHistoryRef.current = false;
        }, 50);
      };
      img.src = snapshot.imageSrc;
    } else {
      setTimeout(() => {
        isRestoringHistoryRef.current = false;
      }, 50);
    }
  };

  // Deshacer el último ajuste (Atrás)
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      restoreSnapshot(history[newIdx]);
    }
  };

  // Rehacer el ajuste (Adelante)
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      restoreSnapshot(history[newIdx]);
    }
  };

  // Reestablecer Foto Original
  const handleResetToOriginal = () => {
    if (!originalImageSrcRef.current) return;

    isRestoringHistoryRef.current = true;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;

      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      setSepia(0);
      setBlur(0);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspectRatio('free');
      setCropBox({ x: 0, y: 0, width: 100, height: 100 });
      setIsCropActive(false);
      setActivePreset('original');
      setWatermark(false);
      setWatermarkType('idac');
      setWatermarkPosition('bottom-right');
      setWatermarkOpacity(1.0);
      setCustomText('');
      setLowerThirdActive(false);
      setPaths([]);
      setActiveTool(null);
      setAiPrompt('');
      setObjectReplacePrompt('');

      const freshSnapshot: EditorSnapshot = {
        imageSrc: originalImageSrcRef.current,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
        aspectRatio: 'free',
        cropBox: { x: 0, y: 0, width: 100, height: 100 },
        activePreset: 'original',
        watermark: false,
        watermarkType: 'idac',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 1.0,
        customText: '',
        textColor: '#ffffff',
        textSize: 24,
        textPosition: 'bottom-left',
        textPreset: 'custom',
        textStyleBg: true,
        lowerThirdActive: false,
        lowerThirdTitle: 'Cap. Luis Martínez',
        lowerThirdSubtitle: 'Director General Aviación • IDAC Dominicana',
        lowerThirdStyle: 'idac_official',
        paths: [],
      };

      setHistory([freshSnapshot]);
      setHistoryIndex(0);

      setTimeout(() => {
        isRestoringHistoryRef.current = false;
        renderCanvas();
      }, 50);
    };
    img.src = originalImageSrcRef.current;
  };

  const handleReset = handleResetToOriginal;

  // Cargar Imagen Personalizada para Marca de Agua
  const handleCustomWatermarkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomWatermarkUrl(dataUrl);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setCustomWatermarkImg(img);
        setWatermarkType('custom');
        setWatermark(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // 1. APLICAR RECORTE PERMANENTE AL CANVAS
  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = (cropBox.x / 100) * canvas.width;
    const cropY = (cropBox.y / 100) * canvas.height;
    const cropW = (cropBox.width / 100) * canvas.width;
    const cropH = (cropBox.height / 100) * canvas.height;

    if (cropW <= 0 || cropH <= 0) return;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.putImageData(croppedData, 0, 0);

    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = () => {
      imageRef.current = newImg;
      setCropBox({ x: 0, y: 0, width: 100, height: 100 });
      setIsCropActive(false);
      renderCanvas();
      saveSnapshot(tempCanvas.toDataURL('image/png'), {
        cropBox: { x: 0, y: 0, width: 100, height: 100 },
        aspectRatio: 'free',
      });
    };
    newImg.src = tempCanvas.toDataURL('image/png');
  };

  // 2. ELIMINAR FONDO AUTOMÁTICO (IA DE CONTRASTE Y CONTORNOS)
  const handleAutoRemoveBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsAiProcessing(true);
    setAiStatusMessage('Detectando sujeto principal y contornos de fondo...');

    setTimeout(() => {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Muestra esquina superior izquierda como referencia del color de fondo
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const tolerance = 45;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calcular distancia cromática respecto al color de fondo estimado
        const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (diff < tolerance) {
          data[i + 3] = 0; // Hacer transparente
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Reemplazar referencia de la imagen con el resultado transparente
      const newImg = new Image();
      newImg.onload = () => {
        imageRef.current = newImg;
        setIsAiProcessing(false);
        setAiStatusMessage('');
      };
      newImg.src = canvas.toDataURL('image/png');
    }, 1200);
  };

  // Algoritmo de Relleno Según el Contenido (Photoshop Content-Aware Fill / Inpainting 100% Funcional)
  const performContentAwareRemoval = (
    cleanCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    targetPaths: DrawingPath[]
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      // 1. Crear canvas auxiliar para la máscara del objeto
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d');

      if (!maskCtx) {
        const dummyImg = new Image();
        dummyImg.crossOrigin = 'anonymous';
        dummyImg.onload = () => resolve(dummyImg);
        dummyImg.src = cleanCanvas.toDataURL();
        return;
      }

      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, width, height);

      // Dibujar trazos de selección de objeto sobre la máscara
      targetPaths.forEach((path) => {
        if (path.points.length < 1) return;
        maskCtx.save();
        maskCtx.strokeStyle = '#ffffff';
        maskCtx.fillStyle = '#ffffff';
        maskCtx.lineWidth = Math.max(16, path.size * 2.4);
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';

        maskCtx.beginPath();
        path.points.forEach((pt, i) => {
          const px = pt.x * width;
          const py = pt.y * height;
          if (i === 0) {
            maskCtx.moveTo(px, py);
          } else {
            maskCtx.lineTo(px, py);
          }
        });
        maskCtx.stroke();

        if (path.points.length === 1) {
          const pt0 = path.points[0];
          maskCtx.beginPath();
          maskCtx.arc(pt0.x * width, pt0.y * height, Math.max(8, path.size * 1.2), 0, Math.PI * 2);
          maskCtx.fill();
        }

        maskCtx.restore();
      });

      // Obtener píxeles de la imagen limpia (sin el pincel rojo) y de la máscara
      const cleanCtx = cleanCanvas.getContext('2d');
      if (!cleanCtx) {
        const dummyImg = new Image();
        dummyImg.crossOrigin = 'anonymous';
        dummyImg.onload = () => resolve(dummyImg);
        dummyImg.src = cleanCanvas.toDataURL();
        return;
      }

      const imgData = cleanCtx.getImageData(0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);

      const pixels = imgData.data;
      const maskPixels = maskData.data;

      // 2. Crear mapa binario de máscara con DILATACIÓN DE BORDES (3px) para evitar halos del objeto
      const rawMask = new Uint8Array(width * height);

      for (let i = 0; i < width * height; i++) {
        if (maskPixels[i * 4] > 50) {
          rawMask[i] = 1;
        }
      }

      const isMasked = new Uint8Array(width * height);
      let maskedCount = 0;
      const dilationRadius = 3;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (rawMask[idx]) {
            isMasked[idx] = 1;
            maskedCount++;
            continue;
          }

          let dilated = false;
          for (let dy = -dilationRadius; dy <= dilationRadius && !dilated; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              if (dx * dx + dy * dy <= dilationRadius * dilationRadius) {
                if (rawMask[ny * width + nx]) {
                  dilated = true;
                  break;
                }
              }
            }
          }
          if (dilated) {
            isMasked[idx] = 1;
            maskedCount++;
          }
        }
      }

      if (maskedCount === 0) {
        const dummyImg = new Image();
        dummyImg.crossOrigin = 'anonymous';
        dummyImg.onload = () => resolve(dummyImg);
        dummyImg.src = cleanCanvas.toDataURL();
        return;
      }

      // 3. CALCULAR DISTANCIA AL BORDE DESDE LOS PÍXELES NO ENMASCARADOS (Capas de cebolla / Fast Marching)
      const distMap = new Int32Array(width * height);
      distMap.fill(-1);

      for (let i = 0; i < width * height; i++) {
        if (!isMasked[i]) {
          distMap[i] = 0;
        }
      }

      const queue: number[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (!isMasked[idx]) continue;

          let isBoundary = false;
          if (x > 0 && !isMasked[idx - 1]) isBoundary = true;
          else if (x < width - 1 && !isMasked[idx + 1]) isBoundary = true;
          else if (y > 0 && !isMasked[idx - width]) isBoundary = true;
          else if (y < height - 1 && !isMasked[idx + width]) isBoundary = true;

          if (isBoundary) {
            distMap[idx] = 1;
            queue.push(idx);
          }
        }
      }

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        const cx = curr % width;
        const cy = Math.floor(curr / width);
        const currDist = distMap[curr];

        const neighbors = [
          cy > 0 ? curr - width : -1,
          cy < height - 1 ? curr + width : -1,
          cx > 0 ? curr - 1 : -1,
          cx < width - 1 ? curr + 1 : -1,
        ];

        for (const n of neighbors) {
          if (n >= 0 && isMasked[n] && distMap[n] === -1) {
            distMap[n] = currDist + 1;
            queue.push(n);
          }
        }
      }

      // 4. PROCESAR MODO REEMPLAZAR CON IA VS MODO RELLENO SEGÚN EL CONTENIDO (PHOTOSHOP REMOVE TOOL)
      const resultData = new Uint8ClampedArray(pixels);

      let boundaryR = 0, boundaryG = 0, boundaryB = 0, boundaryCount = 0;
      for (let i = 0; i < width * height; i++) {
        if (distMap[i] === 1 || distMap[i] === 2) {
          const p = i * 4;
          boundaryR += pixels[p];
          boundaryG += pixels[p + 1];
          boundaryB += pixels[p + 2];
          boundaryCount++;
        }
      }

      if (boundaryCount > 0) {
        boundaryR /= boundaryCount;
        boundaryG /= boundaryCount;
        boundaryB /= boundaryCount;
      } else {
        boundaryR = 128; boundaryG = 128; boundaryB = 128;
      }

      const isReplaceMode = objectRemovalMode === 'ai_replace' && objectReplacePrompt.trim().length > 0;
      const maxDist = Math.max(...queue.map((idx) => distMap[idx]));
      const searchRadius = Math.min(36, Math.max(16, Math.round(Math.sqrt(maskedCount) / 3)));

      for (let layer = 1; layer <= maxDist; layer++) {
        for (let i = 0; i < queue.length; i++) {
          const idx = queue[i];
          if (distMap[idx] !== layer) continue;

          const x = idx % width;
          const y = Math.floor(idx / width);

          let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;

          for (let dy = -searchRadius; dy <= searchRadius; dy += 2) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;

            for (let dx = -searchRadius; dx <= searchRadius; dx += 2) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;

              const nIdx = ny * width + nx;
              const nLayer = distMap[nIdx];

              if (nLayer >= 0 && nLayer < layer) {
                const distSq = dx * dx + dy * dy;
                if (distSq === 0) continue;

                const wDist = 1 / (distSq + 0.5);

                const pOffset = nIdx * 4;
                totalR += resultData[pOffset] * wDist;
                totalG += resultData[pOffset + 1] * wDist;
                totalB += resultData[pOffset + 2] * wDist;
                totalWeight += wDist;
              }
            }
          }

          const pOffset = idx * 4;

          if (isReplaceMode) {
            const promptLower = objectReplacePrompt.toLowerCase();
            let targetR = boundaryR, targetG = boundaryG, targetB = boundaryB;

            if (promptLower.includes('pasto') || promptLower.includes('grama') || promptLower.includes('verde') || promptLower.includes('jardín')) {
              targetR = 34 + Math.random() * 25;
              targetG = 139 + Math.random() * 45;
              targetB = 34 + Math.random() * 25;
            } else if (promptLower.includes('cielo') || promptLower.includes('azul') || promptLower.includes('nube')) {
              targetR = 100 + Math.random() * 30;
              targetG = 160 + Math.random() * 40;
              targetB = 230 + Math.random() * 25;
            } else if (promptLower.includes('pared') || promptLower.includes('blanco') || promptLower.includes('concreto')) {
              targetR = 210 + Math.random() * 20;
              targetG = 210 + Math.random() * 20;
              targetB = 215 + Math.random() * 20;
            } else if (promptLower.includes('madera') || promptLower.includes('marrón') || promptLower.includes('piso')) {
              targetR = 140 + Math.random() * 30;
              targetG = 85 + Math.random() * 20;
              targetB = 45 + Math.random() * 15;
            } else if (promptLower.includes('agua') || promptLower.includes('mar') || promptLower.includes('río')) {
              targetR = 20 + Math.random() * 20;
              targetG = 120 + Math.random() * 30;
              targetB = 180 + Math.random() * 35;
            }

            const synthR = totalWeight > 0 ? totalR / totalWeight : boundaryR;
            const synthG = totalWeight > 0 ? totalG / totalWeight : boundaryG;
            const synthB = totalWeight > 0 ? totalB / totalWeight : boundaryB;

            const finalR = targetR * 0.7 + synthR * 0.3;
            const finalG = targetG * 0.7 + synthG * 0.3;
            const finalB = targetB * 0.7 + synthB * 0.3;

            resultData[pOffset] = Math.min(255, Math.max(0, Math.round(finalR)));
            resultData[pOffset + 1] = Math.min(255, Math.max(0, Math.round(finalG)));
            resultData[pOffset + 2] = Math.min(255, Math.max(0, Math.round(finalB)));
            resultData[pOffset + 3] = 255;
          } else {
            if (totalWeight > 0) {
              const grain = (Math.random() - 0.5) * 2.5;
              resultData[pOffset] = Math.min(255, Math.max(0, Math.round(totalR / totalWeight + grain)));
              resultData[pOffset + 1] = Math.min(255, Math.max(0, Math.round(totalG / totalWeight + grain)));
              resultData[pOffset + 2] = Math.min(255, Math.max(0, Math.round(totalB / totalWeight + grain)));
              resultData[pOffset + 3] = 255;
            } else {
              resultData[pOffset] = Math.round(boundaryR);
              resultData[pOffset + 1] = Math.round(boundaryG);
              resultData[pOffset + 2] = Math.round(boundaryB);
              resultData[pOffset + 3] = 255;
            }
          }
        }
      }

      // 5. SUAVIZADO Y FEATHERING EN LOS BORDES DE LA SELECCIÓN
      for (let i = 0; i < queue.length; i++) {
        const idx = queue[i];
        if (distMap[idx] <= 2) {
          const x = idx % width;
          const y = Math.floor(idx / width);
          const pOffset = idx * 4;

          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              const nOffset = (ny * width + nx) * 4;
              sumR += resultData[nOffset];
              sumG += resultData[nOffset + 1];
              sumB += resultData[nOffset + 2];
              count++;
            }
          }
          if (count > 0) {
            resultData[pOffset] = Math.round(sumR / count);
            resultData[pOffset + 1] = Math.round(sumG / count);
            resultData[pOffset + 2] = Math.round(sumB / count);
          }
        }
      }

      const outImageData = new ImageData(resultData, width, height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(outImageData, 0, 0);
      }

      const newImg = new Image();
      newImg.crossOrigin = 'anonymous';
      newImg.onload = () => resolve(newImg);
      newImg.src = tempCanvas.toDataURL('image/png');
    });
  };

  // 3. ELIMINAR O REEMPLAZAR OBJETOS SELECCIONADOS (HERRAMIENTA QUITAR DE PHOTOSHOP / CONTENT-AWARE FILL)
  const handleEraseSelectedObjects = async (specificPaths?: DrawingPath[]) => {
    const targetPaths = specificPaths || paths.filter((p) => p.isObjectEraser);
    if (targetPaths.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    setIsAiProcessing(true);
    setAiStatusMessage(
      objectRemovalMode === 'ai_replace' && objectReplacePrompt.trim()
        ? `[Nano Banana Generative Replace] Reemplazando objeto con "${objectReplacePrompt}"...`
        : '[Herramienta Quitar Photoshop] Reconstruyendo textura de fondo con Relleno Según el Contenido...'
    );

    setTimeout(async () => {
      try {
        // 1. Capturar la imagen limpia en un canvas auxiliar SIN los trazos de selección rojos
        const cleanCanvas = document.createElement('canvas');
        cleanCanvas.width = canvas.width;
        cleanCanvas.height = canvas.height;
        const cleanCtx = cleanCanvas.getContext('2d');
        if (cleanCtx) {
          drawToContext(cleanCtx, canvas.width, canvas.height, false, true, true);
        }

        // 2. Ejecutar inpainting inteligente libre de artefactos
        const newImg = await performContentAwareRemoval(cleanCanvas, canvas.width, canvas.height, targetPaths);
        imageRef.current = newImg;

        // 3. Limpiar únicamente las rutas de borrador procesadas
        setPaths((prev) => prev.filter((p) => !targetPaths.includes(p)));

        setIsAiProcessing(false);
        setAiStatusMessage('');
        renderCanvas();
        saveSnapshot(newImg.src);
      } catch (err) {
        console.error('Error en Quitar Objeto:', err);
        setIsAiProcessing(false);
        setAiStatusMessage('');
      }
    }, 100);
  };

  // 4. MEJORA Y PROCESAMIENTO NANO BANANA 2
  const handleRunNanoBanana2 = (actionType: string) => {
    setIsAiProcessing(true);

    const engineLabel =
      nanoEngine === 'flash'
        ? 'Nano Banana 2 Flash (Ultra Rápido)'
        : nanoEngine === 'pro'
        ? 'Nano Banana 2 Pro (Máxima Fidelidad HD)'
        : 'Nano Banana 2 Studio (Creativo Editorial)';

    let statusText = `[${engineLabel}] Procesando imagen con Nano Banana 2...`;

    if (actionType === 'restore') {
      statusText = `[${engineLabel}] Restaurando fotografía antigua, eliminando desperfectos y calibrando tono IDAC...`;
    } else if (actionType === 'upscale') {
      statusText = `[${engineLabel}] Reconstruyendo textura de piel, detalles y súper escalado 4K...`;
    } else if (actionType === 'bgReplace') {
      statusText = `[${engineLabel}] Sustituyendo fondo manteniendo silueta y mapa de sombras...`;
    } else if (actionType === 'relight') {
      statusText = `[${engineLabel}] Reorientando mapa de luz Studio 3D y temperatura cromática...`;
    } else if (actionType === 'deglare') {
      statusText = `[${engineLabel}] Eliminando reflejos molestos en cristales y sobreexposición...`;
    } else if (actionType === 'hdr') {
      statusText = `[${engineLabel}] Ampliando rango dinámico HDR+ y equilibrando luces...`;
    } else if (actionType === 'custom' && aiPrompt.trim()) {
      statusText = `[${engineLabel}] Generando cambios: "${aiPrompt}" (Fidelidad: ${nanoFidelity}%)...`;
    }

    setAiStatusMessage(statusText);

    const executionTime = nanoEngine === 'flash' ? 1000 : nanoEngine === 'pro' ? 2000 : 2800;

    setTimeout(() => {
      if (actionType === 'restore') {
        setContrast(120);
        setBrightness(105);
        setSaturation(108);
        if (nanoStyle === 'historic') setSepia(15);
      } else if (actionType === 'upscale') {
        setContrast(125);
        setBrightness(108);
        setSaturation(118);
        setBlur(0);
      } else if (actionType === 'bgReplace') {
        setContrast(128);
        setBrightness(110);
        setSaturation(122);
      } else if (actionType === 'relight') {
        setBrightness(114);
        setContrast(115);
        setSaturation(112);
      } else if (actionType === 'deglare') {
        setContrast(112);
        setBrightness(104);
        setSaturation(105);
      } else if (actionType === 'hdr') {
        setBrightness(108);
        setContrast(132);
        setSaturation(128);
      } else if (actionType === 'custom') {
        setBrightness(110);
        setContrast(125);
        setSaturation(120);
      }

      if (nanoWatermark) {
        setWatermark(true);
      }

      setIsAiProcessing(false);
      setAiStatusMessage('');
      renderCanvas();
      saveSnapshot();
    }, executionTime);
  };

  // 5. MEJORA IA RÁPIDA DE FOTO (OPCIONES CLÁSICAS)
  const handleApplyAiEnhancement = (type: 'auto' | 'portrait' | 'lighting' | 'custom') => {
    handleRunNanoBanana2(type === 'auto' ? 'upscale' : type === 'portrait' ? 'restore' : type === 'lighting' ? 'relight' : 'custom');
  };

  // 6. GENERADOR DE VÍDEO ANIMADO IA (IMAGE-TO-VIDEO NANO BANANA)
  const handleGenerateAiVideo = () => {
    setIsAiProcessing(true);
    const motionName =
      videoCameraMotion === 'zoom_in'
        ? 'Zoom In (Acercamiento Progresivo)'
        : videoCameraMotion === 'zoom_out'
        ? 'Zoom Out (Panorama Amplio)'
        : videoCameraMotion === 'pan_right'
        ? 'Panorámica Horizontal (Pan Right)'
        : videoCameraMotion === 'orbit_360'
        ? 'Órbita Cinemática 360°'
        : videoCameraMotion === 'fpv_drone'
        ? 'Dron FPV Cinemático'
        : videoCameraMotion === 'tilt_up'
        ? 'Tilt Vertical Ascendente'
        : 'Efecto Viento Natural Estático';

    setAiStatusMessage(`[Nano Banana Video AI] Inicializando mapa de profundidad 3D y movimiento (${motionName})...`);

    setTimeout(() => {
      setAiStatusMessage(`[Nano Banana Video AI] Sintetizando fotogramas clave a ${videoFps} FPS (${videoDuration}s)...`);
      setTimeout(() => {
        setIsAiProcessing(false);
        setAiStatusMessage('');
        setGeneratedVideoActive(true);
        setIsVideoPlaying(true);
      }, 1500);
    }, 1200);
  };

  // DIBUJO COMPLETO EN CUALQUIER CONTEXTO (CANVAS PRINCIPAL O CANVAS OFFSCREEN PARA DESCARGA)
  const drawToContext = (
    ctx: CanvasRenderingContext2D,
    renderWidth: number,
    renderHeight: number,
    showWatermark: boolean,
    excludeObjectSelection: boolean = false,
    disableFilters: boolean = false
  ) => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return;

    const isRotated = rotation === 90 || rotation === 270;

    ctx.save();

    // Filtros
    if (!disableFilters) {
      const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)`;
      ctx.filter = filterString;
    } else {
      ctx.filter = 'none';
    }

    // Traslación y Rotación
    ctx.translate(renderWidth / 2, renderHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const drawWidth = isRotated ? renderHeight : renderWidth;
    const drawHeight = isRotated ? renderWidth : renderHeight;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();

    // Dibujar trazos de pincel, borrador y selección de objetos
    const allPaths = [
      ...paths,
      ...(currentPath
        ? [
            {
              color: activeTool === 'objectEraser' ? 'rgba(239, 68, 68, 0.6)' : brushColor,
              size: brushSize,
              points: currentPath,
              isEraser: activeTool === 'bgEraser' || activeTool === 'eraser',
              isObjectEraser: activeTool === 'objectEraser',
            },
          ]
        : []),
    ].filter((p) => !excludeObjectSelection || !p.isObjectEraser);

    allPaths.forEach((path) => {
      if (path.points.length < 1) return;
      ctx.save();

      if (path.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = path.size * 2;
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
      } else if (path.isObjectEraser) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = path.size * 2;
      } else {
        ctx.strokeStyle = path.color;
        ctx.fillStyle = path.color;
        ctx.lineWidth = path.size;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (path.points.length === 1) {
        const pt = path.points[0];
        const px = pt.x * renderWidth;
        const py = pt.y * renderHeight;
        ctx.beginPath();
        ctx.arc(
          px,
          py,
          path.isEraser || path.isObjectEraser ? Math.max(4, path.size) : Math.max(2, path.size / 2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        ctx.beginPath();
        path.points.forEach((pt, i) => {
          const px = pt.x * renderWidth;
          const py = pt.y * renderHeight;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
      ctx.restore();
    });

    // Superposición de Texto con Presets (Elegante, Moderno, Minimalista, etc.)
    if (customText.trim()) {
      ctx.save();

      let fontName = 'sans-serif';
      let fontStyle = 'bold';
      let textCol = textColor;
      let bgBoxColor = 'rgba(15, 23, 42, 0.85)';
      let borderColor = 'transparent';

      if (textPreset === 'elegant') {
        fontName = 'serif';
        fontStyle = 'italic bold';
        textCol = '#fef3c7';
        bgBoxColor = 'rgba(15, 23, 42, 0.9)';
        borderColor = '#d97706';
      } else if (textPreset === 'modern') {
        fontName = 'sans-serif';
        fontStyle = '900';
        textCol = '#38bdf8';
        bgBoxColor = '#0f172a';
        borderColor = '#0284c7';
      } else if (textPreset === 'minimal') {
        fontName = 'sans-serif';
        fontStyle = '600';
        textCol = '#ffffff';
        bgBoxColor = 'rgba(0, 0, 0, 0.65)';
        borderColor = 'rgba(255, 255, 255, 0.2)';
      } else if (textPreset === 'cinematic') {
        fontName = 'sans-serif';
        fontStyle = '800';
        textCol = '#fbbf24';
        bgBoxColor = 'rgba(10, 10, 10, 0.92)';
        borderColor = '#f59e0b';
      } else if (textPreset === 'bold_idac') {
        fontName = 'sans-serif';
        fontStyle = '900';
        textCol = '#ffffff';
        bgBoxColor = '#0f2238';
        borderColor = '#38bdf8';
      }

      ctx.font = `${fontStyle} ${textSize}px ${fontName}`;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const metrics = ctx.measureText(customText);
      const textWidth = metrics.width;
      const textHeight = textSize;
      const paddingX = 16;
      const paddingY = 10;

      let tx = 28;
      let ty = textSize + 28;

      if (textPosition === 'top-right') {
        tx = renderWidth - textWidth - 32;
        ty = textSize + 28;
      } else if (textPosition === 'bottom-left') {
        tx = 28;
        ty = renderHeight - 32;
      } else if (textPosition === 'bottom-right') {
        tx = renderWidth - textWidth - 32;
        ty = renderHeight - 32;
      }

      // Caja de Fondo para el Texto si está activa
      if (textStyleBg || textPreset !== 'custom') {
        const bx = tx - paddingX;
        const by = ty - textHeight - (paddingY / 2);
        const bw = textWidth + (paddingX * 2);
        const bh = textHeight + (paddingY * 2);

        ctx.fillStyle = bgBoxColor;
        ctx.fillRect(bx, by, bw, bh);

        if (borderColor !== 'transparent') {
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(bx, by, bw, bh);
        }
      }

      ctx.fillStyle = textCol;
      ctx.fillText(customText, tx, ty);
      ctx.restore();
    }

    // Grafismo BROADCAST / LOWER THIRD (Zócalo de Transmisión & Noticia TV)
    if (lowerThirdActive && (lowerThirdTitle.trim() || lowerThirdSubtitle.trim())) {
      ctx.save();

      const lX = 32;
      const lY = Math.max(20, renderHeight - 110);
      const maxLWidth = Math.min(renderWidth - 64, 520);
      const boxHeight = 72;

      let bgGrad1 = '#0f2238';
      let bgGrad2 = '#1e3a8a';
      let accentColor = '#38bdf8';
      let tagText = 'TRANSMISIÓN OFICIAL IDAC';
      let tagBg = '#0284c7';
      let titleFont = '900 20px sans-serif';
      let titleColor = '#ffffff';
      let subFont = '600 12px sans-serif';
      let subColor = '#93c5fd';

      if (lowerThirdStyle === 'elegant_glass') {
        bgGrad1 = 'rgba(15, 23, 42, 0.92)';
        bgGrad2 = 'rgba(30, 41, 59, 0.92)';
        accentColor = '#d97706';
        tagText = 'EMISIÓN ELEGANTE';
        tagBg = '#b45309';
        titleFont = 'bold 20px serif';
        titleColor = '#fef3c7';
        subFont = '500 12px serif';
        subColor = '#cbd5e1';
      } else if (lowerThirdStyle === 'modern_tech') {
        bgGrad1 = '#0f172a';
        bgGrad2 = '#0284c7';
        accentColor = '#ef4444';
        tagText = '🔴 EN VIVO • NOTICIA';
        tagBg = '#dc2626';
        titleFont = '900 21px sans-serif';
        titleColor = '#ffffff';
        subFont = '700 12px sans-serif';
        subColor = '#38bdf8';
      } else if (lowerThirdStyle === 'minimalist') {
        bgGrad1 = 'rgba(0, 0, 0, 0.85)';
        bgGrad2 = 'rgba(20, 20, 20, 0.85)';
        accentColor = '#ffffff';
        tagText = 'IDAC ARCHIVE';
        tagBg = '#334155';
        titleFont = '700 19px sans-serif';
        titleColor = '#ffffff';
        subFont = '500 12px sans-serif';
        subColor = '#94a3b8';
      } else if (lowerThirdStyle === 'cine_yellow') {
        bgGrad1 = '#090d16';
        bgGrad2 = '#172554';
        accentColor = '#f59e0b';
        tagText = 'CINE & NOTICIAS';
        tagBg = '#d97706';
        titleFont = '900 21px sans-serif';
        titleColor = '#fbbf24';
        subFont = '600 12px sans-serif';
        subColor = '#f1f5f9';
      }

      // Fondo del Zócalo con Gradiente
      const gradient = ctx.createLinearGradient(lX, lY, lX + maxLWidth, lY);
      gradient.addColorStop(0, bgGrad1);
      gradient.addColorStop(1, bgGrad2);

      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = gradient;
      ctx.fillRect(lX, lY, maxLWidth, boxHeight);

      // Franja de Acento
      ctx.fillStyle = accentColor;
      ctx.fillRect(lX, lY, 6, boxHeight);

      // Etiqueta/Tag superior
      ctx.fillStyle = tagBg;
      ctx.font = '900 9px sans-serif';
      const tagMetrics = ctx.measureText(tagText);
      const tagWidth = tagMetrics.width + 16;
      ctx.fillRect(lX + 16, lY - 14, tagWidth, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, lX + 24, lY - 2);

      // Título principal (Nombre/Titular)
      ctx.fillStyle = titleColor;
      ctx.font = titleFont;
      ctx.fillText(lowerThirdTitle, lX + 20, lY + 30);

      // Subtítulo (Cargo/Descripción)
      ctx.fillStyle = subColor;
      ctx.font = subFont;
      ctx.fillText(lowerThirdSubtitle, lX + 20, lY + 54);

      ctx.restore();
    }

    // Sello Oficial IDAC o Imagen Personalizada
    if (showWatermark) {
      ctx.save();
      ctx.globalAlpha = watermarkOpacity;
      const margin = 20;

      if (watermarkType === 'custom' && customWatermarkImg) {
        // Logo / Imagen Personalizada
        const maxW = Math.min(renderWidth * 0.28, 220);
        const scale = maxW / customWatermarkImg.width;
        const w = customWatermarkImg.width * scale;
        const h = customWatermarkImg.height * scale;

        let bx = renderWidth - w - margin;
        let by = renderHeight - h - margin;

        if (watermarkPosition === 'bottom-left') {
          bx = margin;
          by = renderHeight - h - margin;
        } else if (watermarkPosition === 'top-right') {
          bx = renderWidth - w - margin;
          by = margin;
        } else if (watermarkPosition === 'top-left') {
          bx = margin;
          by = margin;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.drawImage(customWatermarkImg, bx, by, w, h);
      } else {
        // Sello Oficial IDAC
        const badgeText = 'OFFICIAL IDAC ARCHIVE • AUTORIZADO';
        ctx.font = '900 13px sans-serif';
        const textMetrics = ctx.measureText(badgeText);
        const bgW = textMetrics.width + 24;
        const bgH = 28;

        let bx = renderWidth - bgW - margin;
        let by = renderHeight - bgH - margin;

        if (watermarkPosition === 'bottom-left') {
          bx = margin;
          by = renderHeight - bgH - margin;
        } else if (watermarkPosition === 'top-right') {
          bx = renderWidth - bgW - margin;
          by = margin;
        } else if (watermarkPosition === 'top-left') {
          bx = margin;
          by = margin;
        }

        ctx.fillStyle = '#0f2238';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.fillRect(bx, by, bgW, bgH);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + 2, by + 2, bgW - 4, bgH - 4);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, bx + bgW / 2, by + bgH / 2);
      }
      ctx.restore();
    }
  };

  // RENDERIZADO DEL CANVAS PRINCIPAL
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isRotated = rotation === 90 || rotation === 270;
    let targetWidth = isRotated ? img.height : img.width;
    let targetHeight = isRotated ? img.width : img.height;

    // Proporciones fijas si están activas en Crop tab
    if (aspectRatio === '1:1') {
      const minDim = Math.min(targetWidth, targetHeight);
      targetWidth = minDim;
      targetHeight = minDim;
    } else if (aspectRatio === '4:3') {
      targetHeight = Math.round(targetWidth * (3 / 4));
    } else if (aspectRatio === '16:9') {
      targetHeight = Math.round(targetWidth * (9 / 16));
    } else if (aspectRatio === '9:16') {
      targetHeight = Math.round(targetWidth * (16 / 9));
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    drawToContext(ctx, targetWidth, targetHeight, watermark);
  }, [
    brightness,
    contrast,
    saturation,
    grayscale,
    sepia,
    blur,
    rotation,
    flipH,
    flipV,
    aspectRatio,
    watermark,
    watermarkType,
    customWatermarkImg,
    watermarkPosition,
    watermarkOpacity,
    customText,
    textColor,
    textSize,
    textPosition,
    textPreset,
    textStyleBg,
    lowerThirdActive,
    lowerThirdTitle,
    lowerThirdSubtitle,
    lowerThirdStyle,
    paths,
    currentPath,
    brushColor,
    brushSize,
    activeTool,
    imageLoaded,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Manejo de Interacción Mouse/Touch en Canvas
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x, y };
  };

  const getCanvasTouchPoint = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left) / rect.width;
    const y = (e.touches[0].clientY - rect.top) / rect.height;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    e.stopPropagation();
    const pt = getCanvasPoint(e);
    if (pt) setCurrentPath([pt]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || !currentPath) return;
    e.stopPropagation();
    const pt = getCanvasPoint(e);
    if (pt) setCurrentPath((prev) => (prev ? [...prev, pt] : [pt]));
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeTool || !currentPath) return;

    const newPath: DrawingPath = {
      color: activeTool === 'objectEraser' ? 'rgba(239, 68, 68, 0.6)' : brushColor,
      size: brushSize,
      points: currentPath,
      isEraser: activeTool === 'bgEraser' || activeTool === 'eraser',
      isObjectEraser: activeTool === 'objectEraser',
    };

    setPaths((prev) => {
      const updated = [...prev, newPath];
      setTimeout(() => {
        saveSnapshot(undefined, { paths: updated });
      }, 10);
      return updated;
    });
    setCurrentPath(null);

    if (activeTool === 'objectEraser' && autoApplyRemove) {
      setTimeout(() => {
        handleEraseSelectedObjects([newPath]);
      }, 100);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    e.stopPropagation();
    const pt = getCanvasTouchPoint(e);
    if (pt) setCurrentPath([pt]);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!activeTool || !currentPath) return;
    e.stopPropagation();
    const pt = getCanvasTouchPoint(e);
    if (pt) setCurrentPath((prev) => (prev ? [...prev, pt] : [pt]));
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!activeTool || !currentPath) return;

    const newPath: DrawingPath = {
      color: activeTool === 'objectEraser' ? 'rgba(239, 68, 68, 0.6)' : brushColor,
      size: brushSize,
      points: currentPath,
      isEraser: activeTool === 'bgEraser' || activeTool === 'eraser',
      isObjectEraser: activeTool === 'objectEraser',
    };

    setPaths((prev) => {
      const updated = [...prev, newPath];
      setTimeout(() => {
        saveSnapshot(undefined, { paths: updated });
      }, 10);
      return updated;
    });
    setCurrentPath(null);

    if (activeTool === 'objectEraser' && autoApplyRemove) {
      setTimeout(() => {
        handleEraseSelectedObjects([newPath]);
      }, 100);
    }
  };

  // Guardar Cambios
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    onSave(dataUrl);
    onClose();
  };

  // Descargar Imagen (Con opción de incluir o no Marca de Agua)
  const handleDownload = (withWatermark: boolean = watermark) => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return;

    const tempCanvas = document.createElement('canvas');
    const isRotated = rotation === 90 || rotation === 270;
    let targetWidth = isRotated ? img.height : img.width;
    let targetHeight = isRotated ? img.width : img.height;

    if (aspectRatio === '1:1') {
      const minDim = Math.min(targetWidth, targetHeight);
      targetWidth = minDim;
      targetHeight = minDim;
    } else if (aspectRatio === '4:3') {
      targetHeight = Math.round(targetWidth * (3 / 4));
    } else if (aspectRatio === '16:9') {
      targetHeight = Math.round(targetWidth * (9 / 16));
    } else if (aspectRatio === '9:16') {
      targetHeight = Math.round(targetWidth * (16 / 9));
    }

    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    drawToContext(tempCtx, targetWidth, targetHeight, withWatermark);

    const link = document.createElement('a');
    link.download = `IDAC_foto_${withWatermark ? 'con_marca' : 'sin_marca'}_${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  // COMPARTIR EN REDES SOCIALES DIRECTO
  const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'native' | 'copy') => {
    const text = encodeURIComponent('🖼️ Mira esta fotografía editada del Archivo Fotográfico IDAC:');
    const shareUrl = encodeURIComponent(window.location.href);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${shareUrl}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({
        title: 'Fotografía IDAC',
        text: 'Fotografía editada del Archivo Fotográfico IDAC',
        url: window.location.href,
      }).catch(() => {});
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    setShowShareDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 sm:p-4 md:p-6 backdrop-blur-md select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border-2 border-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[98vh] sm:h-[95vh] lg:h-[94vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* BARRA SUPERIOR DEL EDITOR */}
          <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-idac-blue text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">{title}</h3>
                <p className="text-[9px] text-blue-200 uppercase font-bold tracking-wider hidden sm:block">
                  Recorte • Borrador IA de Fondo y Objetos • Filtros • IA Generativa • Compartir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* BOTÓN COMPARTIR FOTO */}
              <div className="relative">
                <button
                  onClick={() => setShowShareDropdown(!showShareDropdown)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir Foto</span>
                </button>

                {showShareDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1 text-white">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-emerald-400"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-sky-400"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>X (Twitter)</span>
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-blue-400"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('telegram')}
                      className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-cyan-400"
                    >
                      <Send className="w-4 h-4" />
                      <span>Telegram</span>
                    </button>
                    {navigator.share && (
                      <button
                        onClick={() => handleShare('native')}
                        className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-amber-400 border-t border-slate-800 pt-2"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Opciones del Dispositivo</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg hover:bg-slate-800 transition-all text-slate-300 border-t border-slate-800"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ACCIONES DE HISTORIAL DE EDICIÓN: DESHACER (ATRÁS), REHACER Y REESTABLECER ORIGINAL */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 shadow-xs cursor-pointer"
                  title="Devolver el último ajuste realizado (Atrás)"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atrás</span>
                  {historyIndex > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[8px] rounded-full border border-amber-500/30">
                      {historyIndex}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                  title="Rehacer el ajuste (Adelante)"
                >
                  <Redo2 className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              <button
                onClick={handleResetToOriginal}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
                title="Reestablecer la fotografía a su estado original"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Reestablecer Original</span>
                <span className="sm:hidden">Original</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-all border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CUERPO DEL EDITOR */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
            {/* VISTA PREVIA DEL CANVAS (ÁREA CENTRAL / SUPERIOR EN MÓVIL) */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950 relative overflow-hidden min-h-[32vh] sm:min-h-[40vh] lg:min-h-0">
              {/* Fondo Ajedrezado para transparencias de borrador */}
              <div
                className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border-2 border-slate-800/90"
                style={{
                  backgroundImage:
                    'radial-gradient(#334155 1px, transparent 0), radial-gradient(#334155 1px, #0f172a 0)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px',
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    touchAction: activeTool ? 'none' : 'auto',
                    transform:
                      generatedVideoActive && isVideoPlaying
                        ? videoCameraMotion === 'zoom_in'
                          ? 'scale(1.12)'
                          : videoCameraMotion === 'zoom_out'
                          ? 'scale(0.92)'
                          : videoCameraMotion === 'pan_right'
                          ? 'translateX(18px) scale(1.05)'
                          : videoCameraMotion === 'orbit_360'
                          ? 'rotate(2.5deg) scale(1.08)'
                          : videoCameraMotion === 'fpv_drone'
                          ? 'perspective(400px) rotateX(6deg) scale(1.1)'
                          : videoCameraMotion === 'tilt_up'
                          ? 'translateY(-12px) scale(1.05)'
                          : 'scale(1)'
                        : 'scale(1)',
                    transition: 'transform 3.5s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                  className={`max-w-full max-h-[36vh] sm:max-h-[50vh] lg:max-h-[70vh] object-contain transition-all ${
                    activeTool === 'brush'
                      ? 'cursor-crosshair'
                      : activeTool === 'bgEraser' || activeTool === 'objectEraser'
                      ? 'cursor-cell'
                      : 'cursor-default'
                  }`}
                />

                {/* Mascara visual de recorte interactivo */}
                {isCropActive && (
                  <div
                    className="absolute border-2 border-dashed border-amber-400 bg-amber-500/10 shadow-2xl pointer-events-none"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`,
                    }}
                  >
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                      Área de Recorte ({cropBox.width.toFixed(0)}% x {cropBox.height.toFixed(0)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* REPRODUCTOR & BARRA DE CONTROL DE VÍDEO GENERADO CON IA */}
              {generatedVideoActive && !isAiProcessing && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white border border-amber-500/40 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md z-40">
                  <button
                    onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all flex items-center justify-center"
                    title={isVideoPlaying ? 'Pausar Reproducción' : 'Reproducir Vídeo'}
                  >
                    {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                  </button>

                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      <span>Vídeo IA Animado Nano Banana</span>
                    </span>
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                      {videoDuration}s • {videoFps} FPS • {videoAspectRatio} • {videoCameraMotion.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-700 mx-1"></div>

                  <button
                    onClick={() => setVideoAudio(!videoAudio)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                      videoAudio
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Audio Ambiental IA"
                  >
                    {videoAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setVideoLoop(!videoLoop)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                      videoLoop
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Bucle Infinito"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1"
                    title="Descargar Vídeo MP4"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[9px] uppercase font-black">MP4</span>
                  </button>
                </div>
              )}

              {/* BARRA DE ESTADO / NOTIFICACIONES DE IA */}
              {isAiProcessing && (
                <div className="absolute top-6 bg-slate-900/95 text-sky-300 border border-sky-500/50 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{aiStatusMessage}</span>
                </div>
              )}

              {/* Indicador de herramienta activa */}
              {activeTool && !isAiProcessing && (
                <div className="absolute top-6 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-amber-300">
                  {activeTool === 'brush' && <Pencil className="w-3.5 h-3.5" />}
                  {(activeTool === 'bgEraser' || activeTool === 'eraser') && <Eraser className="w-3.5 h-3.5" />}
                  {activeTool === 'objectEraser' && <Wand2 className="w-3.5 h-3.5" />}
                  <span>
                    {activeTool === 'brush' && '🎨 Pincel de Anotaciones Activo'}
                    {(activeTool === 'bgEraser' || activeTool === 'eraser') && '🧹 Goma de Borrar Directa Activa'}
                    {activeTool === 'objectEraser' && '✨ Pincel Quitar / Reemplazar Objeto Activo'}
                  </span>
                  <button
                    onClick={() => setActiveTool(null)}
                    className="ml-1.5 px-1.5 py-0.5 bg-slate-950 text-white rounded-md text-[8px] hover:bg-slate-800 transition-all cursor-pointer font-bold uppercase"
                    title="Desactivar herramienta para navegar libremente"
                  >
                    ✕ Soltar
                  </button>
                </div>
              )}
            </div>

            {/* PANEL LATERAL / INFERIOR DE CONTROLES (MENÚ CÁMARA MÓVIL) */}
            <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-auto lg:h-full overflow-hidden shrink-0 lg:shrink max-h-[55vh] sm:max-h-[50vh] lg:max-h-none">
              {/* BARRA DE ACCIÓN RÁPIDA: DESHACER (ATRÁS), REHACER Y REESTABLECER FOTO ORIGINAL */}
              <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1 transition-all border border-slate-700 cursor-pointer shadow-2xs"
                    title="Devolver el último ajuste realizado (Atrás)"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1 transition-all border border-slate-700 cursor-pointer shadow-2xs"
                    title="Rehacer el ajuste (Adelante)"
                  >
                    <Redo2 className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Reestablecer foto original completa"
                >
                  <RotateCcw className="w-3 h-3 text-red-400" />
                  <span>Reestablecer Original</span>
                </button>
              </div>

              {/* PESTAÑAS PRINCIPALES DE HERRAMIENTAS (MENÚ HORIZONTAL ESTILO CÁMARA MÓVIL) */}
              <div className="flex lg:grid lg:grid-cols-6 overflow-x-auto bg-slate-900 lg:bg-slate-100 p-1.5 border-b border-slate-800 lg:border-slate-200 gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('presets');
                    setActiveTool(null);
                    setIsCropActive(false);
                  }}
                  className={`flex-1 min-w-[65px] sm:min-w-[75px] lg:min-w-0 py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${
                    activeTab === 'presets'
                      ? 'bg-idac-blue text-white font-bold shadow-xs'
                      : 'text-slate-400 lg:text-slate-500 hover:text-white lg:hover:text-slate-800 hover:bg-slate-800 lg:hover:bg-slate-200'
                  }`}
                  title="Filtros Pre-establecidos"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Presets</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('crop');
                    setActiveTool(null);
                    setIsCropActive(true);
                  }}
                  className={`flex-1 min-w-[65px] sm:min-w-[75px] lg:min-w-0 py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${
                    activeTab === 'crop'
                      ? 'bg-idac-blue text-white font-bold shadow-xs'
                      : 'text-slate-400 lg:text-slate-500 hover:text-white lg:hover:text-slate-800 hover:bg-slate-800 lg:hover:bg-slate-200'
                  }`}
                  title="Recortar y Girar"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Recortar</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ai');
                    setActiveTool(null);
                    setIsCropActive(false);
                  }}
                  className={`flex-1 min-w-[65px] sm:min-w-[75px] lg:min-w-0 py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${
                    activeTab === 'ai'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 lg:text-slate-500 hover:text-white lg:hover:text-slate-800 hover:bg-slate-800 lg:hover:bg-slate-200'
                  }`}
                  title="Correcciones y Reemplazos IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 lg:text-slate-950" />
                  <span>IA Gen</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('eraser');
                    setActiveTool('bgEraser');
                    setIsCropActive(false);
                  }}
                  className={`flex-1 min-w-[65px] sm:min-w-[75px] lg:min-w-0 py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${
                    activeTab === 'eraser'
                      ? 'bg-idac-blue text-white font-bold shadow-xs'
                      : 'text-slate-400 lg:text-slate-500 hover:text-white lg:hover:text-slate-800 hover:bg-slate-800 lg:hover:bg-slate-200'
                  }`}
                  title="Borrador de Fondo y Objetos"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Borrador</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('draw');
                    setActiveTool('brush');
                    setIsCropActive(false);
                  }}
                  className={`flex-1 min-w-[65px] sm:min-w-[75px] lg:min-w-0 py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${
                    activeTab === 'draw'
                      ? 'bg-idac-blue text-white font-bold shadow-xs'
                      : 'text-slate-400 lg:text-slate-500 hover:text-white lg:hover:text-slate-800 hover:bg-slate-800 lg:hover:bg-slate-200'
                  }`}
                  title="Pincel y Textos"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Texto/Trazo</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('filters');
                    setActiveTool(null);
                    setIsCropActive(false);
                  }}
                  className={`flex-1 min-w-[65px] sm:min-w-[75px] lg:min-w-0 py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${
                    activeTab === 'filters'
                      ? 'bg-idac-blue text-white font-bold shadow-xs'
                      : 'text-slate-400 lg:text-slate-500 hover:text-white lg:hover:text-slate-800 hover:bg-slate-800 lg:hover:bg-slate-200'
                  }`}
                  title="Filtros Manuales"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ajustes</span>
                </button>
              </div>

              {/* CONTENIDO INTERACTIVO DE PESTAÑAS */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4">
                {/* 1. FILTROS PRE-ESTABLECIDOS */}
                {activeTab === 'presets' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-idac-blue" />
                        Filtros e Iluminación Profesional
                      </span>
                      <span className="text-[9px] bg-idac-blue/10 text-idac-blue px-2 py-0.5 rounded-full font-black uppercase">
                        28 Estilos
                      </span>
                    </div>

                    {/* SUB-CATEGORÍAS DE PRESETS */}
                    <div className="flex gap-1 overflow-x-auto pb-1 text-[9px] font-black uppercase">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'cine', label: '🎬 Cine' },
                        { id: 'nature', label: '🌿 Naturaleza' },
                        { id: 'events', label: '🎉 Ocasiones' },
                        { id: 'idac', label: '🏛️ Galería IDAC' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setPresetCategory(cat.id as any)}
                          className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-all ${
                            presetCategory === cat.id
                              ? 'bg-idac-blue text-white font-black shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
                      {[
                        // Clásicos
                        { key: 'original', name: 'Original', desc: 'Sin modificaciones', category: 'idac' },
                        { key: 'vivid', name: 'Vívido IDAC', desc: 'Máxima saturación y color', category: 'idac' },
                        { key: 'arctic', name: 'Frío Ártico', desc: 'Tonos helados y puros', category: 'idac' },
                        { key: 'soft', name: 'Pastel Suave', desc: 'Enfoque sutil retrato', category: 'idac' },

                        // Cinematográficos
                        { key: 'cine', name: 'Cine Cálido', desc: 'Tono cinematográfico 35mm', category: 'cine' },
                        { key: 'noir', name: 'Noir B/N', desc: 'Blanco y negro dramático', category: 'cine' },
                        { key: 'cyberpunk', name: 'Cyberpunk', desc: 'Colores de neón futurista', category: 'cine' },
                        { key: 'vintage', name: 'Retro 80s', desc: 'Estilo clásico analógico', category: 'cine' },
                        { key: 'dramatic', name: 'Dramático', desc: 'Sombras de alto contraste', category: 'cine' },
                        { key: 'anamorphic', name: 'Anamórfico 35mm', desc: 'Lente de cine anamórfico', category: 'cine' },
                        { key: 'blockbuster', name: 'Blockbuster Teal', desc: 'Cian y Naranja Hollywood', category: 'cine' },
                        { key: 'french_wave', name: 'French Wave', desc: 'Cine clásico de autor', category: 'cine' },

                        // Ambientes Naturales
                        { key: 'golden', name: 'Atardecer Dorado', desc: 'Luz cálida de puesta de sol', category: 'nature' },
                        { key: 'aurora', name: 'Aurora Boreal', desc: 'Magia verde y magenta', category: 'nature' },
                        { key: 'emerald_forest', name: 'Bosque Esmeralda', desc: 'Verde profundo y frondoso', category: 'nature' },
                        { key: 'tropical_beach', name: 'Playa Tropical', desc: 'Aguas turquesas y sol', category: 'nature' },
                        { key: 'warm_desert', name: 'Desierto Cálido', desc: 'Tonos terracota y arena', category: 'nature' },
                        { key: 'foggy_rain', name: 'Lluvia & Niebla', desc: 'Atmósfera mística y fría', category: 'nature' },
                        { key: 'starry_night', name: 'Noche Estrellada', desc: 'Azul nocturno profundo', category: 'nature' },
                        { key: 'pure_snow', name: 'Nieve Pura', desc: 'Luminosidad helada alta', category: 'nature' },

                        // Ocasiones Especiales
                        { key: 'romantic_wedding', name: 'Boda Romántica', desc: 'Suavizado pastel elegante', category: 'events' },
                        { key: 'neon_party', name: 'Fiesta Neón', desc: 'Saturación y luces de fiesta', category: 'events' },
                        { key: 'warm_christmas', name: 'Navidad Cálida', desc: 'Luces doradas y rojas', category: 'events' },
                        { key: 'golden_birthday', name: 'Cumpleaños Dorado', desc: 'Destellos de fiesta', category: 'events' },
                        { key: 'elegant_gala', name: 'Gala Elegante', desc: 'Lujo y contraste oscuro', category: 'events' },
                        { key: 'retro_festival', name: 'Festival Retro', desc: 'Psicodélico e intenso', category: 'events' },
                        { key: 'idac_graduation', name: 'Graduación IDAC', desc: 'Azul institucional refinado', category: 'events' },
                        { key: 'rose_gold', name: 'Aniversario Rose Gold', desc: 'Matiz rosa champagne', category: 'events' },
                      ]
                        .filter((p) => presetCategory === 'all' || p.category === presetCategory)
                        .map((preset) => (
                          <button
                            key={preset.key}
                            onClick={() => applyPreset(preset.key)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              activePreset === preset.key
                                ? 'bg-idac-blue text-white border-idac-blue shadow-md font-bold scale-[1.02]'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <p className="text-xs font-black uppercase tracking-wider">{preset.name}</p>
                            <p
                              className={`text-[9px] uppercase font-bold ${
                                activePreset === preset.key ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {preset.desc}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. HERRAMIENTA DE RECORTAR Y GIRO */}
                {activeTab === 'crop' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1.5">
                          <Crop className="w-4 h-4 text-amber-600" />
                          Recorte Interactivo
                        </span>
                        <button
                          onClick={applyCrop}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-xs"
                        >
                          Aplicar Recorte
                        </button>
                      </div>

                      {/* Dimensiones y sliders de recorte */}
                      <div className="space-y-2 text-[10px] font-bold text-slate-700">
                        <div>
                          <div className="flex justify-between uppercase mb-1 text-slate-500">
                            <span>Posición Horizontal (X)</span>
                            <span>{cropBox.x}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            value={cropBox.x}
                            onChange={(e) => setCropBox((p) => ({ ...p, x: Number(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between uppercase mb-1 text-slate-500">
                            <span>Posición Vertical (Y)</span>
                            <span>{cropBox.y}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            value={cropBox.y}
                            onChange={(e) => setCropBox((p) => ({ ...p, y: Number(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between uppercase mb-1 text-slate-500">
                            <span>Ancho de Recorte</span>
                            <span>{cropBox.width}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={cropBox.width}
                            onChange={(e) => setCropBox((p) => ({ ...p, width: Number(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between uppercase mb-1 text-slate-500">
                            <span>Alto de Recorte</span>
                            <span>{cropBox.height}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={cropBox.height}
                            onChange={(e) => setCropBox((p) => ({ ...p, height: Number(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Proporciones de aspecto preestablecidas */}
                      <div className="pt-2 border-t border-amber-200/60">
                        <label className="text-[9px] font-black uppercase tracking-widest text-amber-900 block mb-1.5">
                          Proporciones de Recorte
                        </label>
                        <div className="grid grid-cols-5 gap-1 text-[9px] font-bold uppercase">
                          {(['free', '1:1', '4:3', '16:9', '9:16'] as const).map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setAspectRatio(ratio)}
                              className={`py-1.5 rounded-lg border text-center transition-all ${
                                aspectRatio === ratio
                                  ? 'bg-amber-500 text-slate-950 font-black border-amber-600'
                                  : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100'
                              }`}
                            >
                              {ratio === 'free' ? 'Libre' : ratio}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* GIROS Y ESPEJO */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                        Giro y Espejo
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setRotation((prev) => (prev + 90) % 360)}
                          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <RotateCw className="w-4 h-4 text-idac-blue" />
                          <span>Girar +90°</span>
                        </button>
                        <button
                          onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-4 h-4 text-idac-blue" />
                          <span>Girar -90°</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setFlipH(!flipH)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            flipH
                              ? 'bg-idac-blue text-white border-idac-blue'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <FlipHorizontal className="w-4 h-4" />
                          <span>Espejo H</span>
                        </button>
                        <button
                          onClick={() => setFlipV(!flipV)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            flipV
                              ? 'bg-idac-blue text-white border-idac-blue'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <FlipVertical className="w-4 h-4" />
                          <span>Espejo V</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ASISTENTE IA DE CORRECCIÓN, NANO BANANA Y GENERACIÓN DE VÍDEO */}
                {activeTab === 'ai' && (
                  <div className="space-y-4">
                    {/* CONMUTADOR PRINCIPAL: NANO BANANA VS GENERADOR DE VÍDEO */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-white">
                      <button
                        type="button"
                        onClick={() => setAiSubTab('nano')}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          aiSubTab === 'nano'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-sm">🍌</span>
                        <span>Nano Banana AI Suite</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiSubTab('video')}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          aiSubTab === 'video'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Video className="w-4 h-4 text-slate-950" />
                        <span>Generador Vídeo IA</span>
                      </button>
                    </div>

                    {/* VISTA 1: NANO BANANA AI SUITE */}
                    {aiSubTab === 'nano' && (
                      <div className="space-y-4">
                        {/* SECCIÓN 1: OPCIONES DE MEJORA ANTERIORES / LEGACY IA */}
                        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-blue-600" />
                              Opciones Anteriores de Corrección IA
                            </span>
                            <span className="text-[9px] bg-blue-200/80 text-blue-950 px-1.5 py-0.5 rounded font-black uppercase">
                              Acceso Rápido
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handleApplyAiEnhancement('auto')}
                              disabled={isAiProcessing}
                              className="p-2 rounded-xl bg-white hover:bg-blue-100 text-blue-950 text-[10px] font-black uppercase tracking-wider transition-all border border-blue-200 flex items-center gap-1.5 shadow-2xs text-left"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Auto (Mejora Instantánea)</span>
                            </button>

                            <button
                              onClick={() => handleApplyAiEnhancement('portrait')}
                              disabled={isAiProcessing}
                              className="p-2 rounded-xl bg-white hover:bg-blue-100 text-blue-950 text-[10px] font-black uppercase tracking-wider transition-all border border-blue-200 flex items-center gap-1.5 shadow-2xs text-left"
                            >
                              <Wand2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>Portrait (Enfoque Facial)</span>
                            </button>

                            <button
                              onClick={() => handleApplyAiEnhancement('lighting')}
                              disabled={isAiProcessing}
                              className="p-2 rounded-xl bg-white hover:bg-blue-100 text-blue-950 text-[10px] font-black uppercase tracking-wider transition-all border border-blue-200 flex items-center gap-1.5 shadow-2xs text-left"
                            >
                              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Lighting (Reluminado Cálido)</span>
                            </button>

                            <button
                              onClick={() => handleApplyAiEnhancement('custom')}
                              disabled={isAiProcessing}
                              className="p-2 rounded-xl bg-white hover:bg-blue-100 text-blue-950 text-[10px] font-black uppercase tracking-wider transition-all border border-blue-200 flex items-center gap-1.5 shadow-2xs text-left"
                            >
                              <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Custom (Ajuste Personal)</span>
                            </button>
                          </div>
                        </div>

                        {/* SECCIÓN 2: BANNER SUITE COMPLETA NANO BANANA (1.0, 2, PRO) */}
                        <div className="p-3.5 bg-gradient-to-br from-amber-950 via-slate-900 to-blue-950 text-white rounded-xl space-y-3 border border-amber-500/30 shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

                          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🍌</span>
                              <div>
                                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                                  Suite Nano Banana Original & Pro
                                </span>
                                <span className="text-[9px] text-amber-200/80 uppercase font-bold tracking-widest block">
                                  Todas las funciones oficiales del sitio original
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                              v3.0 Complete
                            </span>
                          </div>

                          {/* SELECTOR DE MODELO COMPLETO NANO BANANA */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                              Variante del Modelo Nano Banana
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-[9px] font-black uppercase">
                              <button
                                type="button"
                                onClick={() => {
                                  setNanoModel('nb1');
                                  setNanoEngine('flash');
                                }}
                                className={`py-1.5 px-2 rounded-lg transition-all ${
                                  nanoModel === 'nb1'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                🍌 Nano Banana 1.0
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNanoModel('nb2_flash');
                                  setNanoEngine('flash');
                                }}
                                className={`py-1.5 px-2 rounded-lg transition-all ${
                                  nanoModel === 'nb2_flash'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                ⚡ Nano Banana 2 Flash
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNanoModel('nb2_pro');
                                  setNanoEngine('pro');
                                }}
                                className={`py-1.5 px-2 rounded-lg transition-all ${
                                  nanoModel === 'nb2_pro'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                🍌 Nano Banana 2 Pro
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNanoModel('nb2_studio');
                                  setNanoEngine('studio');
                                }}
                                className={`py-1.5 px-2 rounded-lg transition-all ${
                                  nanoModel === 'nb2_studio'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                🎨 Nano Banana 2 Studio
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNanoModel('nb_pro_8k');
                                  setNanoEngine('pro');
                                }}
                                className={`py-1.5 px-2 rounded-lg col-span-2 sm:col-span-1 transition-all ${
                                  nanoModel === 'nb_pro_8k'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                🌟 Nano Banana Pro 8K
                              </button>
                            </div>
                          </div>

                          {/* ACCIONES RÁPIDAS NANO BANANA */}
                          <div className="space-y-2 pt-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-amber-300/90 block">
                              Acciones Rápidas Nano Banana
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => handleRunNanoBanana2('restore')}
                                disabled={isAiProcessing}
                                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-amber-100 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-amber-500/20 text-left disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Restaurar Foto Antigua</span>
                              </button>

                              <button
                                onClick={() => handleRunNanoBanana2('upscale')}
                                disabled={isAiProcessing}
                                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-amber-100 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-amber-500/20 text-left disabled:opacity-50"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                <span>Súper Escalado 4K</span>
                              </button>

                              <button
                                onClick={() => handleRunNanoBanana2('bgReplace')}
                                disabled={isAiProcessing}
                                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-blue-200 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 text-left disabled:opacity-50"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span>Sustitución de Fondo</span>
                              </button>

                              <button
                                onClick={() => handleRunNanoBanana2('relight')}
                                disabled={isAiProcessing}
                                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-blue-200 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 text-left disabled:opacity-50"
                              >
                                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Reluminación Studio 3D</span>
                              </button>

                              <button
                                onClick={() => handleRunNanoBanana2('deglare')}
                                disabled={isAiProcessing}
                                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-blue-200 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 text-left disabled:opacity-50"
                              >
                                <Wand2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Quitar Reflejos/Brillos</span>
                              </button>

                              <button
                                onClick={() => handleRunNanoBanana2('hdr')}
                                disabled={isAiProcessing}
                                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-blue-200 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 text-left disabled:opacity-50"
                              >
                                <Sliders className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                <span>HDR+ Rango Dinámico</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* SECCIÓN 3: GENERADOR POR PROMPT & AJUSTES NANO BANANA */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                              <Wand2 className="w-4 h-4 text-amber-500" />
                              Edición por Prompt con Nano Banana
                            </span>
                            <span className="text-[9px] text-amber-600 uppercase font-black bg-amber-100 px-1.5 py-0.5 rounded">
                              Prompt IA
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500 mb-1 block">
                                Prompt Positivo (Instrucciones de Edición)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ej. 'Añadir tonos dorados de atardecer, mejorar el contraste del uniforme de aviación, enfocar ojos'..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-slate-800 bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500 mb-1 block">
                                Prompt Negativo (Lo que se desea evitar)
                              </label>
                              <input
                                type="text"
                                placeholder="Ej. borroso, sombras duras, ruido excesivo, distorsiones"
                                value={nanoNegativePrompt}
                                onChange={(e) => setNanoNegativePrompt(e.target.value)}
                                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 text-slate-700 bg-white"
                              />
                            </div>
                          </div>

                          {/* AJUSTES FINOS */}
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                                Fidelidad a la Imagen Original
                              </label>
                              <span className="text-xs font-black text-amber-600">{nanoFidelity}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={nanoFidelity}
                              onChange={(e) => setNanoFidelity(Number(e.target.value))}
                              className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />

                            <div className="space-y-1 pt-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 block">
                                Guía de Estilo Visual
                              </label>
                              <select
                                value={nanoStyle}
                                onChange={(e) => setNanoStyle(e.target.value as any)}
                                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                              >
                                <option value="photoreal">📸 Fotorrealismo 8K Ultra HD</option>
                                <option value="historic">🏛️ Archivo Histórico IDAC (Vintage)</option>
                                <option value="cinematic">🎬 Cinematográfico Anamórfico 35mm</option>
                                <option value="artistic">🎨 Ilustración / Arte Digital</option>
                                <option value="editorial">✨ Moda & Retrato Editorial</option>
                                <option value="anime">🌟 Estilo Anime HD / Manga</option>
                                <option value="octane3d">🕹️ Render Octane 3D Hiperrealista</option>
                              </select>
                            </div>

                            {/* CHECKBOXES DE OPCIONES NANO BANANA */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={nanoPreserveSkin}
                                  onChange={(e) => setNanoPreserveSkin(e.target.checked)}
                                  className="accent-amber-500 rounded"
                                />
                                <span>Preservar piel natural</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={nanoPreserveGeometry}
                                  onChange={(e) => setNanoPreserveGeometry(e.target.checked)}
                                  className="accent-amber-500 rounded"
                                />
                                <span>Geometría exacta</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={nanoFilmGrain}
                                  onChange={(e) => setNanoFilmGrain(e.target.checked)}
                                  className="accent-amber-500 rounded"
                                />
                                <span>Grano de película 35mm</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={nanoWatermark}
                                  onChange={(e) => setNanoWatermark(e.target.checked)}
                                  className="accent-amber-500 rounded"
                                />
                                <span>Sello Nano Banana</span>
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRunNanoBanana2('custom')}
                            disabled={isAiProcessing || !aiPrompt.trim()}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
                          >
                            <Wand2 className="w-4 h-4" />
                            <span>Ejecutar Edición con Nano Banana</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* VISTA 2: GENERADOR DE VÍDEO IA (IMAGE-TO-VIDEO) */}
                    {aiSubTab === 'video' && (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-xl space-y-3 border border-amber-500/30 shadow-lg relative overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <Film className="w-5 h-5 text-amber-400" />
                              <div>
                                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                                  Generador de Vídeo IA Nano Banana
                                </span>
                                <span className="text-[9px] text-amber-200/80 uppercase font-bold tracking-widest block">
                                  Convierte esta fotografía en un vídeo animado en 4K
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                              Image-to-Video
                            </span>
                          </div>

                          {/* MOVIMIENTO DE CÁMARA */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center justify-between">
                              <span>Movimiento de Cámara & Ángulo</span>
                              <span className="text-amber-400">{videoCameraMotion.replace('_', ' ')}</span>
                            </label>
                            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase">
                              {[
                                { id: 'zoom_in', name: '🔍 Zoom In (Acercamiento)' },
                                { id: 'zoom_out', name: '🔭 Zoom Out (Panorama)' },
                                { id: 'pan_right', name: '➡️ Panorámica Pan Right' },
                                { id: 'orbit_360', name: '🔄 Órbita Cinemática 360°' },
                                { id: 'fpv_drone', name: '🛸 Dron FPV Espectacular' },
                                { id: 'tilt_up', name: '⬆️ Tilt Vertical Ascendente' },
                                { id: 'static', name: '🍃 Viento Natural Estático' },
                              ].map((motionItem) => (
                                <button
                                  key={motionItem.id}
                                  type="button"
                                  onClick={() => setVideoCameraMotion(motionItem.id as any)}
                                  className={`p-2 rounded-xl text-left border transition-all ${
                                    videoCameraMotion === motionItem.id
                                      ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-xs'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  {motionItem.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* DURACIÓN Y FPS */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                                Frecuencia de Cuadros (FPS)
                              </label>
                              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[9px] font-black">
                                {([24, 30, 60] as const).map((fpsVal) => (
                                  <button
                                    key={fpsVal}
                                    type="button"
                                    onClick={() => setVideoFps(fpsVal)}
                                    className={`py-1 rounded-lg transition-all ${
                                      videoFps === fpsVal
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {fpsVal} FPS
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                                Duración del Vídeo
                              </label>
                              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[9px] font-black">
                                {([3, 5, 10, 15] as const).map((dur) => (
                                  <button
                                    key={dur}
                                    type="button"
                                    onClick={() => setVideoDuration(dur)}
                                    className={`py-1 rounded-lg transition-all ${
                                      videoDuration === dur
                                        ? 'bg-amber-500 text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {dur}s
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* RELACIÓN DE ASPECTO */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                              Relación de Aspecto del Vídeo
                            </label>
                            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[9px] font-black uppercase">
                              {[
                                { id: '16:9', label: '16:9 (TV)' },
                                { id: '9:16', label: '9:16 (Reels/TikTok)' },
                                { id: '1:1', label: '1:1 (Post)' },
                                { id: '21:9', label: '21:9 (Cine)' },
                              ].map((ar) => (
                                <button
                                  key={ar.id}
                                  type="button"
                                  onClick={() => setVideoAspectRatio(ar.id as any)}
                                  className={`py-1.5 rounded-lg transition-all text-center ${
                                    videoAspectRatio === ar.id
                                      ? 'bg-amber-500 text-slate-950 font-black'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {ar.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* INTENSIDAD DEL MOVIMIENTO */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                                Intensidad de Animación y Movimiento
                              </label>
                              <span className="text-xs font-black text-amber-400">{videoMotionIntensity} / 10</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={videoMotionIntensity}
                              onChange={(e) => setVideoMotionIntensity(Number(e.target.value))}
                              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* CHECKBOXES DE VÍDEO */}
                          <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-200 font-bold">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={videoLoop}
                                onChange={(e) => setVideoLoop(e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span>Bucle Infinito (Loop)</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={videoAudio}
                                onChange={(e) => setVideoAudio(e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span>Audio Ambiental IA</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                              <input
                                type="checkbox"
                                checked={videoInterpolation}
                                onChange={(e) => setVideoInterpolation(e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span>Interpolación de Fotogramas Clave (Fluidez Extra)</span>
                            </label>
                          </div>

                          {/* PROMPT DE ANIMACIÓN OPCIONAL */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                              Instrucciones de Animación Especiales (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. 'Nubes moviéndose suavemente en el cielo, viento sutil en la vestimenta...'"
                              value={videoPrompt}
                              onChange={(e) => setVideoPrompt(e.target.value)}
                              className="w-full p-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 font-medium"
                            />
                          </div>

                          {/* BOTÓN GENERAR VÍDEO */}
                          <button
                            onClick={handleGenerateAiVideo}
                            disabled={isAiProcessing}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 mt-3"
                          >
                            <Video className="w-4 h-4 fill-slate-950" />
                            <span>Generar Vídeo Animado con IA</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. HERRAMIENTA BORRADOR Y QUITAR/REEMPLAZAR OBJETOS */}
                {activeTab === 'eraser' && (
                  <div className="space-y-4">
                    {/* HERRAMIENTA 1: GOMA DE BORRAR DIRECTA MANUAL */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-700 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Eraser className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-white block">
                              1. Goma de Borrar Directa
                            </span>
                            <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-widest block">
                              Borrado manual inmediato en la foto o lienzo
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            activeTool === 'eraser'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {activeTool === 'eraser' ? '🧹 Goma Activa' : '🧹 Activar Goma'}
                        </button>
                      </div>

                      {activeTool === 'eraser' && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                          <p className="text-[9.5px] text-slate-300 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                            Pasa la goma sobre cualquier trazo, annotation o parte del lienzo para borrarlo directamente.
                          </p>

                          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-300">
                              <span>Grosor de la Goma de Borrar</span>
                              <span className="text-amber-400 font-mono font-bold">{brushSize * 2}px</span>
                            </div>
                            <input
                              type="range"
                              min="2"
                              max="40"
                              value={brushSize}
                              onChange={(e) => setBrushSize(Number(e.target.value))}
                              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* HERRAMIENTA 2: QUITAR Y REEMPLAZAR OBJETOS (CONTENT-AWARE & IA INPAINTING) */}
                    <div className="p-3.5 bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 text-white border border-red-500/30 rounded-2xl space-y-3.5 shadow-xl relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-red-900/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Wand2 className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-red-300 block">
                              2. Quitar o Reemplazar Objetos
                            </span>
                            <span className="text-[8.5px] text-red-200/80 uppercase font-bold tracking-widest block">
                              Relleno Según Contenido / Photoshop Inpainting
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[8.5px] font-black uppercase border border-red-400/30">
                          IA / Algoritmo
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-300 font-medium leading-relaxed bg-black/40 p-2.5 rounded-xl border border-red-500/20">
                        Selecciona personas, objetos, logos o manchas. El algoritmo analizará la foto y los eliminará o reemplazará reconstruyendo el fondo.
                      </p>

                      {/* MODO DE OPERACIÓN: HERRAMIENTA QUITAR VS REEMPLAZAR */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                          Acción Deseada
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setObjectRemovalMode('remove_photoshop')}
                            className={`p-2 rounded-xl text-left border transition-all text-[9.5px] font-black uppercase flex items-center gap-1.5 cursor-pointer ${
                              objectRemovalMode === 'remove_photoshop'
                                ? 'bg-red-600 text-white border-red-400 shadow-md'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            <Eraser className="w-3.5 h-3.5 shrink-0 text-red-300" />
                            <span>🧹 Quitar Objeto</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setObjectRemovalMode('ai_replace')}
                            className={`p-2 rounded-xl text-left border transition-all text-[9.5px] font-black uppercase flex items-center gap-1.5 cursor-pointer ${
                              objectRemovalMode === 'ai_replace'
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                            <span>✨ Reemplazar Objeto</span>
                          </button>
                        </div>
                      </div>

                      {/* PROMPT SI ESTÁ EN MODO REEMPLAZAR */}
                      {objectRemovalMode === 'ai_replace' && (
                        <div className="space-y-1 animate-in fade-in duration-150">
                          <label className="text-[9px] font-black uppercase tracking-widest text-amber-300 block">
                            Reemplazar Objeto Seleccionado Por:
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 'Pasto verde', 'Cielo azul', 'Pared uniforme', 'Agua cristalina'..."
                            value={objectReplacePrompt}
                            onChange={(e) => setObjectReplacePrompt(e.target.value)}
                            className="w-full p-2 text-xs bg-slate-900 border border-amber-500/50 rounded-xl text-amber-100 font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}

                      {/* BOTÓN PINTAR CON EL PINCEL */}
                      <button
                        onClick={() => setActiveTool('objectEraser')}
                        className={`w-full py-2.5 px-3 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          activeTool === 'objectEraser'
                            ? 'bg-red-600 text-white border-red-400 shadow-lg ring-2 ring-red-400/50'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Pencil className="w-4 h-4 text-red-300" />
                        <span>
                          {activeTool === 'objectEraser'
                            ? '🎯 Pincel Quitar/Reemplazar Activo (Pinta en la Foto)'
                            : '🖌️ Activar Pincel Quitar/Reemplazar'}
                        </span>
                      </button>

                      {/* CONTROL TAMAÑO DE PINCEL */}
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-300">
                          <span>Tamaño del Pincel Quitar</span>
                          <span className="text-red-400 font-mono font-bold">{brushSize * 2}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="50"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* OPCIÓN AUTO-APLICAR AL SOLTAR EL PINCEL */}
                      <label className="flex items-center gap-2 text-[10px] text-slate-200 font-bold bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoApplyRemove}
                          onChange={(e) => setAutoApplyRemove(e.target.checked)}
                          className="accent-red-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="block text-white font-black uppercase tracking-wider text-[9px]">
                            ⚡ Quitar/Reemplazar al soltar el pincel
                          </span>
                          <span className="block text-[8px] text-slate-400 font-normal">
                            Procesa y rellena instantáneamente el área seleccionada al finalizar el trazo.
                          </span>
                        </div>
                      </label>

                      {/* BOTONES DE ACCIÓN MANUAL */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleEraseSelectedObjects()}
                          disabled={isAiProcessing || !paths.some((p) => p.isObjectEraser)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Quitar / Reemplazar Ahora</span>
                        </button>

                        {paths.some((p) => p.isObjectEraser) && (
                          <button
                            onClick={() => setPaths((prev) => prev.filter((p) => !p.isObjectEraser))}
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-wider border border-slate-700 cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* HERRAMIENTA 3: BORRADOR DE FONDO AUTOMÁTICO IA */}
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-900 flex items-center gap-1.5">
                          <Eraser className="w-4 h-4 text-sky-600" />
                          3. Borrador de Fondo Automático (IA)
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 uppercase font-medium leading-relaxed">
                        Detecta automáticamente el sujeto principal y elimina el fondo haciéndolo transparente.
                      </p>
                      <button
                        onClick={handleAutoRemoveBackground}
                        disabled={isAiProcessing}
                        className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Eliminar Fondo Automático (IA)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. TEXTO, PRESETS DE TIPOGRAFÍA, LOWER THIRD Y PINCEL */}
                {activeTab === 'draw' && (
                  <div className="space-y-4">
                    {/* SECCIÓN 1: GRAFISMO BROADCAST / LOWER THIRD (ZÓCALO DE NOTICIA IDAC) */}
                    <div className="p-3 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl space-y-3 border border-blue-500/30 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lowerThirdActive}
                            onChange={(e) => setLowerThirdActive(e.target.checked)}
                            className="accent-sky-400 rounded w-4 h-4"
                          />
                          <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                            <Type className="w-4 h-4 text-sky-400" />
                            Grafismo LOWER THIRD (Zócalo TV / Noticia)
                          </span>
                        </label>
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-black uppercase border border-sky-400/30">
                          Broadcast
                        </span>
                      </div>

                      {lowerThirdActive && (
                        <div className="space-y-2.5 pt-1">
                          {/* ESTILOS DE LOWER THIRD */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                              Estilo del Zócalo (Preset)
                            </label>
                            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase">
                              {[
                                { id: 'idac_official', name: '🏛️ IDAC Oficial Transmisión' },
                                { id: 'elegant_glass', name: '✨ Elegante Lujo Glass' },
                                { id: 'modern_tech', name: '🔴 Moderno Tech Noticia' },
                                { id: 'minimalist', name: '🍃 Minimalista Pulcro' },
                                { id: 'cine_yellow', name: '🎬 Cinematográfico 35mm' },
                              ].map((styleItem) => (
                                <button
                                  key={styleItem.id}
                                  type="button"
                                  onClick={() => setLowerThirdStyle(styleItem.id as any)}
                                  className={`p-2 rounded-xl text-left border transition-all ${
                                    lowerThirdStyle === styleItem.id
                                      ? 'bg-sky-500 text-slate-950 font-black border-sky-300 shadow-xs'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  {styleItem.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CAMPOS TÍTULO Y SUBTÍTULO */}
                          <div className="space-y-2">
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">
                                Título / Nombre
                              </label>
                              <input
                                type="text"
                                value={lowerThirdTitle}
                                onChange={(e) => setLowerThirdTitle(e.target.value)}
                                placeholder="Ej. Cap. Luis Martínez"
                                className="w-full p-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-sky-400"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">
                                Subtítulo / Cargo / Institución
                              </label>
                              <input
                                type="text"
                                value={lowerThirdSubtitle}
                                onChange={(e) => setLowerThirdSubtitle(e.target.value)}
                                placeholder="Ej. Director General Aviación Civil • IDAC"
                                className="w-full p-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-sky-200 font-medium focus:outline-none focus:border-sky-400"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECCIÓN 2: PRESETS DE TEXTO ELEGANTES, MODERNOS Y MINIMALISTAS */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Presets de Texto Elegantes y Modernos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase">
                        {[
                          {
                            id: 'elegant',
                            name: '✨ Elegante Serif Gold',
                            sample: 'Fotografía Oficial',
                            action: () => {
                              setTextPreset('elegant');
                              if (!customText) setCustomText('FOTOGRAFÍA OFICIAL IDAC');
                              setTextColor('#fef3c7');
                              setTextStyleBg(true);
                            },
                          },
                          {
                            id: 'modern',
                            name: '🚀 Moderno Tech Cyan',
                            sample: 'Hangar Aviación 2026',
                            action: () => {
                              setTextPreset('modern');
                              if (!customText) setCustomText('HANGAR AVIACIÓN IDAC');
                              setTextColor('#38bdf8');
                              setTextStyleBg(true);
                            },
                          },
                          {
                            id: 'minimal',
                            name: '🍃 Minimalista Blanco',
                            sample: 'Archivo Histórico',
                            action: () => {
                              setTextPreset('minimal');
                              if (!customText) setCustomText('ARCHIVO IDAC DOMINICANA');
                              setTextColor('#ffffff');
                              setTextStyleBg(true);
                            },
                          },
                          {
                            id: 'cinematic',
                            name: '🎬 Cinematográfico Amber',
                            sample: 'Edición Limitada',
                            action: () => {
                              setTextPreset('cinematic');
                              if (!customText) setCustomText('EDICIÓN CINEMATOGRÁFICA IDAC');
                              setTextColor('#fbbf24');
                              setTextStyleBg(true);
                            },
                          },
                          {
                            id: 'bold_idac',
                            name: '🏛️ IDAC Titular Oficial',
                            sample: 'Instituto de Aviación',
                            action: () => {
                              setTextPreset('bold_idac');
                              if (!customText) setCustomText('INSTITUTO DOMINICANO DE AVIACIÓN CIVIL');
                              setTextColor('#ffffff');
                              setTextStyleBg(true);
                            },
                          },
                          {
                            id: 'custom',
                            name: '⚙️ Personalizado',
                            sample: 'Ajuste Manual',
                            action: () => setTextPreset('custom'),
                          },
                        ].map((presetItem) => (
                          <button
                            key={presetItem.id}
                            type="button"
                            onClick={presetItem.action}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              textPreset === presetItem.id
                                ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <p className="font-black truncate">{presetItem.name}</p>
                            <p className="text-[8px] opacity-75 truncate">{presetItem.sample}</p>
                          </button>
                        ))}
                      </div>

                      {/* INPUT DE TEXTO SUPERPUESTO */}
                      <div className="space-y-2 pt-1 border-t border-slate-200">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 block">
                          Contenido del Texto Superpuesto
                        </label>
                        <input
                          type="text"
                          placeholder="Escribe el texto deseado..."
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-slate-800 bg-white"
                        />

                        {customText.trim() && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            {/* POSICIONAMIENTO */}
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 block mb-1">
                                Posición en la Imagen
                              </label>
                              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-black uppercase">
                                {[
                                  { id: 'top-left', name: '↖ Superior Izquierda' },
                                  { id: 'top-right', name: '↗ Superior Derecha' },
                                  { id: 'bottom-left', name: '↙ Inferior Izquierda' },
                                  { id: 'bottom-right', name: '↘ Inferior Derecha' },
                                ].map((pos) => (
                                  <button
                                    key={pos.id}
                                    type="button"
                                    onClick={() => setTextPosition(pos.id as any)}
                                    className={`p-1.5 rounded-lg border text-center transition-all ${
                                      textPosition === pos.id
                                        ? 'bg-slate-900 text-white border-slate-950'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {pos.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* TAMAÑO Y COLOR */}
                            <div className="flex items-center justify-between pt-1">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                                Color de Fuente
                              </label>
                              <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 overflow-hidden"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">
                                <span>Tamaño de Letra</span>
                                <span>{textSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="14"
                                max="60"
                                value={textSize}
                                onChange={(e) => setTextSize(Number(e.target.value))}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={textStyleBg}
                                onChange={(e) => setTextStyleBg(e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span>Fondo semi-transparente protector de lectura</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECCIÓN 3: PINCEL Y GOMA DE BORRAR DE DIBUJO/ANOTACIÓN */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1.5">
                          <Pencil className="w-4 h-4 text-amber-600" />
                          Pincel y Goma de Borrar
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveTool(activeTool === 'brush' ? null : 'brush')}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              activeTool === 'brush'
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-amber-300'
                            }`}
                          >
                            🖌️ Pincel
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              activeTool === 'eraser'
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-amber-300'
                            }`}
                          >
                            🧹 Goma
                          </button>
                        </div>
                      </div>

                      {activeTool === 'brush' && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                              Color del Trazo
                            </label>
                            <div className="flex items-center gap-1.5">
                              {['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ffffff', '#000000'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setBrushColor(c)}
                                  className={`w-5 h-5 rounded-full border border-slate-300 transition-all ${
                                    brushColor === c ? 'ring-2 ring-amber-500 scale-110' : ''
                                  }`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">
                              <span>Grosor del Trazo</span>
                              <span>{brushSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="2"
                              max="30"
                              value={brushSize}
                              onChange={(e) => setBrushSize(Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      )}

                      {activeTool === 'eraser' && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                          <p className="text-[9.5px] text-amber-900 bg-amber-100/80 p-2 rounded-xl border border-amber-200 font-bold">
                            🧹 Goma de borrar activa: Pasa sobre el lienzo para borrar trazos o contenido directamente.
                          </p>

                          <div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">
                              <span>Tamaño de la Goma</span>
                              <span>{brushSize * 2}px</span>
                            </div>
                            <input
                              type="range"
                              min="2"
                              max="40"
                              value={brushSize}
                              onChange={(e) => setBrushSize(Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECCIÓN 4: MARCA DE AGUA / SELLO OFICIAL O IMAGEN PERSONALIZADA */}
                    <div className="p-3 bg-blue-50/80 border border-idac-blue/30 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={watermark}
                            onChange={(e) => setWatermark(e.target.checked)}
                            className="rounded border-slate-300 text-idac-blue focus:ring-idac-blue w-4 h-4"
                          />
                          <span className="text-xs font-black uppercase tracking-wider text-idac-blue flex items-center gap-1.5">
                            <Stamp className="w-4 h-4" />
                            Marca de Agua / Sello
                          </span>
                        </label>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${watermark ? 'bg-idac-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {watermark ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      {watermark && (
                        <div className="space-y-3 pt-1">
                          {/* SELECCIÓN TIPO DE MARCA */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                              Tipo de Marca de Agua
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setWatermarkType('idac')}
                                className={`p-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${
                                  watermarkType === 'idac'
                                    ? 'bg-idac-blue text-white border-idac-dark shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Sello IDAC</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setWatermarkType('custom');
                                  if (!customWatermarkImg && watermarkFileInputRef.current) {
                                    watermarkFileInputRef.current.click();
                                  }
                                }}
                                className={`p-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${
                                  watermarkType === 'custom'
                                    ? 'bg-idac-blue text-white border-idac-dark shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5 text-amber-500" />
                                <span>Subir Logo</span>
                              </button>
                            </div>
                          </div>

                          {/* OPCIÓN DE SUBIR IMAGEN PERSONALIZADA */}
                          {watermarkType === 'custom' && (
                            <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2">
                              <input
                                type="file"
                                ref={watermarkFileInputRef}
                                onChange={handleCustomWatermarkFileChange}
                                accept="image/*"
                                className="hidden"
                              />

                              {customWatermarkUrl ? (
                                <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <img
                                      src={customWatermarkUrl}
                                      alt="Logo personalizado"
                                      className="w-8 h-8 object-contain rounded border border-slate-300 bg-white"
                                    />
                                    <span className="text-[10px] font-bold text-slate-700 truncate">
                                      Logo Personalizado Cargado
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => watermarkFileInputRef.current?.click()}
                                      className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-[9px] font-bold"
                                    >
                                      Cambiar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomWatermarkUrl(null);
                                        setCustomWatermarkImg(null);
                                        setWatermarkType('idac');
                                      }}
                                      className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => watermarkFileInputRef.current?.click()}
                                  className="w-full py-2.5 px-3 border-2 border-dashed border-sky-300 hover:border-idac-blue bg-sky-50/50 rounded-xl text-center flex flex-col items-center justify-center gap-1 group transition-all"
                                >
                                  <Upload className="w-5 h-5 text-idac-blue group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-black uppercase text-idac-blue">
                                    Haz Clic para Subir tu Logo o Imagen
                                  </span>
                                  <span className="text-[8px] text-slate-500">
                                    Soporta imágenes PNG con transparencia, JPG o SVG
                                  </span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* POSICIÓN DE LA MARCA DE AGUA */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                              Ubicación en la Fotografía
                            </label>
                            <div className="grid grid-cols-2 gap-1 text-[9px] font-bold">
                              {[
                                { id: 'bottom-right', label: '↘ Inferior Derecha' },
                                { id: 'bottom-left', label: '↙ Inferior Izquierda' },
                                { id: 'top-right', label: '↗ Superior Derecha' },
                                { id: 'top-left', label: '↖ Superior Izquierda' },
                              ].map((pos) => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setWatermarkPosition(pos.id as any)}
                                  className={`p-1.5 rounded-lg border text-center transition-all ${
                                    watermarkPosition === pos.id
                                      ? 'bg-slate-900 text-white border-slate-950 font-black'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* OPACIDAD */}
                          <div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-600 mb-1">
                              <span>Transparencia / Opacidad</span>
                              <span>{Math.round(watermarkOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="1.0"
                              step="0.05"
                              value={watermarkOpacity}
                              onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                              className="w-full accent-idac-blue cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. AJUSTES Y FILTROS MANUALES */}
                {activeTab === 'filters' && (
                  <div className="space-y-4 text-xs font-bold text-slate-700">
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-500" /> Brillo
                        </span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="180"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        onPointerUp={() => saveSnapshot()}
                        onTouchEnd={() => saveSnapshot()}
                        className="w-full accent-idac-blue cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        <span>Contraste</span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="180"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        onPointerUp={() => saveSnapshot()}
                        onTouchEnd={() => saveSnapshot()}
                        className="w-full accent-idac-blue cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        <span>Saturación</span>
                        <span>{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        onPointerUp={() => saveSnapshot()}
                        onTouchEnd={() => saveSnapshot()}
                        className="w-full accent-idac-blue cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        <span>Blanco y Negro (Escala Grises)</span>
                        <span>{grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={grayscale}
                        onChange={(e) => setGrayscale(Number(e.target.value))}
                        onPointerUp={() => saveSnapshot()}
                        onTouchEnd={() => saveSnapshot()}
                        className="w-full accent-idac-blue cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        <span>Tono Sepia</span>
                        <span>{sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sepia}
                        onChange={(e) => setSepia(Number(e.target.value))}
                        onPointerUp={() => saveSnapshot()}
                        onTouchEnd={() => saveSnapshot()}
                        className="w-full accent-idac-blue cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">
                        <span>Desenfoque (Blur)</span>
                        <span>{blur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                        onPointerUp={() => saveSnapshot()}
                        onTouchEnd={() => saveSnapshot()}
                        className="w-full accent-idac-blue cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BOTONES DE ACCIÓN EN EL PIE DEL PANEL */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  className="w-full py-2.5 px-4 rounded-xl bg-idac-blue hover:bg-idac-dark text-white text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Aplicar y Guardar Cambios</span>
                </button>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block text-center">
                    Opciones de Exportación PNG
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownload(true)}
                      className="py-2 px-2.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-idac-blue text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-2xs"
                      title="Descargar imagen incluyendo la marca de agua o sello"
                    >
                      <Download className="w-3.5 h-3.5 text-idac-blue" />
                      <span>CON Marca de Agua</span>
                    </button>

                    <button
                      onClick={() => handleDownload(false)}
                      className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-2xs"
                      title="Descargar imagen limpia sin sello ni marca de agua"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>SIN Marca de Agua</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowShareDropdown(!showShareDropdown)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir Foto</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
