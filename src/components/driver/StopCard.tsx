import React, { useState } from 'react';
import { Stop } from '../../types';
import { getGoogleMapsUrl, getWazeUrl } from '../../lib/geocoding';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Navigation,
  MapPin,
  Clock,
  DollarSign,
  Package,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StopCardProps {
  stop: Stop;
  isCurrentNext?: boolean;
  onFinish: (stopId: string) => void;
  onCancel: (stopId: string, reason: string) => void;
  onReschedule: (stopId: string) => void;
  onReopen?: (stopId: string) => void;
}

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  isCurrentNext,
  onFinish,
  onCancel,
  onReschedule,
  onReopen,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const googleMapsUrl = getGoogleMapsUrl(stop.lat, stop.lng, stop.address);
  const wazeUrl = getWazeUrl(stop.lat, stop.lng);

  const handleConfirmCancel = () => {
    onCancel(stop.id, cancelReason || 'Tentativa frustrada sem motivo registrado');
    setShowCancelModal(false);
    setCancelReason('');
  };

  const getStatusBorder = () => {
    if (stop.status === 'entregue') return 'border-emerald-600/40 bg-emerald-950/20';
    if (stop.status === 'cancelada') return 'border-rose-600/40 bg-rose-950/20 opacity-75';
    if (stop.status === 'reentregar') return 'border-amber-500 bg-amber-950/25 ring-2 ring-amber-500/30';
    if (isCurrentNext) return 'border-blue-500 bg-slate-900 ring-2 ring-blue-500/50 shadow-blue-900/20 shadow-xl';
    return 'border-slate-800 bg-slate-900/80';
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 p-4 md:p-5 ${getStatusBorder()}`}
    >
      {/* Top Header: Badge, Client, Priority */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md ${
              stop.status === 'entregue'
                ? 'bg-emerald-600'
                : stop.status === 'cancelada'
                ? 'bg-rose-600'
                : stop.status === 'reentregar'
                ? 'bg-amber-600 animate-pulse'
                : isCurrentNext
                ? 'bg-blue-600 ring-2 ring-blue-400'
                : 'bg-slate-700'
            }`}
          >
            #{stop.sequenceIndex}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {stop.clientName}
              </h3>
              {stop.isPriority && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Prioridade
                </span>
              )}
              {stop.status === 'reentregar' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Reentrega no Fim
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{stop.address}</span>
            </p>
          </div>
        </div>

        {/* Status Indicator Pill */}
        <div className="shrink-0">
          {stop.status === 'entregue' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Entregue
            </span>
          )}
          {stop.status === 'cancelada' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <XCircle className="w-3.5 h-3.5" />
              Cancelada
            </span>
          )}
          {stop.status === 'pendente' && isCurrentNext && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
              <Navigation className="w-3.5 h-3.5" />
              Próxima
            </span>
          )}
        </div>
      </div>

      {/* Info Pills (Value, Weight, Payment) */}
      <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60 flex flex-col">
          <span className="text-[10px] text-slate-500 font-medium">Valor do Pedido</span>
          <span className="font-extrabold text-emerald-400 text-sm mt-0.5">
            R$ {stop.orderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60 flex flex-col">
          <span className="text-[10px] text-slate-500 font-medium">Peso da Carga</span>
          <span className="font-bold text-slate-200 text-sm mt-0.5">{stop.totalWeight} kg</span>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60 flex flex-col">
          <span className="text-[10px] text-slate-500 font-medium">Pagamento</span>
          <span className="font-bold text-slate-300 text-xs mt-1 capitalize">
            {stop.paymentMethod === 'a_vista' ? '💵 À Vista' : '📄 A Prazo'}
          </span>
        </div>
      </div>

      {/* Observation Banner if exists */}
      {stop.notes && (
        <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span className="leading-snug">{stop.notes}</span>
        </div>
      )}

      {stop.cancelReason && stop.status === 'cancelada' && (
        <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
          <span>Motivo do cancelamento: <strong>{stop.cancelReason}</strong></span>
        </div>
      )}

      {/* Navigation Quick Links */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[44px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-400 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all shadow-sm"
        >
          <Navigation className="w-4 h-4 text-blue-400" />
          <span>Abrir no Google Maps</span>
        </a>

        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[44px] bg-cyan-950/40 hover:bg-cyan-900/40 active:scale-95 text-cyan-400 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-cyan-800/50 transition-all shadow-sm"
        >
          <Navigation className="w-4 h-4 text-cyan-400 rotate-45" />
          <span>Abrir no Waze</span>
        </a>
      </div>

      {/* Action Buttons for Stops */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {stop.status !== 'entregue' ? (
          <button
            onClick={() => onFinish(stop.id)}
            className="min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Finalizar</span>
          </button>
        ) : (
          <button
            onClick={() => onReopen && onReopen(stop.id)}
            className="min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all"
          >
            Reabrir
          </button>
        )}

        <button
          onClick={() => onReschedule(stop.id)}
          className="min-h-[48px] bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-950 transition-all cursor-pointer"
          title="Move esta entrega para o final da rota de hoje"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Reentregar</span>
        </button>

        {stop.status !== 'cancelada' ? (
          <button
            onClick={() => setShowCancelModal(true)}
            className="min-h-[48px] bg-rose-600/20 hover:bg-rose-600/30 active:scale-95 text-rose-300 border border-rose-500/40 font-bold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Cancelar</span>
          </button>
        ) : (
          <button
            onClick={() => onReopen && onReopen(stop.id)}
            className="min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all"
          >
            Reativar
          </button>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base mb-2">
              <AlertCircle className="w-5 h-5" />
              <span>Confirmar Cancelamento</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              A entrega de <strong>{stop.clientName}</strong> será marcada como cancelada e excluída dos totais arrecadados.
            </p>

            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Motivo do cancelamento (opcional):
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[
                'Cliente ausente',
                'Recusou mercadoria',
                'Endereço não localizado',
                'Falta de pagamento',
                'Horário estourado',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCancelReason(reason)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    cancelReason === reason
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Digite outro motivo ou observações..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 mb-4"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950"
              >
                Confirmar Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
