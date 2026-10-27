/**
 * Rotatop - Sistema de Gestão Logística, Romaneios Inteligentes e Controle de Fretes
 */
import React, { useState, useEffect } from 'react';
import {
  Route,
  Stop,
  UserProfile,
  UserRole,
  Vehicle,
  ManifestItemDraft,
  MaintenanceRecord,
  ClosureDeletionRequest,
  CompanyBase,
} from './types';
import { storage } from './lib/storage';
import { optimizeRouteStops } from './lib/routeOptimizer';
import { getCityAnchor } from './lib/geocoding';
import { Navbar } from './components/Navbar';
import { RouteMap } from './components/driver/RouteMap';
import { StopCard } from './components/driver/StopCard';
import { LiveRouteExecution } from './components/driver/LiveRouteExecution';
import { RouteBuilder } from './components/driver/RouteBuilder';
import { FinancialSummary } from './components/driver/FinancialSummary';
import { MaintenanceView } from './components/driver/MaintenanceView';
import { OcrManifestModal } from './components/driver/OcrManifestModal';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { DailyReportView } from './components/reports/DailyReportView';
import { AuthModal } from './components/auth/AuthModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  Truck,
  Map as MapIcon,
  PlusCircle,
  Fuel,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Wrench,
} from 'lucide-react';

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser.role);
  const [vehicles, setVehicles] = useState<Vehicle[]>(storage.getVehicles());
  const [companyBases, setCompanyBases] = useState<CompanyBase[]>(storage.getCompanyBases());
  const [drivers, setDrivers] = useState<UserProfile[]>(storage.getDrivers());
  const [activeRoute, setActiveRoute] = useState<Route>(storage.getActiveRoute());
  const [historicalRoutes, setHistoricalRoutes] = useState<Route[]>(storage.getHistoricalRoutes());
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(storage.getMaintenanceRecords());
  const [deletionRequests, setDeletionRequests] = useState<ClosureDeletionRequest[]>(storage.getDeletionRequests());

  // UI Modals & Navigation
  const [driverTab, setDriverTab] = useState<'execucao' | 'mapa' | 'builder' | 'financeiro' | 'relatorios' | 'manutencao'>('execucao');
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch role synced
  const handleChangeRole = (role: UserRole) => {
    setCurrentRole(role);
    const updatedUser = { ...currentUser, role };
    setCurrentUser(updatedUser);
    storage.saveCurrentUser(updatedUser);
  };

  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    storage.saveCurrentUser(user);
    showToast(`Conectado como ${user.displayName} (${user.role})`);
  };

  // Save vehicles
  const handleSaveVehicles = (updatedVehicles: Vehicle[]) => {
    setVehicles(updatedVehicles);
    storage.saveVehicles(updatedVehicles);
    showToast('Frota atualizada com sucesso!');
  };

  // Save company bases
  const handleSaveCompanyBases = (updatedBases: CompanyBase[]) => {
    setCompanyBases(updatedBases);
    storage.saveCompanyBases(updatedBases);
    showToast('Bases da empresa salvas com sucesso!');
  };

  // Save drivers & home addresses
  const handleSaveDrivers = (updatedDrivers: UserProfile[]) => {
    setDrivers(updatedDrivers);
    storage.saveDrivers(updatedDrivers);

    // If current logged-in driver's home address or data was modified by manager, sync
    const currentUpdated = updatedDrivers.find((d) => d.uid === currentUser.uid);
    if (currentUpdated) {
      setCurrentUser(currentUpdated);
      storage.saveCurrentUser(currentUpdated);
    }
    showToast('Cadastro de motoristas e residências atualizado!');
  };

  // Save active route
  const handleUpdateRoute = (updatedRoute: Route) => {
    setActiveRoute(updatedRoute);
    storage.saveActiveRoute(updatedRoute);
  };

  // Clear Active Route with Confirmation
  const handleClearActiveRoute = () => {
    const cleared = storage.clearActiveRoute();
    setActiveRoute(cleared);
    showToast('Rota ativa apagada com sucesso!');
  };

  // Maintenance handlers
  const handleAddMaintenance = (record: MaintenanceRecord) => {
    const updated = storage.addMaintenanceRecord(record);
    setMaintenances(updated);
    showToast(`Manutenção do veículo ${record.vehiclePlate} registrada!`);
  };

  const handleSaveMaintenances = (updated: MaintenanceRecord[]) => {
    storage.saveMaintenanceRecords(updated);
    setMaintenances(updated);
    showToast('Histórico de manutenção atualizado!');
  };

  // Daily Closure Deletion Approval Workflow
  const handleRequestDeleteClosure = (routeId: string, reason: string) => {
    const targetRoute =
      historicalRoutes.find((r) => r.id === routeId) ||
      (activeRoute.id === routeId ? activeRoute : null);

    if (!targetRoute) return;

    const newRequest: ClosureDeletionRequest = {
      id: `del-req-${Date.now()}`,
      routeId,
      date: targetRoute.date,
      driverId: currentUser.uid,
      driverName: currentUser.displayName,
      vehiclePlate: targetRoute.vehiclePlate,
      totalKm: targetRoute.totalKm,
      deliveredValue: targetRoute.deliveredValue,
      reason,
      status: 'pendente',
      requestedAt: new Date().toISOString(),
    };

    const updatedRequests = [newRequest, ...deletionRequests];
    storage.saveDeletionRequests(updatedRequests);
    setDeletionRequests(updatedRequests);

    // Update target route's status to 'aguardando_exclusao'
    const updateRouteData = (r: Route) =>
      r.id === routeId
        ? {
            ...r,
            status: 'aguardando_exclusao' as const,
            deletionReason: reason,
            deletionRequestId: newRequest.id,
            updatedAt: new Date().toISOString(),
          }
        : r;

    if (activeRoute.id === routeId) {
      const updatedActive = updateRouteData(activeRoute);
      setActiveRoute(updatedActive);
      storage.saveActiveRoute(updatedActive);
    }

    const updatedHistory = historicalRoutes.map(updateRouteData);
    setHistoricalRoutes(updatedHistory);
    storage.saveHistoricalRoutes(updatedHistory);

    showToast('Solicitação de exclusão enviada ao gestor com sucesso!');
  };

  const handleApproveClosureDeletion = (requestId: string) => {
    const targetReq = deletionRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const updatedRequests = deletionRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'aprovada' as const,
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser.displayName,
          }
        : r
    );
    storage.saveDeletionRequests(updatedRequests);
    setDeletionRequests(updatedRequests);

    // Remove route permanently from history
    const updatedHistory = historicalRoutes.filter((r) => r.id !== targetReq.routeId);
    setHistoricalRoutes(updatedHistory);
    storage.saveHistoricalRoutes(updatedHistory);

    // If active route was the one deleted, reset it
    if (activeRoute.id === targetReq.routeId) {
      handleClearActiveRoute();
    }

    showToast(`Exclusão de fechamento aprovada!`);
  };

  const handleRejectClosureDeletion = (requestId: string, notes?: string) => {
    const targetReq = deletionRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const updatedRequests = deletionRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'rejeitada' as const,
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser.displayName,
            managerNotes: notes,
          }
        : r
    );
    storage.saveDeletionRequests(updatedRequests);
    setDeletionRequests(updatedRequests);

    // Revert route status back to 'concluida'
    const revertRoute = (r: Route) =>
      r.id === targetReq.routeId ? { ...r, status: 'concluida' as const } : r;

    if (activeRoute.id === targetReq.routeId) {
      const reverted = revertRoute(activeRoute);
      setActiveRoute(reverted);
      storage.saveActiveRoute(reverted);
    }

    const updatedHistory = historicalRoutes.map(revertRoute);
    setHistoricalRoutes(updatedHistory);
    storage.saveHistoricalRoutes(updatedHistory);

    showToast(`Solicitação de exclusão recusada. Fechamento mantido.`);
  };

  // 1. Finish Stop
  const handleFinishStop = (stopId: string) => {
    const updatedStops = activeRoute.stops.map((s) => {
      if (s.id === stopId) {
        return {
          ...s,
          status: 'entregue' as const,
          deliveredAt: new Date().toISOString(),
        };
      }
      return s;
    });

    const targetStop = activeRoute.stops.find((s) => s.id === stopId);
    const wasDelivered = targetStop?.status === 'entregue';

    const newDeliveredValue = wasDelivered
      ? activeRoute.deliveredValue
      : activeRoute.deliveredValue + (targetStop?.orderValue || 0);

    const newDeliveredWeight = wasDelivered
      ? activeRoute.deliveredWeight
      : activeRoute.deliveredWeight + (targetStop?.totalWeight || 0);

    const updatedRoute: Route = {
      ...activeRoute,
      stops: updatedStops,
      deliveredValue: newDeliveredValue,
      deliveredWeight: newDeliveredWeight,
      updatedAt: new Date().toISOString(),
    };

    handleUpdateRoute(updatedRoute);
    showToast(`Entrega #${targetStop?.sequenceIndex} finalizada com sucesso!`);
  };

  // 2. Cancel Stop
  const handleCancelStop = (stopId: string, reason: string) => {
    const targetStop = activeRoute.stops.find((s) => s.id === stopId);
    const wasDelivered = targetStop?.status === 'entregue';

    const updatedStops = activeRoute.stops.map((s) => {
      if (s.id === stopId) {
        return {
          ...s,
          status: 'cancelada' as const,
          cancelReason: reason,
        };
      }
      return s;
    });

    const newDeliveredValue = wasDelivered
      ? Math.max(0, activeRoute.deliveredValue - (targetStop?.orderValue || 0))
      : activeRoute.deliveredValue;

    const newDeliveredWeight = wasDelivered
      ? Math.max(0, activeRoute.deliveredWeight - (targetStop?.totalWeight || 0))
      : activeRoute.deliveredWeight;

    const updatedRoute: Route = {
      ...activeRoute,
      stops: updatedStops,
      deliveredValue: newDeliveredValue,
      deliveredWeight: newDeliveredWeight,
      updatedAt: new Date().toISOString(),
    };

    handleUpdateRoute(updatedRoute);
    showToast(`Entrega #${targetStop?.sequenceIndex} cancelada.`);
  };

  // 3. Reschedule Stop to End of Route (Reentregar)
  const handleRescheduleStop = (stopId: string) => {
    const targetStop = activeRoute.stops.find((s) => s.id === stopId);
    if (!targetStop) return;

    // Remove from current position and append to end
    const remainingStops = activeRoute.stops.filter((s) => s.id !== stopId);
    const rescheduledStop: Stop = {
      ...targetStop,
      status: 'reentregar',
    };

    const reorderedStops = [...remainingStops, rescheduledStop].map((s, idx) => ({
      ...s,
      sequenceIndex: idx + 1,
    }));

    // Recalculate route metrics
    const opt = optimizeRouteStops(
      reorderedStops,
      activeRoute.startCoords,
      activeRoute.endCoords,
      activeRoute.avgKmLiter,
      activeRoute.fuelPrice
    );

    const updatedRoute: Route = {
      ...activeRoute,
      stops: reorderedStops,
      productiveKm: opt.productiveKm,
      unproductiveKm: opt.unproductiveKm,
      totalKm: opt.totalKm,
      estimatedFuelCost: opt.estimatedFuelCost,
      updatedAt: new Date().toISOString(),
    };

    handleUpdateRoute(updatedRoute);
    showToast(`Entrega de ${targetStop.clientName} movida para o fim da rota.`);
  };

  // Reopen Stop (if marked incorrectly)
  const handleReopenStop = (stopId: string) => {
    const targetStop = activeRoute.stops.find((s) => s.id === stopId);
    const wasDelivered = targetStop?.status === 'entregue';

    const updatedStops = activeRoute.stops.map((s) =>
      s.id === stopId ? { ...s, status: 'pendente' as const } : s
    );

    const newDeliveredValue = wasDelivered
      ? Math.max(0, activeRoute.deliveredValue - (targetStop?.orderValue || 0))
      : activeRoute.deliveredValue;

    const newDeliveredWeight = wasDelivered
      ? Math.max(0, activeRoute.deliveredWeight - (targetStop?.totalWeight || 0))
      : activeRoute.deliveredWeight;

    handleUpdateRoute({
      ...activeRoute,
      stops: updatedStops,
      deliveredValue: newDeliveredValue,
      deliveredWeight: newDeliveredWeight,
    });
    showToast('Parada reaberta como pendente.');
  };

  // Import stops from OCR
  const handleImportOcrStops = (draftItems: ManifestItemDraft[]) => {
    if (draftItems.length === 0) return;

    // Detect primary municipality of imported stops
    const detectedCity = draftItems.find((d) => d.city)?.city || 'Campinas';
    const cityAnchor = getCityAnchor(detectedCity);

    const newStops: Stop[] = draftItems.map((item, idx) => ({
      id: `stop-ocr-${Date.now()}-${idx}`,
      routeId: activeRoute.id,
      sequenceIndex: idx + 1,
      clientName: item.clientName,
      address: item.address,
      lat: typeof item.lat === 'number' ? item.lat : cityAnchor.lat + (Math.random() - 0.5) * 0.03,
      lng: typeof item.lng === 'number' ? item.lng : cityAnchor.lng + (Math.random() - 0.5) * 0.03,
      orderValue: item.orderValue,
      totalWeight: item.totalWeight,
      isPriority: item.isPriority,
      paymentMethod: item.paymentMethod,
      notes: item.notes,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    }));

    // If activeRoute only contains the initial sample stops (init-stop-...), replace them completely
    const isReplacingInitialSample = activeRoute.stops.some((s) => s.id.startsWith('init-stop'));
    const stopsToUse = isReplacingInitialSample ? newStops : [...activeRoute.stops, ...newStops];

    // Origin / Destination resolution:
    // If company bases are registered by the gestor, prioritize the default base
    let startCoords = activeRoute.startCoords;
    let startAddress = activeRoute.startAddress;
    let endCoords = activeRoute.endCoords;
    let endAddress = activeRoute.endAddress;

    const defaultBase = companyBases.find((b) => b.isDefault) || companyBases[0];
    if (defaultBase && (!startAddress || startAddress.trim() === '')) {
      startAddress = `${defaultBase.name} - ${defaultBase.address}`;
      startCoords = defaultBase.coords;
    } else if (!startAddress || startAddress.trim() === '') {
      // Default to detected city center
      startAddress = `CD Regional ${detectedCity}`;
      startCoords = cityAnchor;
    }

    // For end address: if driver home address is registered and route end is empty, set it
    if (currentUser.homeAddress && (!endAddress || endAddress.trim() === '')) {
      endAddress = `Residência: ${currentUser.homeAddress}`;
      endCoords = currentUser.homeCoords || startCoords;
    } else if (!endAddress || endAddress.trim() === '') {
      endAddress = startAddress;
      endCoords = startCoords;
    }

    const totalWeightSum = stopsToUse.reduce((acc, s) => acc + s.totalWeight, 0);
    const totalValueSum = stopsToUse.reduce((acc, s) => acc + s.orderValue, 0);

    const opt = optimizeRouteStops(
      stopsToUse,
      startCoords,
      endCoords,
      activeRoute.avgKmLiter,
      activeRoute.fuelPrice
    );

    const updatedRoute: Route = {
      ...activeRoute,
      startAddress,
      startCoords,
      endAddress,
      endCoords,
      stops: opt.orderedStops,
      productiveKm: opt.productiveKm,
      unproductiveKm: opt.unproductiveKm,
      totalKm: opt.totalKm,
      estimatedFuelCost: opt.estimatedFuelCost,
      totalWeight: totalWeightSum,
      totalValue: totalValueSum,
    };

    handleUpdateRoute(updatedRoute);
    setDriverTab('execucao');
    showToast(`${draftItems.length} paradas de ${detectedCity} importadas e rota otimizada!`);
  };

  // Close entire day route
  const handleFinishEntireRoute = () => {
    const finalizedRoute: Route = {
      ...activeRoute,
      status: 'concluida',
      updatedAt: new Date().toISOString(),
    };

    const newHistory = [finalizedRoute, ...historicalRoutes];
    setHistoricalRoutes(newHistory);
    localStorage.setItem('rotatop_history_routes_v1', JSON.stringify(newHistory));
    showToast('Rota do dia concluída e arquivada nos relatórios!');
    setDriverTab('relatorios');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-amber-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        currentRole={currentRole}
        onChangeRole={handleChangeRole}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          storage.saveCurrentUser({
            uid: 'anon',
            displayName: 'Motorista Visitante',
            email: 'visitante@rotatop.com.br',
            role: 'motorista',
          });
          setCurrentUser(storage.getCurrentUser());
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* VIEW 1: MOTORISTA (OPERATIONAL) */}
        {currentRole === 'motorista' && (
          <div className="space-y-5">
            {/* Driver Secondary Tab Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
              <button
                onClick={() => setDriverTab('execucao')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  driverTab === 'execucao'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Minha Rota Ativa ({activeRoute.stops.length})</span>
              </button>

              <button
                onClick={() => setDriverTab('mapa')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  driverTab === 'mapa'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Mapa GPS</span>
              </button>

              <button
                onClick={() => setDriverTab('builder')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  driverTab === 'builder'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Romaneio & Base</span>
              </button>

              <button
                onClick={() => setDriverTab('financeiro')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  driverTab === 'financeiro'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Fuel className="w-4 h-4" />
                <span>Combustível & KM</span>
              </button>

              <button
                onClick={() => setDriverTab('relatorios')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  driverTab === 'relatorios'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Fechamento do Dia</span>
              </button>

              <button
                onClick={() => setDriverTab('manutencao')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  driverTab === 'manutencao'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Manutenção ({maintenances.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: Execução & Paradas */}
            {driverTab === 'execucao' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Live Progress Bar with metrics */}
                <LiveRouteExecution
                  route={activeRoute}
                  onFinishEntireRoute={handleFinishEntireRoute}
                  onClearRoute={handleClearActiveRoute}
                />

                {/* Compact Interactive Map View for Quick Orientation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Mapa Interativo da Rota
                    </span>
                    <button
                      onClick={() => setDriverTab('mapa')}
                      className="text-xs font-bold text-amber-400 hover:underline"
                    >
                      Expandir Mapa →
                    </button>
                  </div>
                  <RouteMap route={activeRoute} />
                </div>

                {/* Stops Sequence */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight uppercase">
                        Ordem de Entregas do Romaneio
                      </h3>
                      <p className="text-xs text-slate-400">
                        {activeRoute.stops.length} pontos de parada ordenados para maior eficiência
                      </p>
                    </div>

                    <button
                      onClick={() => setIsOcrModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden sm:inline">OCR Romaneio</span>
                    </button>
                  </div>

                  {activeRoute.stops.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                      <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-white mb-1">
                        Nenhuma entrega cadastrada para hoje
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                        Tire foto de uma folha física de romaneio ou adicione entregas manualmente.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setIsOcrModalOpen(true)}
                          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                        >
                          Escanear com IA
                        </button>
                        <button
                          onClick={() => setDriverTab('builder')}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                        >
                          Adicionar Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...activeRoute.stops]
                        .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
                        .map((stop, index) => {
                          const isNextPending =
                            stop.status === 'pendente' &&
                            !activeRoute.stops.some(
                              (s) => s.sequenceIndex < stop.sequenceIndex && s.status === 'pendente'
                            );

                          return (
                            <StopCard
                              key={stop.id}
                              stop={stop}
                              isCurrentNext={isNextPending}
                              onFinish={handleFinishStop}
                              onCancel={handleCancelStop}
                              onReschedule={handleRescheduleStop}
                              onReopen={handleReopenStop}
                            />
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Mapa Full */}
            {driverTab === 'mapa' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Navegação e Traçado da Rota
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeRoute.totalKm} KM Total • {activeRoute.stops.length} Paradas
                  </span>
                </div>
                <RouteMap route={activeRoute} />
              </div>
            )}

            {/* TAB CONTENT: Builder */}
            {driverTab === 'builder' && (
              <div className="animate-in fade-in">
                <RouteBuilder
                  route={activeRoute}
                  onUpdateRoute={handleUpdateRoute}
                  onOpenOcrModal={() => setIsOcrModalOpen(true)}
                  onClearRoute={handleClearActiveRoute}
                  companyBases={companyBases}
                  currentUser={currentUser}
                />
              </div>
            )}

            {/* TAB CONTENT: Financeiro */}
            {driverTab === 'financeiro' && (
              <div className="animate-in fade-in">
                <FinancialSummary
                  route={activeRoute}
                  onUpdateParams={(avgKm, price) => {
                    const opt = optimizeRouteStops(
                      activeRoute.stops,
                      activeRoute.startCoords,
                      activeRoute.endCoords,
                      avgKm,
                      price
                    );
                    handleUpdateRoute({
                      ...activeRoute,
                      avgKmLiter: avgKm,
                      fuelPrice: price,
                      productiveKm: opt.productiveKm,
                      unproductiveKm: opt.unproductiveKm,
                      totalKm: opt.totalKm,
                      estimatedFuelCost: opt.estimatedFuelCost,
                    });
                    showToast('Parâmetros de combustível atualizados!');
                  }}
                />
              </div>
            )}

            {/* TAB CONTENT: Relatórios Diários / Fechamento */}
            {driverTab === 'relatorios' && (
              <div className="animate-in fade-in">
                <DailyReportView
                  activeRoute={activeRoute}
                  historicalRoutes={historicalRoutes}
                  onRequestDeleteRoute={handleRequestDeleteClosure}
                />
              </div>
            )}

            {/* TAB CONTENT: Manutenções Lançadas pelo Motorista */}
            {driverTab === 'manutencao' && (
              <div className="animate-in fade-in">
                <MaintenanceView
                  currentUser={currentUser}
                  vehicles={vehicles}
                  maintenances={maintenances}
                  onAddMaintenance={handleAddMaintenance}
                />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: GESTOR (FLEET & MANAGER) */}
        {currentRole === 'gestor' && (
          <div className="animate-in fade-in">
            <ManagerDashboard
              vehicles={vehicles}
              onSaveVehicles={handleSaveVehicles}
              activeRoute={activeRoute}
              historicalRoutes={historicalRoutes}
              maintenances={maintenances}
              onSaveMaintenances={handleSaveMaintenances}
              deletionRequests={deletionRequests}
              onApproveDeletion={handleApproveClosureDeletion}
              onRejectDeletion={handleRejectClosureDeletion}
              companyBases={companyBases}
              onSaveCompanyBases={handleSaveCompanyBases}
              drivers={drivers}
              onSaveDrivers={handleSaveDrivers}
            />
          </div>
        )}
      </main>

        {/* OCR Intelligent Manifest Modal */}
        {isOcrModalOpen && (
          <OcrManifestModal
            isOpen={isOcrModalOpen}
            onClose={() => setIsOcrModalOpen(false)}
            onImportStops={handleImportOcrStops}
          />
        )}

        {/* Account & Profile Switcher Modal */}
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
            onSelectUser={handleSelectUser}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
