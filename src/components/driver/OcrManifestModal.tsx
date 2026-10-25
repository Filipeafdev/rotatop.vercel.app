import React, { useState, useRef } from 'react';
import { ManifestItemDraft } from '../../types';
import { searchAddressBR } from '../../lib/geocoding';
import {
  Camera,
  FolderOpen,
  Sparkles,
  FileText,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  ClipboardPaste,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface OcrManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStops: (items: ManifestItemDraft[]) => void;
}

// Sample presets for optional testing ONLY
const PRESET_SAMPLE_MANIFESTS = [
  {
    name: 'Romaneio Bebidas & Alimentos (4 entregas)',
    tag: 'Distribuidora',
    items: [
      {
        id: 'ocr-sample-1',
        clientName: 'Mercado Bom Preço',
        address: 'R. Augusta, 1200, Consolação, São Paulo - SP',
        orderValue: 920.0,
        totalWeight: 130.0,
        isPriority: true,
        paymentMethod: 'a_vista' as const,
        notes: 'Descarregar fardos de água mineral e refrigerantes.',
      },
      {
        id: 'ocr-sample-2',
        clientName: 'Restaurante Bella Pasta',
        address: 'R. Oscar Freire, 800, Cerqueira César, São Paulo - SP',
        orderValue: 1450.0,
        totalWeight: 210.0,
        isPriority: false,
        paymentMethod: 'a_prazo' as const,
        notes: 'Entrega na cozinha após às 10h30.',
      },
      {
        id: 'ocr-sample-3',
        clientName: 'Bar & Lanchonete do Zé',
        address: 'Av. Brigadeiro Luís Antônio, 2050, Bela Vista, São Paulo - SP',
        orderValue: 480.0,
        totalWeight: 65.0,
        isPriority: false,
        paymentMethod: 'a_vista' as const,
        notes: 'Pagamento em dinheiro vivo.',
      },
      {
        id: 'ocr-sample-4',
        clientName: 'Padaria Estrela Dalva',
        address: 'R. Vergueiro, 2400, Vila Mariana, São Paulo - SP',
        orderValue: 710.0,
        totalWeight: 95.0,
        isPriority: false,
        paymentMethod: 'a_prazo' as const,
        notes: 'Receber com encarregada Marina.',
      },
    ],
  },
  {
    name: 'Romaneio E-commerce Express (3 entregas)',
    tag: 'Carga Fracionada',
    items: [
      {
        id: 'ocr-sample-5',
        clientName: 'Ana Cláudia Ferreira',
        address: 'Av. Paulista, 1578, Bela Vista, São Paulo - SP',
        orderValue: 380.0,
        totalWeight: 12.0,
        isPriority: true,
        paymentMethod: 'a_prazo' as const,
        notes: 'Portaria 24h - Deixar com porteiro.',
      },
      {
        id: 'ocr-sample-6',
        clientName: 'TecnoStore Informática',
        address: 'R. Santa Ifigênia, 450, Centro, São Paulo - SP',
        orderValue: 2890.0,
        totalWeight: 34.0,
        isPriority: false,
        paymentMethod: 'a_vista' as const,
        notes: 'Conferir número de série dos monitores.',
      },
      {
        id: 'ocr-sample-7',
        clientName: 'Studio Beleza Pura',
        address: 'R. Teodoro Sampaio, 1800, Pinheiros, São Paulo - SP',
        orderValue: 620.0,
        totalWeight: 22.0,
        isPriority: false,
        paymentMethod: 'a_prazo' as const,
        notes: 'Entregar para Marcela.',
      },
    ],
  },
];

/**
 * Compresses an image file on client side via canvas to max 1200px
 * to prevent payload bloat, timeout and ensure fast, accurate Gemini OCR
 */
