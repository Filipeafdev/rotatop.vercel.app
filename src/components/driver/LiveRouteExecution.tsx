import React, { useState } from 'react';
import { Route, Stop } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  TrendingUp,
  DollarSign,
  Fuel,
  Weight,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface LiveRouteExecutionProps {
  route: Route;
  onFinishEntireRoute?: () => void;
  onClearRoute?: () => void;
}

export const LiveRouteExecution: React.FC<LiveRouteExecutionProps> = ({
  route,
  onFinishEntireRoute,
  onClearRoute,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const totalStops = route.stops.length;
  const completedStops = route.stops.filter((s) => s.status === 'entregue').length;
  const canceledStops = route.stops.filter((s) => s.status === 'cancelada').length;
  const pendingStops = route.stops.filter(
    (s) => s.status === 'pendente' || s.status === 'reentregar'
  ).length;

  const percentComplete =
    totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const remainingWeight = Math.max(0, route.totalWeight - route.deliveredWeight);

  const nextStop = [...route.stops]
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    .find((s) => s.status === 'pendente' || s.status === 'reentregar');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
      {/* Top Bar with Progress Percentage */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight uppercase">
              Progresso do Dia
            </h2>
            <p className="text-xs text-slate-400">
              {completedStops} de {totalStops} entregas concluídas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onClearRoute && route.stops.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Apagar rota ativa atual"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apagar Rota Ativa</span>
            </button>
          )}

          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {percentComplete}%
            </span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden relative">
        <div
          className="bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* KPI Counters (Peso Restante, Valor Real Coletado, KM) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
        {/* Real Collected Value */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Coletado</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-black text-emerald-400">
              R$ {route.deliveredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-[10px] text-slate-500">
              de R$ {route.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Cargo Weight Remaining in Truck */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Peso no Baú</span>
            <Weight className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-black text-white">
              {remainingWeight.toFixed(0)} <span className="text-xs font-normal text-slate-400">kg</span>
            </span>
            <span className="block text-[10px] text-slate-500">
              {route.deliveredWeight.toFixed(0)} kg descarregados
            </span>
          </div>
        </div>

        {/* Deliveries Breakdown */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Status</span>
            <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              {completedStops} ✓
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
              {pendingStops} ⏳
            </span>
            {canceledStops > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                {canceledStops} ✕
              </span>
            )}
          </div>
        </div>

        {/* Estimated Fuel Cost */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Combustível</span>
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-black text-amber-400">
              R$ {route.estimatedFuelCost.toFixed(2)}
            </span>
            <span className="block text-[10px] text-slate-500">
              {route.totalKm} km @ {route.avgKmLiter} km/L
            </span>
          </div>
        </div>
      </div>

      {/* Next Stop Callout for Instant Navigation */}
      {nextStop && (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-950 border border-blue-600/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              #{nextStop.sequenceIndex}
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                Próxima Parada
              </span>
              <p className="text-xs font-bold text-white truncate">{nextStop.clientName}</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 shrink-0">
            {nextStop.totalWeight} kg • R$ {nextStop.orderValue.toFixed(2)}
          </span>
        </div>
      )}

      {/* Completed All Deliveries Celebration Banner */}
      {pendingStops === 0 && totalStops > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center animate-in fade-in">
          <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <h4 className="text-sm font-extrabold text-emerald-300">
            Todas as Entregas do Romaneio Concluídas!
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            Hora de retornar à base ou residência. Quilometragem produtiva finalizada com sucesso.
          </p>
          {onFinishEntireRoute && (
            <button
              onClick={onFinishEntireRoute}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/50"
            >
              Concluir & Fechar Rota
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal to Clear Active Route */}
      <ConfirmModal
        isOpen={showConfirmClear}
        title="Apagar Rota Ativa Atual?"
        description={`Tem certeza que deseja apagar a rota ativa com ${totalStops} parada(s)? Todas as entregas cadastradas, valores calculados e o traçado de GPS serão limpos para você iniciar um novo romaneio.`}
        confirmLabel="Sim, Apagar Rota Ativa"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          setShowConfirmClear(false);
          onClearRoute?.();
        }}
        onCancel={() => setShowConfirmClear(false)}
      />
    </div>
  );
};
