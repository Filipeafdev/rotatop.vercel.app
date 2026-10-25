import React, { useState, useEffect, useRef } from 'react';
import { Route, Stop, AddressSuggestion } from '../../types';
import { searchAddressBR, resolveGoogleCoordinates, getCityAnchor } from '../../lib/geocoding';
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
  Compass,
  Check,
  X,
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

  // Debounce for Start Address Autocomplete
  useEffect(() => {
    if (!startAddress || startAddress.trim().length < 2) {
      setStartSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingStart(true);
      const results = await searchAddressBR(startAddress);
      setStartSuggestions(results);
      setIsSearchingStart(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [startAddress]);

  // Debounce for End Address Autocomplete
  useEffect(() => {
    if (!endAddress || endAddress.trim().length < 2) {
      setEndSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingEnd(true);
      const results = await searchAddressBR(endAddress);
      setEndSuggestions(results);
      setIsSearchingEnd(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [endAddress]);

  // Debounce for Stop Address Autocomplete
  useEffect(() => {
    if (!addressInput || addressInput.trim().length < 2) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      const results = await searchAddressBR(addressInput);
      setAddressSuggestions(results);
      setIsSearchingAddress(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [addressInput]);

  const handleSelectStart = async (sug: AddressSuggestion) => {
    setStartAddress(sug.displayName);
    setStartSuggestions([]);
    let lat = sug.lat;
    let lng = sug.lng;
    if (sug.placeId) {
      const resolved = await resolveGoogleCoordinates(sug.placeId, sug.displayName);
      if (resolved) {
        lat = resolved.lat;
        lng = resolved.lng;
      }
    }
    onUpdateRoute({
      ...route,
      startAddress: sug.displayName,
      startCoords: { lat, lng },
    });
  };

  const handleSelectEnd = async (sug: AddressSuggestion) => {
    setEndAddress(sug.displayName);
    setEndSuggestions([]);
    let lat = sug.lat;
    let lng = sug.lng;
    if (sug.placeId) {
      const resolved = await resolveGoogleCoordinates(sug.placeId, sug.displayName);
      if (resolved) {
        lat = resolved.lat;
        lng = resolved.lng;
      }
    }
    onUpdateRoute({
      ...route,
      endAddress: sug.displayName,
      endCoords: { lat, lng },
    });
  };

  const handleSelectStopAddress = async (sug: AddressSuggestion) => {
    setAddressInput(sug.displayName);
    setAddressSuggestions([]);
    let lat = sug.lat;
    let lng = sug.lng;
    if (sug.placeId) {
      const resolved = await resolveGoogleCoordinates(sug.placeId, sug.displayName);
      if (resolved) {
        lat = resolved.lat;
        lng = resolved.lng;
      }
    }
    setSelectedCoords({ lat, lng });
  };

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !addressInput.trim()) return;

    const anchor = getCityAnchor(addressInput);
    const coords = selectedCoords || {
      lat: anchor.lat + (Math.random() - 0.5) * 0.04,
      lng: anchor.lng + (Math.random() - 0.5) * 0.04,
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
              Endereços de Base (Google Maps Real)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded font-bold shadow-sm">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span>Google Maps Autocomplete Ativo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Address (Company CD) */}
          <div className="relative">
            <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Ponto de Saída (Empresa / Galpão / CD)
              </span>
              {isSearchingStart && (
                <span className="text-[10px] text-blue-400 animate-pulse font-normal">
                  Buscando no Google Maps...
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                placeholder="Digite nome da empresa, galpão ou rua..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-3 pr-14 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {startAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartAddress('');
                      setStartSuggestions([]);
                    }}
                    className="p-1 text-slate-500 hover:text-white rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* Suggestions for Start Address */}
            {startSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                <div className="px-3 py-1 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>Resultados do Google Maps</span>
                  <span className="text-blue-400">Clique para selecionar</span>
                </div>
                {startSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectStart(sug)}
                    className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="truncate font-medium">{sug.displayName}</span>
                    </div>
                    {sug.source === 'google' ? (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold px-1.5 py-0.5 rounded shrink-0">
                        Google Maps
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                        Base
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Address (Driver's Residence) */}
          <div className="relative">
            <label className="block text-xs font-bold text-purple-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                Ponto de Chegada (Residência do Motorista)
              </span>
              {isSearchingEnd && (
                <span className="text-[10px] text-blue-400 animate-pulse font-normal">
                  Buscando no Google Maps...
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={endAddress}
                onChange={(e) => setEndAddress(e.target.value)}
                placeholder="Digite sua rua, bairro ou CEP residencial..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-3 pr-14 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {endAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setEndAddress('');
                      setEndSuggestions([]);
                    }}
                    className="p-1 text-slate-500 hover:text-white rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <Home className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
            </div>

            {/* Suggestions for End Address */}
            {endSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                <div className="px-3 py-1 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>Resultados do Google Maps</span>
                  <span className="text-blue-400">Clique para selecionar</span>
                </div>
                {endSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectEnd(sug)}
                    className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="truncate font-medium">{sug.displayName}</span>
                    </div>
                    {sug.source === 'google' ? (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold px-1.5 py-0.5 rounded shrink-0">
                        Google Maps
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                        Base
                      </span>
                    )}
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
          <span>Escanear / Galeria de Romaneio (OCR com IA)</span>
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
              Adicionar Entrega Manual com Google Maps
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

            <div className="relative">
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>Endereço de Entrega (Google Maps Real) *</span>
                </span>
                {isSearchingAddress && (
                  <span className="text-[10px] text-blue-400 animate-pulse font-normal">
                    Consultando Google Places...
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
                  placeholder="Digite rua, número, bairro ou cidade..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 pr-8"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
              </div>

              {/* Autocomplete Dropdown */}
              {addressSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <div className="px-3 py-1 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Resultados do Google Maps</span>
                    <span className="text-blue-400">Clique para selecionar</span>
                  </div>
                  {addressSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectStopAddress(sug)}
                      className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="truncate">{sug.displayName}</span>
                      </div>
                      {sug.source === 'google' ? (
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-1.5 py-0.5 rounded shrink-0">
                          Google Maps
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                          Base
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