function compressImageClient(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const OcrManifestModal: React.FC<OcrManifestModalProps> = ({
  isOpen,
  onClose,
  onImportStops,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ManifestItemDraft[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showImagePreviewInTable, setShowImagePreviewInTable] = useState(false);

  // Paste text mode
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Refs for gallery vs camera
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      setShowPasteMode(false);

      try {
        const compressed = await compressImageClient(file);
        setPreviewUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  // Helper to load the user's uploaded spreadsheet asset directly
  const handleLoadUploadedSample = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const res = await fetch('/assets/aistudio/image_0f309c5a.png');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setIsProcessing(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage('Não foi possível carregar a imagem do servidor.');
    }
  };

  const processImageWithOcr = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ocr-romaneio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: previewUrl,
          mimeType: 'image/jpeg',
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON server response:', errorText);
        throw new Error(
          'O servidor de IA retornou uma resposta inesperada. Tente novamente em alguns segundos ou use a digitação assistida com a foto ao lado.'
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            'Não foi possível extrair dados automaticamente. O serviço de IA pode estar com alta demanda temporária.'
        );
      }

      // Check if server directly parsed items
      if (Array.isArray(result.items) && result.items.length > 0) {
        setExtractedItems(result.items);
        setShowImagePreviewInTable(true);
        return;
      }

      // Fallback parser if server returned raw text in data field
      let rawText = result.data || '';
      let cleanJson = rawText.trim();

      const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanJson = codeBlockMatch[1];
      } else {
        const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          cleanJson = arrayMatch[0];
        }
      }

      const parsed = JSON.parse(cleanJson);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(
          'A IA processou a imagem, mas não encontrou uma lista clara de entregas. Você pode preencher os campos abaixo com a imagem ao lado.'
        );
      }

      const formatted: ManifestItemDraft[] = parsed.map((item: any, idx: number) => ({
        id: `ocr-item-${Date.now()}-${idx}`,
        clientName: item.clientName || `Cliente ${idx + 1}`,
        address: item.address || 'Campinas - SP',
        orderValue: Number(item.orderValue) || 0,
        totalWeight: Number(item.totalWeight) || 0,
        isPriority: Boolean(item.isPriority || idx === 0),
        paymentMethod: item.paymentMethod === 'a_prazo' ? 'a_prazo' : 'a_vista',
        notes: item.notes || '',
      }));

      setExtractedItems(formatted);
      setShowImagePreviewInTable(true);
    } catch (err: any) {
      console.error('OCR processing error:', err);
      // NEVER silently substitute fake data!
      setErrorMessage(
        err.message ||
          'Falha na leitura automática da imagem. Você pode tentar novamente, colar o texto ou digitar as paradas.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert pasted text lines into stops
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;

    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    const generated: ManifestItemDraft[] = lines.map((line, idx) => {
      // Try to extract client and address if separated by comma or dash
      const parts = line.split(/[-–—|;]/);
      const client = parts[0]?.trim() || `Parada ${idx + 1}`;
      const addr = parts.slice(1).join(' ').trim() || line;

      return {
        id: `pasted-${Date.now()}-${idx}`,
        clientName: client,
        address: addr,
        orderValue: 150.0,
        totalWeight: 15.0,
        isPriority: idx === 0,
        paymentMethod: 'a_vista',
        notes: '',
      };
    });

    setExtractedItems(generated);
    setShowPasteMode(false);
    setErrorMessage(null);
  };

  // Start manual entry with user's uploaded image displayed side by side
  const handleStartManualWithImage = () => {
    setExtractedItems([
      {
        id: `manual-${Date.now()}-1`,
        clientName: '',
        address: '',
        orderValue: 0,
        totalWeight: 0,
        isPriority: true,
        paymentMethod: 'a_vista',
        notes: '',
      },
    ]);
    setShowImagePreviewInTable(true);
    setErrorMessage(null);
  };

  const handleUpdateItem = (id: string, field: keyof ManifestItemDraft, value: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewItem = () => {
    const newItem: ManifestItemDraft = {
      id: `manual-${Date.now()}`,
      clientName: '',
      address: '',
      orderValue: 0,
      totalWeight: 0,
      isPriority: false,
      paymentMethod: 'a_vista',
      notes: '',
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  const handleConfirmImport = async () => {
    if (extractedItems.length === 0) return;

    setIsProcessing(true);
    const resolvedItems: ManifestItemDraft[] = [];

    for (const item of extractedItems) {
      if (!item.address.trim()) continue;
      const suggestions = await searchAddressBR(item.address);
      if (suggestions.length > 0) {
        resolvedItems.push({
          ...item,
          lat: suggestions[0].lat,
          lng: suggestions[0].lng,
          address: suggestions[0].displayName,
        });
      } else {
        resolvedItems.push({
          ...item,
          lat: -23.5505 + (Math.random() - 0.5) * 0.05,
          lng: -46.6333 + (Math.random() - 0.5) * 0.05,
        });
      }
    }

    setIsProcessing(false);
    onImportStops(resolvedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Leitura de Romaneio Físico por Imagem (OCR / IA)
              </h2>
              <p className="text-xs text-slate-400">
                Extração precisa de tabelas de entrega, notas fiscais e pranchetas de carga
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Error Notification Banner with Actionable Solutions */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs animate-in fade-in space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-white block">Status da Extração:</strong>
                <p className="text-slate-300 mt-0.5">{errorMessage}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-800/60 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={processImageWithOcr}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1 shadow cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tentar Novamente com a IA</span>
              </button>

              <button
                type="button"
                onClick={handleStartManualWithImage}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>Digitar Olhando a Foto</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteMode(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3 text-blue-400" />
                <span>Colar Texto de Mensagem</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 1: UPLOAD / CAMERA SELECTION */}
        {extractedItems.length === 0 && !showPasteMode && (
          <div>
            {previewUrl ? (
              <div className="border border-slate-700 bg-slate-950 rounded-2xl p-4 text-center mb-4">
                <div className="relative inline-block max-w-full">
                  <img
                    src={previewUrl}
                    alt="Romaneio selecionado"
                    className="max-h-64 sm:max-h-72 rounded-xl object-contain mx-auto border border-slate-800 shadow-xl mb-3"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded-md border border-slate-700 font-semibold">
                    Imagem Pronta para OCR
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Trocar da Galeria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tirar Outra Foto</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={processImageWithOcr}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Extraindo paradas da imagem com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span>Extrair Dados Desta Imagem com IA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleStartManualWithImage}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Preencher Olhando a Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                {/* 0. Imagem Anexada pelo Usuário */}
                <div
                  onClick={handleLoadUploadedSample}
                  className="border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-amber-950/25 hover:bg-amber-950/40 rounded-2xl p-4 sm:p-5 text-left cursor-pointer transition-all group flex items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-md">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                          Sua Imagem Recém-Enviada
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-1">
                        Carregar Planilha de Romaneio (Campinas - 17 Entregas)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Clique aqui para carregar a imagem da planilha que você enviou e extrair automaticamente com a IA.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shrink-0 group-hover:translate-x-0.5 transition-transform">
                    Carregar Foto →
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Escolher da Galeria */}
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-blue-950/20 hover:bg-blue-950/35 rounded-2xl p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-all shadow-lg">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-white mb-1">
                      Selecionar da Galeria de Fotos
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Escolha fotos, prints de notas fiscais ou romaneios do celular ou PC.
                    </p>
                    <span className="mt-2.5 text-xs font-bold text-blue-400 group-hover:underline flex items-center gap-1">
                      Abrir Galeria de Fotos →
                    </span>
                  </div>

                  {/* 2. Tirar Foto */}
                  <div
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/35 rounded-2xl p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-all shadow-lg">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-white mb-1">
                      Tirar Foto com a Câmera
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Abra a câmera do aparelho para fotografar pranchetas ou canhotos.
                    </p>
                    <span className="mt-2.5 text-xs font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
                      Abrir Câmera Agora →
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Presets (explicitly labeled as examples) */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Testar com Romaneio de Exemplo (Opcional):
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasteMode(true)}
                  className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Colar Texto de Mensagem</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_SAMPLE_MANIFESTS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setExtractedItems(preset.items);
                      setPreviewUrl(null);
                      setErrorMessage(null);
                    }}
                    className="p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold block">
                        [Exemplo Fictício]
                      </span>
                      <strong className="text-white text-xs">{preset.name}</strong>
                    </div>
                    <span className="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: PASTE TEXT MODE */}
        {showPasteMode && extractedItems.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-blue-400" />
                <span>Colar Lista de Entregas (Texto / WhatsApp)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPasteMode(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Voltar à Foto
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Cole abaixo as linhas com nomes de clientes e endereços (uma por linha):
            </p>

            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Exemplo:\nMercado Central - Av. Brigadeiro Faria Lima, 2232, São Paulo\nDrogaria Silva - Av. Paulista, 1000, São Paulo\nAuto Peças - Av. do Estado, 5500, São Paulo`}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteMode(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg"
              >
                Converter em Paradas
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: EDITABLE EXTRACTED ITEMS TABLE WITH PHOTO COMPARISON */}
        {extractedItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {extractedItems.length} Paradas Prontas
                </span>
                <span className="text-xs text-slate-400">
                  Verifique e edite os dados do seu romaneio:
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => setShowImagePreviewInTable(!showImagePreviewInTable)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 rounded-lg border border-slate-700 flex items-center gap-1 transition-all"
                  >
                    {showImagePreviewInTable ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar Foto</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Foto do Romaneio</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-400 rounded-lg border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Linha</span>
                </button>
              </div>
            </div>

            {/* Side-by-side or collapsible image preview */}
            {previewUrl && showImagePreviewInTable && (
              <div className="mb-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                <img
                  src={previewUrl}
                  alt="Foto do Romaneio"
                  className="max-h-36 rounded-lg object-contain border border-slate-700 shadow"
                />
                <div className="text-xs text-slate-400 leading-snug flex-1">
                  <p className="font-bold text-white mb-1">Foto Original do Romaneio</p>
                  <span>
                    Compare visualmente as linhas da tabela abaixo com a imagem fotografada do seu romaneio.
                  </span>
                </div>
              </div>
            )}

            {/* Scrollable Editable List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
              {extractedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.clientName}
                        onChange={(e) => handleUpdateItem(item.id, 'clientName', e.target.value)}
                        placeholder="Nome do Cliente ou Loja *"
                        className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none flex-1 px-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <input
                          type="checkbox"
                          checked={item.isPriority}
                          onChange={(e) => handleUpdateItem(item.id, 'isPriority', e.target.checked)}
                          className="rounded text-red-600 focus:ring-0"
                        />
                        <span className="text-[10px] font-bold text-rose-400">Prioridade</span>
                      </label>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remover parada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.address}
                    onChange={(e) => handleUpdateItem(item.id, 'address', e.target.value)}
                    placeholder="Endereço de entrega completo (Rua, Número, Bairro, Cidade) *"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs mb-2 focus:outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Valor (R$)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.orderValue}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'orderValue', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Peso (kg)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={item.totalWeight}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'totalWeight', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Pagamento</span>
                      <select
                        value={item.paymentMethod}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'paymentMethod', e.target.value as any)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="a_vista">À Vista</option>
                        <option value="a_prazo">A Prazo</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Obs / Horário</span>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                        placeholder="Ex: doca 2"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setExtractedItems([]);
                  setPreviewUrl(null);
                  setErrorMessage(null);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Escolher Outra Foto</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando Endereços com Google Maps...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar e Gerar Rota Automática</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
