import React, { useState, useEffect } from 'react';
import { Route, Stop, AddressSuggestion } from '../../types';
import { searchAddressBR } from '../../lib/geocoding';
import { optimizeRouteStops } from '../../lib/routeOptimizer';
import {
  MapPin,
  Building2,
  Home,
  Plus,
  Zap,
  Sparkles,
  Search,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCw,
} from 'lucide-react';

interface RouteBuilderProps {
  route: Route;
  onUpdateRoute: (updated: Route) => void;
  onOpenOcrModal: () => void;
}

export const RouteBuilder: React.FC<RouteBuilderProps> = ({
  route,
  onUpdateRoute,
  onOpenOcrModal,
}) => {
  // Base addresses state
  const [startAddress, setStartAddress] = useState(route.startAddress);
  const [endAddress, setEndAddress] = useState(route.endAddress);
  const [startSuggestions, setStartSuggestions] = useState<AddressSuggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);

  // New Stop Form
  const [clientName, setClientName] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [orderValue, setOrderValue] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'a_vista' | 'a_prazo'>('a_vista');
  const [notes, setNotes] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // Handle Autocomplete for Stop Address
  useEffect(() => {
    if (addressInput.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      const results = await searchAddressBR(addressInput);
      setAddressSuggestions(results);
      setIsSearchingAddress(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [addressInput]);

  // Handle Autocomplete for Start Address
  const handleStartSearch = async (val: string) => {
    setStartAddress(val);
    if (val.length >= 3) {
      setIsSearchingStart(true);
      const res = await searchAddressBR(val);
      setStartSuggestions(res);
      setIsSearchingStart(false);
    } else {
      setStartSuggestions([]);
    }
  };

  // Handle Autocomplete for End Address
  const handleEndSearch = async (val: string) => {
    setEndAddress(val);
    if (val.length >= 3) {
      setIsSearchingEnd(true);
      const res = await searchAddressBR(val);
      setEndSuggestions(res);
      setIsSearchingEnd(false);
    } else {
      setEndSuggestions([]);
    }
  };

  const handleSelectStart = (sug: AddressSuggestion) => {
    setStartAddress(sug.displayName);
    setStartSuggestions([]);
    onUpdateRoute({
      ...route,
      startAddress: sug.displayName,
      startCoords: { lat: sug.lat, lng: sug.lng },
    });
  };

  const handleSelectEnd = (sug: AddressSuggestion) => {
    setEndAddress(sug.displayName);
    setEndSuggestions([]);
    onUpdateRoute({
      ...route,
      endAddress: sug.displayName,
      endCoords: { lat: sug.lat, lng: sug.lng },
    });
  };

  const handleSelectStopAddress = (sug: AddressSuggestion) => {
    setAddressInput(sug.displayName);
    setSelectedCoords({ lat: sug.lat, lng: sug.lng });
    setAddressSuggestions([]);
  };

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !addressInput.trim()) return;

    // Use selected coordinates or generate approximate Brazilian coordinates
    const coords = selectedCoords || {
      lat: -23.5505 + (Math.random() - 0.5) * 0.08,
      lng: -46.6333 + (Math.random() - 0.5) * 0.08,
    };

    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      routeId: route.id,
      sequenceIndex: route.stops.length + 1,
      clientName: clientName.trim(),
      address: addressInput.trim(),
      lat: coords.lat,
      lng: coords.lng,
      orderValue: parseFloat(orderValue) || 120.0,
      totalWeight: parseFloat(totalWeight) || 15.0,
      isPriority,
      paymentMethod,
      notes: notes.trim(),
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };

    const updatedStops = [...route.stops, newStop];
    const totalWeightSum = updatedStops.reduce((acc, s) => acc + s.totalWeight, 0);
    const totalValueSum = updatedStops.reduce((acc, s) => acc + s.orderValue, 0);

    // Auto calculate route metrics
    const opt = optimizeRouteStops(
      updatedStops,
      route.startCoords,
      route.endCoords,
      route.avgKmLiter,
      route.fuelPrice
    );

    onUpdateRoute({
      ...route,
      stops: opt.orderedStops,
      productiveKm: opt.productiveKm,
      unproductiveKm: opt.unproductiveKm,
      totalKm: opt.totalKm,
      estimatedFuelCost: opt.estimatedFuelCost,
      totalWeight: totalWeightSum,
      totalValue: totalValueSum,
    });

    // Reset Form
    setClientName('');
    setAddressInput('');
    setSelectedCoords(null);
    setOrderValue('');
    setTotalWeight('');
    setIsPriority(false);
    setNotes('');
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 2500);
  };

  const handleOptimizeRoute = () => {
    const opt = optimizeRouteStops(
      route.stops,
      route.startCoords,
      route.endCoords,
      route.avgKmLiter,
      route.fuelPrice
    );

    onUpdateRoute({
      ...route,
      stops: opt.orderedStops,
      productiveKm: opt.productiveKm,
      unproductiveKm: opt.unproductiveKm,
      totalKm: opt.totalKm,
      estimatedFuelCost: opt.estimatedFuelCost,
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. Base Locations (Company CD vs Driver's Home) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Endereços de Base (Cálculo de KM Vazio)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Origem da Carga e Destino Final
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Start Address (Company CD) */}
          <div className="relative">
            <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Ponto de Saída (Empresa / Galpão)
            </label>
            <div className="relative">
              <input
                type="text"
                value={startAddress}
                onChange={(e) => handleStartSearch(e.target.value)}
                placeholder="Ex: CD Anhanguera, São Paulo"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-8"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
            </div>

            {startSuggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {startSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectStart(sug)}
                    className="w-full text-left p-2 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 block"
                  >
                    <p className="font-semibold">{sug.displayName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Address (Driver's Residence) */}
          <div className="relative">
            <label className="block text-xs font-bold text-purple-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
              Ponto de Chegada (Residência do Motorista)
            </label>
            <div className="relative">
              <input
                type="text"
                value={endAddress}
                onChange={(e) => handleEndSearch(e.target.value)}
                placeholder="Ex: R. Domingos de Morais, Vila Mariana"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 pr-8"
              />
              <Home className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
            </div>

            {endSuggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {endSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectEnd(sug)}
                    className="w-full text-left p-2 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 block"
                  >
                    <p className="font-semibold">{sug.displayName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Action Bar: OCR Import & Calculate Most Efficient Route */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenOcrModal}
          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-950 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Escanear Romaneio Físico (OCR com IA)</span>
        </button>

        <button
          type="button"
          onClick={handleOptimizeRoute}
          disabled={route.stops.length < 2}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>Calcular Rota Mais Eficiente</span>
        </button>
      </div>

      {/* 3. Manual Stop Registration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Adicionar Entrega Manual
            </h3>
          </div>
          {showAddSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Parada adicionada à rota!
            </span>
          )}
        </div>

        <form onSubmit={handleAddStop} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Client Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome do Cliente / Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Mercado Central Pinheiros"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Address with Robust Autocomplete for Brazil */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Endereço de Entrega (Brasil) *</span>
                {isSearchingAddress && (
                  <span className="text-[10px] text-blue-400 animate-pulse font-normal">
                    Buscando ruas...
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={addressInput}
                  onChange={(e) => {
                    setAddressInput(e.target.value);
                    setSelectedCoords(null);
                  }}
                  placeholder="Rua, número, bairro, cidade ou CEP..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 pr-8"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
              </div>

              {/* Autocomplete Dropdown */}
              {addressSuggestions.length > 0 && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                  {addressSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectStopAddress(sug)}
                      className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 block transition-colors"
                    >
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{sug.displayName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Value, Weight, Priority, Payment */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Valor do Pedido (R$)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-bold">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderValue}
                  onChange={(e) => setOrderValue(e.target.value)}
                  placeholder="250,00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Peso Total (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={totalWeight}
                  onChange={(e) => setTotalWeight(e.target.value)}
                  placeholder="35.0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-bold focus:outline-none focus:border-blue-500 pr-8"
                />
                <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-bold">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="a_vista">À Vista (PIX/Dinheiro)</option>
                <option value="a_prazo">A Prazo (Boleto/Faturado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Horário / Obs
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Entregar até 11h"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="rounded text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Marcar como Primeira Entrega (Prioridade Máxima)
              </span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-950 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir no Romaneio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
