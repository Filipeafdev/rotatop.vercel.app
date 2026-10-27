import React, { useState } from 'react';
import { Route } from '../../types';
import { AlertTriangle, Clock, ShieldCheck, X } from 'lucide-react';

interface RequestClosureDeletionModalProps {
  isOpen: boolean;
  route: Route | null;
  onClose: () => void;
  onSubmitRequest: (routeId: string, reason: string) => void;
}

export const RequestClosureDeletionModal: React.FC<RequestClosureDeletionModalProps> = ({
  isOpen,
  route,
  onClose,
  onSubmitRequest,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !route) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Por favor, informe uma justificativa detalhada (mínimo 5 caracteres).');
      return;
    }

    onSubmitRequest(route.id, reason.trim());
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Solicitar Exclusão de Fechamento</h3>
              <p className="text-xs text-amber-400 font-medium mt-0.5">
                Requer aprovação do Gestor da Frota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Para garantir a segurança financeira e integridade do histórico, o fechamento não é apagado de imediato. A solicitação ficará com status <strong>"Aguardando Aprovação"</strong> até a validação do gestor.
          </span>
        </div>

        {/* Route Details Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Data do Romaneio:</span>
            <strong className="text-white font-mono">{route.date}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Motorista / Veículo:</span>
            <span className="text-white">
              {route.driverName} • <strong className="text-amber-400 font-mono">{route.vehiclePlate}</strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Quilometragem Percorrida:</span>
            <strong className="text-blue-400 font-mono">{route.totalKm} KM</strong>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Valor Entregue / Faturado:</span>
            <strong className="text-emerald-400 font-mono">
              R$ {route.deliveredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Justification Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Justificativa Obrigatória da Exclusão *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Romaneio lançado em duplicidade; erro nos dados de km inseridos..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {error && <span className="text-[11px] text-rose-400 font-semibold mt-1 block">{error}</span>}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Enviar ao Gestor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
