import React, { useState } from 'react';
import { Route } from '../../types';
import {
  Fuel,
  Gauge,
  TrendingDown,
  TrendingUp,
  DollarSign,
  MapPin,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface FinancialSummaryProps {
  route: Route;
  onUpdateParams?: (avgKmLiter: number, fuelPrice: number) => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  route,
  onUpdateParams,
}) => {
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [customAvgKm, setCustomAvgKm] = useState(route.avgKmLiter.toString());
  const [customFuelPrice, setCustomFuelPrice] = useState(route.fuelPrice.toString());

  const handleSaveParams = () => {
    const kmL = parseFloat(customAvgKm) || 8.5;
    const price = parseFloat(customFuelPrice) || 6.29;
    if (onUpdateParams) {
      onUpdateParams(kmL, price);
    }
    setIsEditingParams(false);
  };

  const totalKm = route.totalKm > 0 ? route.totalKm : 1;
  const productivePct = Math.round((route.productiveKm / totalKm) * 100);
  const unproductivePct = 100 - productivePct;

  const costPerKm = (route.estimatedFuelCost / totalKm).toFixed(2);
  const totalFuelLiters = (route.totalKm / (route.avgKmLiter || 1)).toFixed(1);

  // Estimated gross revenue vs fuel expense
  const estimatedFreightRevenue = route.totalValue * 0.12; // Typical freight tariff 10-15% of cargo value or custom
  const netOperatingMargin = Math.max(0, route.deliveredValue - route.estimatedFuelCost);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Controle Financeiro de Combustível
            </h3>
            <p className="text-xs text-slate-400">
              Cálculo exato de consumo, eficiência e custo de rota
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditingParams(!isEditingParams)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
        >
          {isEditingParams ? 'Cancelar' : 'Ajustar Parâmetros'}
        </button>
      </div>

      {/* Editing Form */}
      {isEditingParams && (
        <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-amber-500/40 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Consumo do Veículo (KM por Litro)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                value={customAvgKm}
                onChange={(e) => setCustomAvgKm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">
                km/l
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Preço do Combustível (R$/Litro)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={customFuelPrice}
                onChange={(e) => setCustomFuelPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={handleSaveParams}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Recalcular Custos
            </button>
          </div>
        </div>
      )}

      {/* Big Fuel Cost Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-gradient-to-br from-amber-950/40 to-slate-950 border border-amber-500/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Custo Estimado de Combustível
            </span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              R$ {route.estimatedFuelCost.toFixed(2)}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Aprox. {totalFuelLiters} L de combustível consumidos
            </span>
          </div>
          <div className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-mono">
            Fórmula: ({route.totalKm}km ÷ {route.avgKmLiter}km/l) × R${route.fuelPrice}/l
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Custo Médio por KM
            </span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
              R$ {costPerKm}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              por quilômetro rodado
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Média do veículo: <strong className="text-white">{route.avgKmLiter} KM/L</strong>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Valor Coletado vs Custo
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              R$ {netOperatingMargin.toFixed(2)}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Saldo pós-desconto de combustível
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Total entregue: <strong className="text-emerald-400">R$ {route.deliveredValue.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* KM Produtiva vs KM Improdutiva Breakdown */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Balanço de Quilometragem (Produtiva vs Improdutiva)
          </span>
          <span className="text-xs font-black text-white">{route.totalKm} KM Total</span>
        </div>

        {/* Visual Split Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 flex overflow-hidden border border-slate-800 mb-3">
          <div
            className="bg-blue-500 h-full transition-all duration-500"
            style={{ width: `${productivePct}%` }}
            title={`KM Produtiva: ${route.productiveKm} km (${productivePct}%)`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-500"
            style={{ width: `${unproductivePct}%` }}
            title={`KM Improdutiva: ${route.unproductiveKm} km (${unproductivePct}%)`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                KM Produtiva (Com Carga)
              </span>
              <strong className="text-white font-mono text-sm">{route.productiveKm} km</strong>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Distância rodada da 1ª parada até a última entrega do romaneio ({productivePct}% do percurso).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                KM Improdutiva (Veículo Vazio)
              </span>
              <strong className="text-white font-mono text-sm">{route.unproductiveKm} km</strong>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Deslocamento do CD até o início das entregas + retorno da última entrega até a sua residência ({unproductivePct}%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
