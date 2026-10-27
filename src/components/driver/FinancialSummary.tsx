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
  Home,
  Building2,
  Flag,
  CheckCircle2,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface FinancialSummaryProps {
  route: Route;
  onUpdateParams?: (avgKmLiter: number, fuelPrice: number) => void;
  onUpdateRoute?: (updated: Route) => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  route,
  onUpdateParams,
  onUpdateRoute,
}) => {
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [customAvgKm, setCustomAvgKm] = useState(route.avgKmLiter.toString());
  const [customFuelPrice, setCustomFuelPrice] = useState(route.fuelPrice.toString());

  // Real Odometer Inputs (Saída de Casa -> CD Empresa -> Retorno CD -> Chegada em Casa)
  const [odoStartHome, setOdoStartHome] = useState(route.odometerStartHome?.toString() || '');
  const [odoStartCompany, setOdoStartCompany] = useState(route.odometerStartCompany?.toString() || '');
  const [odoEndCompany, setOdoEndCompany] = useState(route.odometerEndCompany?.toString() || '');
  const [odoEndHome, setOdoEndHome] = useState(route.odometerEndHome?.toString() || '');
  const [odoSavedSuccess, setOdoSavedSuccess] = useState(false);

  // Parse Odometer Numbers
  const nOdoStartHome = parseFloat(odoStartHome) || 0;
  const nOdoStartCompany = parseFloat(odoStartCompany) || 0;
  const nOdoEndCompany = parseFloat(odoEndCompany) || 0;
  const nOdoEndHome = parseFloat(odoEndHome) || 0;

  // Real-time calculation of legs based on odometers
  const morningUnprod =
    nOdoStartCompany > nOdoStartHome && nOdoStartHome > 0
      ? Number((nOdoStartCompany - nOdoStartHome).toFixed(1))
      : 0;

  const deliveriesProd =
    nOdoEndCompany > nOdoStartCompany && nOdoStartCompany > 0
      ? Number((nOdoEndCompany - nOdoStartCompany).toFixed(1))
      : 0;

  const eveningUnprod =
    nOdoEndHome > nOdoEndCompany && nOdoEndCompany > 0
      ? Number((nOdoEndHome - nOdoEndCompany).toFixed(1))
      : 0;

  const totalOdoUnproductive = Number((morningUnprod + eveningUnprod).toFixed(1));
  const totalOdoKm =
    nOdoEndHome > nOdoStartHome && nOdoStartHome > 0
      ? Number((nOdoEndHome - nOdoStartHome).toFixed(1))
      : Number((deliveriesProd + totalOdoUnproductive).toFixed(1));

  const handleSaveOdometer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRoute) return;

    const finalProd = deliveriesProd > 0 ? deliveriesProd : route.productiveKm;
    const finalUnprod = totalOdoUnproductive > 0 ? totalOdoUnproductive : route.unproductiveKm;
    const finalTotal = totalOdoKm > 0 ? totalOdoKm : finalProd + finalUnprod;
    const validAvg = route.avgKmLiter > 0 ? route.avgKmLiter : 8.5;
    const fuelCost = Number(((finalTotal / validAvg) * route.fuelPrice).toFixed(2));

    onUpdateRoute({
      ...route,
      odometerStartHome: nOdoStartHome || undefined,
      odometerStartCompany: nOdoStartCompany || undefined,
      odometerEndCompany: nOdoEndCompany || undefined,
      odometerEndHome: nOdoEndHome || undefined,
      odometerCalculated: true,
      productiveKm: finalProd,
      unproductiveKm: finalUnprod,
      totalKm: finalTotal,
      estimatedFuelCost: fuelCost,
      updatedAt: new Date().toISOString(),
    });

    setOdoSavedSuccess(true);
    setTimeout(() => setOdoSavedSuccess(false), 3000);
  };

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

      {/* Real Odometer Calibration Section */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mt-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Apuração de Odômetro Real (Saída de Casa ➔ Empresa ➔ Retorno Casa)
                </h4>
                {route.odometerCalculated && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Calibrado via Odômetro
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Digite os números do painel do seu veículo para calcular exatamente a KM improdutiva de deslocamento e a KM produtiva de carga.
              </p>
            </div>
          </div>

          {odoSavedSuccess && (
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Odômetro Calibrado com Sucesso!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveOdometer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1: Saída de Casa */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 focus-within:border-purple-500 transition-colors">
              <label className="block text-[11px] font-bold text-purple-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  1. Saída de Casa (Manhã)
                </span>
                <span className="text-[10px] text-slate-500">Início</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={odoStartHome}
                  onChange={(e) => setOdoStartHome(e.target.value)}
                  placeholder="Ex: 104200"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500 pr-9"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">
                  km
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Ao ligar o veículo para ir ao galpão</p>
            </div>

            {/* Step 2: Chegada Empresa / Saída p/ Entregas */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 focus-within:border-emerald-500 transition-colors">
              <label className="block text-[11px] font-bold text-emerald-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  2. Chegada no CD / Início
                </span>
                <span className="text-[10px] text-slate-500">Carga</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={odoStartCompany}
                  onChange={(e) => setOdoStartCompany(e.target.value)}
                  placeholder="Ex: 104218"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 pr-9"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">
                  km
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Ao carregar e sair para entregar</p>
            </div>

            {/* Step 3: Fim Entregas / Retorno CD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 focus-within:border-blue-500 transition-colors">
              <label className="block text-[11px] font-bold text-blue-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5" />
                  3. Fim Entregas / Retorno CD
                </span>
                <span className="text-[10px] text-slate-500">Descarga</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={odoEndCompany}
                  onChange={(e) => setOdoEndCompany(e.target.value)}
                  placeholder="Ex: 104285"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500 pr-9"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">
                  km
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Ao retornar à base vazia</p>
            </div>

            {/* Step 4: Chegada em Casa */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 focus-within:border-purple-500 transition-colors">
              <label className="block text-[11px] font-bold text-purple-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  4. Chegada em Casa (Noite)
                </span>
                <span className="text-[10px] text-slate-500">Fim</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={odoEndHome}
                  onChange={(e) => setOdoEndHome(e.target.value)}
                  placeholder="Ex: 104305"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500 pr-9"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">
                  km
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Ao estacionar na garagem de casa</p>
            </div>
          </div>

          {/* Real-Time Live Computed Metrics Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-purple-500/20">
              <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider">
                🚗 Improdutivo Manhã
              </span>
              <span className="text-sm font-black text-white font-mono mt-0.5 block">
                {morningUnprod > 0 ? `${morningUnprod} km` : '—'}
              </span>
              <span className="text-[9px] text-slate-500">Casa ➔ Empresa</span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-blue-500/20">
              <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wider">
                📦 Produtivo (Entregas)
              </span>
              <span className="text-sm font-black text-blue-400 font-mono mt-0.5 block">
                {deliveriesProd > 0 ? `${deliveriesProd} km` : `${route.productiveKm} km (est.)`}
              </span>
              <span className="text-[9px] text-slate-500">Com carga no baú</span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-purple-500/20">
              <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider">
                🚗 Improdutivo Volta
              </span>
              <span className="text-sm font-black text-white font-mono mt-0.5 block">
                {eveningUnprod > 0 ? `${eveningUnprod} km` : '—'}
              </span>
              <span className="text-[9px] text-slate-500">Empresa ➔ Casa</span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                ⛽ KM Total Apurado
              </span>
              <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                {totalOdoKm > 0 ? `${totalOdoKm} km` : `${route.totalKm} km`}
              </span>
              <span className="text-[9px] text-slate-500">Total rodado no dia</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-400">
              💡 <strong>Regra de Ouro:</strong> O apontamento manual do odômetro do veículo é a forma mais justa de compensação para a frota, pois audita o trajeto real sem depender apenas do sinal de GPS.
            </p>

            <button
              type="submit"
              disabled={!onUpdateRoute}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gravar e Calibrar Rota com Odômetro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
