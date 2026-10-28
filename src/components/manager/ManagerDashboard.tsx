import React, { useState, useEffect } from 'react';
import {
  Route,
  Vehicle,
  UserProfile,
  MaintenanceRecord,
  ClosureDeletionRequest,
  MaintenanceType,
  CompanyBase,
  AddressSuggestion,
  LatLng,
} from '../../types';
import { MAINTENANCE_TYPE_LABELS } from '../driver/MaintenanceView';
import { searchAddressBR, resolveGoogleCoordinates, getCityAnchor } from '../../lib/geocoding';
import { ManifestViewerModal } from '../common/ManifestViewerModal';
import { downloadFinancialClosurePdf } from '../../lib/pdfGenerator';
import {
  Truck,
  Users,
  TrendingUp,
  Fuel,
  DollarSign,
  PackageCheck,
  Plus,
  Edit2,
  Trash2,
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Gauge,
  Calendar,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Check,
  X,
  Droplets,
  Disc,
  Layers,
  ArrowUpRight,
  Eye,
  EyeOff,
  Building2,
  Home,
  MapPin,
  Compass,
  KeyRound,
  Copy,
  Share2,
  RotateCcw,
} from 'lucide-react';

interface ManagerDashboardProps {
  vehicles: Vehicle[];
  onSaveVehicles: (vehicles: Vehicle[]) => void;
  activeRoute: Route;
  historicalRoutes: Route[];
  maintenances: MaintenanceRecord[];
  onSaveMaintenances: (maintenances: MaintenanceRecord[]) => void;
  deletionRequests: ClosureDeletionRequest[];
  onApproveDeletion: (requestId: string) => void;
  onRejectDeletion: (requestId: string, notes?: string) => void;
  companyBases: CompanyBase[];
  onSaveCompanyBases: (bases: CompanyBase[]) => void;
  drivers: UserProfile[];
  onSaveDrivers: (drivers: UserProfile[]) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  vehicles,
  onSaveVehicles,
  activeRoute,
  historicalRoutes,
  maintenances,
  onSaveMaintenances,
  deletionRequests,
  onApproveDeletion,
  onRejectDeletion,
  companyBases,
  onSaveCompanyBases,
  drivers,
  onSaveDrivers,
}) => {
  const [activeTab, setActiveTab] = useState<
    'kpis' | 'romaneios' | 'bases' | 'maintenances' | 'requests' | 'vehicles' | 'drivers'
  >('kpis');

  // Manifest Image Lightbox Viewer Modal State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerMeta, setViewerMeta] = useState<{ driverName?: string; vehiclePlate?: string; date?: string }>({});

  const handleOpenManifestViewer = (targetRoute: Route) => {
    const imgs =
      targetRoute.manifestImages && targetRoute.manifestImages.length > 0
        ? targetRoute.manifestImages
        : ['/assets/aistudio/image_0f309c5a.png'];
    setViewerImages(imgs);
    setViewerTitle(`Romaneio Digitalizado - ${targetRoute.driverName || 'Motorista'} (${targetRoute.date})`);
    setViewerMeta({
      driverName: targetRoute.driverName,
      vehiclePlate: targetRoute.vehiclePlate,
      date: targetRoute.date,
    });
    setIsViewerOpen(true);
  };

  // Company Base Modal State
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [baseName, setBaseName] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [baseCoords, setBaseCoords] = useState<LatLng | null>(null);
  const [baseIsDefault, setBaseIsDefault] = useState(false);
  const [baseSuggestions, setBaseSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingBaseAddress, setIsSearchingBaseAddress] = useState(false);

  // Driver Modal State (Create / Edit)
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [showDriverPassword, setShowDriverPassword] = useState(false);
  const [copiedDriverId, setCopiedDriverId] = useState<string | null>(null);
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPlate, setDriverPlate] = useState('');
  const [driverHomeAddress, setDriverHomeAddress] = useState('');
  const [driverHomeCoords, setDriverHomeCoords] = useState<LatLng | null>(null);
  const [driverAddressSuggestions, setDriverAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingDriverAddress, setIsSearchingDriverAddress] = useState(false);

  // Maintenance Filter States
  const [maintSearch, setMaintSearch] = useState('');
  const [maintTypeFilter, setMaintTypeFilter] = useState<string>('todos');
  const [maintVehicleFilter, setMaintVehicleFilter] = useState<string>('todos');

  // Manager Maintenance Modal
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [newMaintPlate, setNewMaintPlate] = useState(vehicles[0]?.plate || '');
  const [newMaintType, setNewMaintType] = useState<MaintenanceType>('troca_oleo');
  const [newMaintCost, setNewMaintCost] = useState('');
  const [newMaintKm, setNewMaintKm] = useState('');
  const [newMaintDate, setNewMaintDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMaintWorkshop, setNewMaintWorkshop] = useState('');
  const [newMaintNotes, setNewMaintNotes] = useState('');

  // Rejection Notes Modal
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Vehicle Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('2023');
  const [avgKm, setAvgKm] = useState('9.5');
  const [fuelType, setFuelType] = useState<any>('diesel');
  const [status, setStatus] = useState<any>('ativo');
  const [assignedDriver, setAssignedDriver] = useState('');

  // Debounced search for Company Base Address
  useEffect(() => {
    if (!baseAddress || baseAddress.trim().length < 2) {
      setBaseSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingBaseAddress(true);
      const results = await searchAddressBR(baseAddress);
      setBaseSuggestions(results);
      setIsSearchingBaseAddress(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [baseAddress]);

  // Debounced search for Driver Home Address
  useEffect(() => {
    if (!driverHomeAddress || driverHomeAddress.trim().length < 2) {
      setDriverAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDriverAddress(true);
      const results = await searchAddressBR(driverHomeAddress);
      setDriverAddressSuggestions(results);
      setIsSearchingDriverAddress(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [driverHomeAddress]);

  // Consolidated KPIs
  const allRoutes = activeRoute.stops.length > 0 ? [activeRoute, ...historicalRoutes] : historicalRoutes;
  const activeVehiclesCount = vehicles.filter((v) => v.status === 'ativo').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'manutencao').length;

  const totalDeliveriesCount = allRoutes.reduce((acc, r) => acc + (r.stops?.length || 0), 0);
  const completedDeliveriesCount = allRoutes.reduce(
    (acc, r) =>
      acc + (r.stops ? r.stops.filter((s) => s.status === 'entregue').length : 0),
    0
  );
  const totalRevenue = allRoutes.reduce((acc, r) => acc + (r.totalValue || 0), 0);
  const totalFuelCost = allRoutes.reduce((acc, r) => acc + (r.estimatedFuelCost || 0), 0);
  const totalKmRun = allRoutes.reduce((acc, r) => acc + (r.totalKm || 0), 0);

  const deliverySuccessRate =
    totalDeliveriesCount > 0
      ? Math.round((completedDeliveriesCount / totalDeliveriesCount) * 100)
      : 100;

  // Maintenance Calculations
  const totalMaintenanceCost = maintenances.reduce((acc, m) => acc + m.cost, 0);
  const totalCombinedOperatingCost = totalFuelCost + totalMaintenanceCost;
  const costPerKmTotal =
    totalKmRun > 0 ? (totalMaintenanceCost / totalKmRun).toFixed(2) : '0.00';

  // Cost by category
  const costByType: Record<string, { total: number; count: number }> = {};
  maintenances.forEach((m) => {
    if (!costByType[m.type]) {
      costByType[m.type] = { total: 0, count: 0 };
    }
    costByType[m.type].total += m.cost;
    costByType[m.type].count += 1;
  });

  // Pending deletion requests
  const pendingRequests = deletionRequests.filter((req) => req.status === 'pendente');

  // --- Handlers for Company Base ---
  const handleOpenAddBase = () => {
    setEditingBaseId(null);
    setBaseName('');
    setBaseAddress('');
    setBaseCoords(null);
    setBaseIsDefault(companyBases.length === 0);
    setShowBaseModal(true);
  };

  const handleOpenEditBase = (b: CompanyBase) => {
    setEditingBaseId(b.id);
    setBaseName(b.name);
    setBaseAddress(b.address);
    setBaseCoords(b.coords);
    setBaseIsDefault(!!b.isDefault);
    setShowBaseModal(true);
  };

  const handleSelectBaseAddress = async (sug: AddressSuggestion) => {
    setBaseAddress(sug.displayName);
    setBaseSuggestions([]);
    let lat = sug.lat;
    let lng = sug.lng;
    if (sug.placeId) {
      const resolved = await resolveGoogleCoordinates(sug.placeId, sug.displayName);
      if (resolved) {
        lat = resolved.lat;
        lng = resolved.lng;
      }
    }
    setBaseCoords({ lat, lng });
  };

  const handleSaveCompanyBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseName.trim() || !baseAddress.trim()) return;

    const anchor = getCityAnchor(baseAddress);
    const coords: LatLng = baseCoords || {
      lat: anchor.lat,
      lng: anchor.lng,
    };

    if (editingBaseId) {
      const updated = companyBases.map((b) =>
        b.id === editingBaseId
          ? {
              ...b,
              name: baseName.trim(),
              address: baseAddress.trim(),
              coords,
              isDefault: baseIsDefault,
            }
          : baseIsDefault
          ? { ...b, isDefault: false }
          : b
      );
      onSaveCompanyBases(updated);
    } else {
      const newBase: CompanyBase = {
        id: `base-${Date.now()}`,
        name: baseName.trim(),
        address: baseAddress.trim(),
        coords,
        isDefault: baseIsDefault || companyBases.length === 0,
        createdAt: new Date().toISOString(),
      };
      const updated = baseIsDefault
        ? [newBase, ...companyBases.map((b) => ({ ...b, isDefault: false }))]
        : [newBase, ...companyBases];
      onSaveCompanyBases(updated);
    }

    setShowBaseModal(false);
  };

  const handleDeleteBase = (id: string) => {
    if (confirm('Deseja realmente remover este endereço da empresa?')) {
      onSaveCompanyBases(companyBases.filter((b) => b.id !== id));
    }
  };

  // --- Handlers for Drivers ---
  const generateRandomPassword = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `Rota@${digits}`;
  };

  const handleOpenAddDriver = () => {
    setEditingDriverId(null);
    setDriverName('');
    setDriverEmail('');
    setDriverPassword(generateRandomPassword());
    setShowDriverPassword(false);
    setDriverPhone('');
    setDriverPlate('');
    setDriverHomeAddress('');
    setDriverHomeCoords(null);
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (d: UserProfile) => {
    setEditingDriverId(d.uid);
    setDriverName(d.displayName);
    setDriverEmail(d.email);
    setDriverPassword(d.accessPassword || generateRandomPassword());
    setShowDriverPassword(false);
    setDriverPhone(d.phone || '');
    setDriverPlate(d.vehiclePlate || '');
    setDriverHomeAddress(d.homeAddress || '');
    setDriverHomeCoords(d.homeCoords || null);
    setShowDriverModal(true);
  };

  const handleCopyCredentials = (d: UserProfile) => {
    const pwd = d.accessPassword || 'Rota@1234';
    const text = `Credenciais Rotatop:\nMotorista: ${d.displayName}\nE-mail: ${d.email}\nSenha de Acesso: ${pwd}`;
    navigator.clipboard.writeText(text);
    setCopiedDriverId(d.uid);
    setTimeout(() => setCopiedDriverId(null), 2500);
  };

  const handleShareWhatsApp = (d: UserProfile) => {
    const pwd = d.accessPassword || 'Rota@1234';
    const msg = `Olá ${d.displayName}! Seu acesso ao aplicativo Rotatop foi liberado pelo gestor.\n\nE-mail: ${d.email}\nSenha de Acesso: ${pwd}\n\nAcesse o app e escolha "Portal do Motorista" para iniciar suas entregas.`;
    const cleanPhone = (d.phone || '').replace(/\D/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleSelectDriverAddress = async (sug: AddressSuggestion) => {
    setDriverHomeAddress(sug.displayName);
    setDriverAddressSuggestions([]);
    let lat = sug.lat;
    let lng = sug.lng;
    if (sug.placeId) {
      const resolved = await resolveGoogleCoordinates(sug.placeId, sug.displayName);
      if (resolved) {
        lat = resolved.lat;
        lng = resolved.lng;
      }
    }
    setDriverHomeCoords({ lat, lng });
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    let coords = driverHomeCoords;
    if (driverHomeAddress.trim() && !coords) {
      const anchor = getCityAnchor(driverHomeAddress);
      coords = { lat: anchor.lat, lng: anchor.lng };
    }

    const pwd = driverPassword.trim() || generateRandomPassword();

    if (editingDriverId) {
      const updated = drivers.map((d) =>
        d.uid === editingDriverId
          ? {
              ...d,
              displayName: driverName.trim(),
              email: driverEmail.trim() || d.email,
              accessPassword: pwd,
              phone: driverPhone.trim(),
              vehiclePlate: driverPlate.toUpperCase().trim(),
              homeAddress: driverHomeAddress.trim() || undefined,
              homeCoords: coords || undefined,
            }
          : d
      );
      onSaveDrivers(updated);
    } else {
      const newDriver: UserProfile = {
        uid: `driver-${Date.now()}`,
        displayName: driverName.trim(),
        email:
          driverEmail.trim() ||
          `${driverName.toLowerCase().replace(/\s+/g, '.')}@rotatop.com.br`,
        accessPassword: pwd,
        role: 'motorista',
        phone: driverPhone.trim(),
        vehiclePlate: driverPlate.toUpperCase().trim(),
        homeAddress: driverHomeAddress.trim() || undefined,
        homeCoords: coords || undefined,
        createdAt: new Date().toISOString(),
      };
      onSaveDrivers([...drivers, newDriver]);
    }

    setShowDriverModal(false);
  };

  const handleDeleteDriver = (uid: string) => {
    if (confirm('Deseja realmente remover este motorista?')) {
      onSaveDrivers(drivers.filter((d) => d.uid !== uid));
    }
  };

  // --- Handlers for Vehicles ---
  const handleOpenAddVehicle = () => {
    setEditingVehicleId(null);
    setPlate('');
    setModel('');
    setBrand('');
    setYear('2023');
    setAvgKm('9.5');
    setFuelType('diesel');
    setStatus('ativo');
    setAssignedDriver('');
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setPlate(v.plate);
    setModel(v.model);
    setBrand(v.brand);
    setYear(v.year.toString());
    setAvgKm(v.avgKmLiter.toString());
    setFuelType(v.fuelType);
    setStatus(v.status);
    setAssignedDriver(v.assignedDriverName || '');
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model) return;

    if (editingVehicleId) {
      const updated = vehicles.map((v) =>
        v.id === editingVehicleId
          ? {
              ...v,
              plate: plate.toUpperCase().trim(),
              model: model.trim(),
              brand: brand.trim() || 'Genérica',
              year: parseInt(year) || 2023,
              avgKmLiter: parseFloat(avgKm) || 9.0,
              fuelType,
              status,
              assignedDriverName: assignedDriver.trim(),
            }
          : v
      );
      onSaveVehicles(updated);
    } else {
      const newV: Vehicle = {
        id: `veh-${Date.now()}`,
        plate: plate.toUpperCase().trim(),
        model: model.trim(),
        brand: brand.trim() || 'Genérica',
        year: parseInt(year) || 2023,
        avgKmLiter: parseFloat(avgKm) || 9.0,
        fuelType,
        status,
        assignedDriverName: assignedDriver.trim(),
      };
      onSaveVehicles([...vehicles, newV]);
    }

    setShowVehicleModal(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm('Deseja realmente remover este veículo da frota?')) {
      onSaveVehicles(vehicles.filter((v) => v.id !== id));
    }
  };

  // --- Handlers for Maintenance ---
  const handleSaveManagerMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaintCost || !newMaintKm || !newMaintPlate) return;

    const newRec: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      vehiclePlate: newMaintPlate.toUpperCase().trim(),
      driverId: 'gestor',
      driverName: 'Gestor da Frota',
      type: newMaintType,
      cost: parseFloat(newMaintCost) || 0,
      kmAtMaintenance: parseInt(newMaintKm) || 0,
      date: newMaintDate,
      workshopName: newMaintWorkshop.trim() || 'Oficina Credenciada',
      notes: newMaintNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveMaintenances([newRec, ...maintenances]);
    setShowMaintModal(false);
    setNewMaintCost('');
    setNewMaintKm('');
    setNewMaintNotes('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    onRejectDeletion(rejectingRequestId, rejectNotes.trim());
    setRejectingRequestId(null);
    setRejectNotes('');
  };

  // Filtered maintenance list for manager view
  const filteredMaintenances = maintenances.filter((m) => {
    const matchesSearch =
      m.vehiclePlate.toLowerCase().includes(maintSearch.toLowerCase()) ||
      m.driverName.toLowerCase().includes(maintSearch.toLowerCase()) ||
      m.workshopName?.toLowerCase().includes(maintSearch.toLowerCase()) ||
      m.notes?.toLowerCase().includes(maintSearch.toLowerCase());

    const matchesType = maintTypeFilter === 'todos' || m.type === maintTypeFilter;
    const matchesVehicle =
      maintVehicleFilter === 'todos' || m.vehiclePlate === maintVehicleFilter;

    return matchesSearch && matchesType && matchesVehicle;
  });

  return (
    <div className="space-y-6">
      {/* Top Warning Banner for Pending Deletion Approvals */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0 animate-bounce">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>{pendingRequests.length} Solicitação(ões) de Exclusão de Fechamento</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  Ação Necessária
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Motoristas solicitaram cancelamento de fechamentos de rota com justificativas pendentes de auditoria.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('requests')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Analisar Solicitações</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manager Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'kpis'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('romaneios')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'romaneios'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Romaneios & Rotas</span>
        </button>

        <button
          onClick={() => setActiveTab('bases')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'bases'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Bases & Endereços ({companyBases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenances')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'maintenances'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Custos & Manutenção ({maintenances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 relative ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Aprovações de Fechamento</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'vehicles'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Frota ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'drivers'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Motoristas ({drivers.length})</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD GERAL */}
      {activeTab === 'kpis' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Frota em Operação</span>
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {activeVehiclesCount}{' '}
                <span className="text-xs font-normal text-slate-400">/ {vehicles.length} veículos</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {vehicles.length === 0 ? 'Cadastre os veículos da sua frota' : `${maintenanceCount} em manutenção`}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Entregas Realizadas</span>
                <PackageCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-400">
                {completedDeliveriesCount}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                {totalDeliveriesCount > 0 ? `${deliverySuccessRate}% taxa de sucesso` : 'Aguardando rotas da semana'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Custo Combustível</span>
                <Fuel className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                R$ {totalFuelCost.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalKmRun.toFixed(0)} KM rodados no total
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Manutenção da Frota</span>
                <Wrench className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                R$ {totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {maintenances.length === 0 ? 'Sem manutenções registradas' : `R$ ${costPerKmTotal} / KM rodado`}
              </p>
            </div>
          </div>

          {/* Setup Onboarding Checklist for Real Pilot Test */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Preparação para a Semana de Testes Reais</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Configure os endereços corporativos e residenciais para que os motoristas tenham as opções prontas ao gerar rotas:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div
                onClick={() => setActiveTab('bases')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  companyBases.length > 0
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950 border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    1. Base da Empresa / CD
                  </span>
                  {companyBases.length > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {companyBases.length > 0
                    ? `${companyBases.length} base(s) cadastrada(s)`
                    : 'Cadastre o endereço do galpão ou CD de saída'}
                </p>
              </div>

              <div
                onClick={() => setActiveTab('drivers')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  drivers.some((d) => d.homeAddress)
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950 border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-purple-400" />
                    2. Residência dos Motoristas
                  </span>
                  {drivers.some((d) => d.homeAddress) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {drivers.filter((d) => d.homeAddress).length} de {drivers.length} motorista(s) com endereço
                </p>
              </div>

              <div
                onClick={() => setActiveTab('vehicles')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  vehicles.length > 0
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950 border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-400" />
                    3. Veículos da Frota
                  </span>
                  {vehicles.length > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      Pendente
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {vehicles.length} veículo(s) cadastrado(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ROMANEIOS & ROTAS (ACESSO EXCLUSIVO DO GESTOR ÀS IMAGENS ESCANEADAS) */}
      {activeTab === 'romaneios' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Auditoria de Romaneios & Fotos Escaneadas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acesse as folhas originais de romaneio fotografadas pelos motoristas no celular, paradas e odômetros apurados
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const routesToExport = [activeRoute, ...historicalRoutes].filter(
                    (r) =>
                      (r.stops && r.stops.length > 0) ||
                      (r.manifestImages && r.manifestImages.length > 0)
                  );
                  downloadFinancialClosurePdf(
                    routesToExport,
                    {
                      title: 'PRESTAÇÃO DE CONTAS - RELATÓRIO GERAL DA FROTA',
                      subtitle: 'Consolidado Oficial de Fechamento Operacional e Financeiro',
                      periodLabel: 'Histórico Geral de Rotas',
                      companyName: 'ROTATOP - GESTÃO DE FROTAS',
                    },
                    'relatorio_geral_frota'
                  );
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Exportar prestação de contas de toda a frota em PDF"
              >
                <FileText className="w-4 h-4" />
                <span>Exportar Relatório Geral (PDF)</span>
              </button>

              <div className="text-xs font-bold text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                Rotas com Romaneio:{' '}
                <strong className="text-amber-400">
                  {[activeRoute, ...historicalRoutes].filter((r) => r.stops && r.stops.length > 0).length}
                </strong>
              </div>
            </div>
          </div>

          {/* Routes Cards List */}
          {(() => {
            const allAuditedRoutes = [activeRoute, ...historicalRoutes].filter(
              (r) =>
                (r.stops && r.stops.length > 0) ||
                (r.manifestImages && r.manifestImages.length > 0)
            );

            if (allAuditedRoutes.length === 0) {
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Nenhum romaneio escaneado ainda</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Assim que o motorista escanear uma folha de romaneio no aplicativo pelo celular ou carregar a rota de Campinas, as imagens físicas em alta resolução e o traçado de entregas ficarão arquivados aqui para você auditar.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {allAuditedRoutes.map((r) => {
                  const hasCustomImages = r.manifestImages && r.manifestImages.length > 0;
                  const imagesCount = hasCustomImages ? r.manifestImages!.length : 1;

                  return (
                    <div
                      key={r.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl transition-all space-y-4"
                    >
                      {/* Top Bar of Route */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-sm">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white">
                                {r.driverName || 'Motorista'}
                              </h4>
                              <span className="text-xs text-slate-400 font-mono">
                                • Placa: {r.vehiclePlate || 'Não informada'}
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                                {r.date}
                              </span>
                              {r.id === activeRoute.id && (
                                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  Rota Ativa em Andamento
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Ponto de Partida: {r.startAddress.split(',')[0]} ➔ Retorno: {r.endAddress.split(',')[0]}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
                          {/* Button to Download Single Route PDF */}
                          <button
                            type="button"
                            onClick={() => {
                              downloadFinancialClosurePdf(
                                [r],
                                {
                                  title: `COMPROVANTE DE FECHAMENTO - ROTA ${r.date}`,
                                  subtitle: `Auditoria de Entregas, Odômetro e Combustível - Placa ${r.vehiclePlate}`,
                                  periodLabel: r.date,
                                  driverName: r.driverName,
                                  vehiclePlate: r.vehiclePlate,
                                  companyBaseAddress: r.startAddress,
                                },
                                `comprovante_rota_${r.date}_${r.vehiclePlate || 'veiculo'}`
                              );
                            }}
                            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Baixar comprovante individual desta rota em PDF"
                          >
                            <FileText className="w-4 h-4 text-rose-400" />
                            <span>PDF</span>
                          </button>

                          {/* Button to View Scanned Manifest Images */}
                          <button
                            type="button"
                            onClick={() => handleOpenManifestViewer(r)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Ver Romaneio ({imagesCount} foto{imagesCount > 1 ? 's' : ''})</span>
                          </button>
                        </div>
                      </div>

                      {/* Route Numbers & Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Total Entregas
                          </span>
                          <span className="text-base font-black text-white font-mono mt-0.5 block">
                            {r.stops?.length || 0} paradas
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            {r.stops?.filter((s) => s.status === 'entregue').length || 0} entregues
                          </span>
                        </div>

                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Carga Total (kg)
                          </span>
                          <span className="text-base font-black text-indigo-300 font-mono mt-0.5 block">
                            {r.totalWeight.toFixed(1)} kg
                          </span>
                          <span className="text-[10px] text-slate-500">Peso no baú</span>
                        </div>

                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Valor Faturado (R$)
                          </span>
                          <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                            R$ {r.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500">Valor das notas fiscais</span>
                        </div>

                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Quilometragem (KM)
                          </span>
                          <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                            {r.totalKm} km
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Prod: {r.productiveKm} km • Improd: {r.unproductiveKm} km
                          </span>
                        </div>
                      </div>

                      {/* Real Odometer Breakdown if calibrated */}
                      {r.odometerCalculated && (
                        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-400 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Apuração de Odômetro do Veículo Calibrada pelo Motorista</span>
                            </span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                              KM Real Auditado
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                            <div>🏠 Saída Casa: <strong className="text-white">{r.odometerStartHome || '—'} km</strong></div>
                            <div>🏢 Chegada CD: <strong className="text-white">{r.odometerStartCompany || '—'} km</strong></div>
                            <div>🏁 Retorno CD: <strong className="text-white">{r.odometerEndCompany || '—'} km</strong></div>
                            <div>🏡 Chegada Casa: <strong className="text-white">{r.odometerEndHome || '—'} km</strong></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: BASES & ENDEREÇOS (CADASTRO EXCLUSIVO DO GESTOR) */}
      {activeTab === 'bases' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Section 1: Company Bases */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span>Endereços da Empresa (CD / Galpão / Ponto de Partida)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ficam disponíveis imediatamente no montador de rotas para o motorista selecionar como ponto de saída
                </p>
              </div>

              <button
                onClick={handleOpenAddBase}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Base / CD</span>
              </button>
            </div>

            {companyBases.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl text-center border border-slate-800/80">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h5 className="text-xs font-bold text-white">Nenhuma base cadastrada</h5>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Cadastre o endereço da sua empresa, galpão de cargas ou centro de distribuição para os motoristas usarem como origem.
                </p>
                <button
                  onClick={handleOpenAddBase}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Cadastrar Primeira Base
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {companyBases.map((b) => (
                  <div
                    key={b.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          {b.name}
                        </span>
                        {b.isDefault && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            Base Padrão
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 flex items-start gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </p>

                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        GPS: {b.coords.lat.toFixed(5)}, {b.coords.lng.toFixed(5)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenEditBase(b)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar base"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBase(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Remover base"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Driver Residential Addresses */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Home className="w-5 h-5 text-purple-400" />
                  <span>Endereços de Residência dos Motoristas (Ponto de Retorno)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadastrado pelo gestor para que o motorista tenha a opção de retorno à sua residência com 1 clique
                </p>
              </div>

              <button
                onClick={handleOpenAddDriver}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Motorista & Endereço</span>
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl text-center border border-slate-800/80">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h5 className="text-xs font-bold text-white">Nenhum motorista cadastrado ainda</h5>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Cadastre os motoristas que participarão do teste com seus respectivos endereços residenciais.
                </p>
                <button
                  onClick={handleOpenAddDriver}
                  className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                >
                  Cadastrar Motorista
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drivers.map((d) => (
                  <div
                    key={d.uid}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-300 font-black text-xs flex items-center justify-center border border-purple-500/30">
                            {d.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{d.displayName}</h4>
                            <span className="text-[10px] text-slate-400">{d.phone || d.email}</span>
                          </div>
                        </div>

                        {d.vehiclePlate && (
                          <span className="font-mono text-[10px] font-bold text-amber-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                            {d.vehiclePlate}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/70 text-xs">
                        <span className="text-[10px] text-purple-400 font-bold block mb-1 flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          Endereço Residencial Cadastrado:
                        </span>
                        {d.homeAddress ? (
                          <div>
                            <p className="text-white text-[11px] leading-relaxed">{d.homeAddress}</p>
                            {d.homeCoords && (
                              <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                GPS: {d.homeCoords.lat.toFixed(5)}, {d.homeCoords.lng.toFixed(5)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-400 italic">
                            ⚠️ Nenhum endereço residencial cadastrado pelo gestor ainda.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenEditDriver(d)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar Endereço</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(d.uid)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Remover motorista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOS & MANUTENÇÃO */}
      {activeTab === 'maintenances' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>Gestão Financeira & KM de Manutenção</span>
              </h3>
              <p className="text-xs text-slate-400">
                Dados consolidados dos motoristas e oficinas credenciadas para a semana de testes
              </p>
            </div>

            <button
              onClick={() => setShowMaintModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Manutenção</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Total Investido em Manutenção</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                R$ {totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                {maintenances.length} apontamento(s)
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Custo Médio de Manutenção por KM</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                R$ {costPerKmTotal} <span className="text-xs text-slate-400 font-normal">/ KM</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Baseado em {totalKmRun.toFixed(0)} KM rodados
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Custo Operacional Total</span>
              <div className="text-2xl font-black text-white font-mono">
                R$ {totalCombinedOperatingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Combustível: R$ {totalFuelCost.toFixed(2)} • Peças: R$ {totalMaintenanceCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Detalhamento dos Lançamentos ({filteredMaintenances.length})
              </h4>
            </div>

            {filteredMaintenances.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl text-center border border-slate-800/80">
                <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhum lançamento de manutenção ainda.</p>
                <button
                  onClick={() => setShowMaintModal(true)}
                  className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                >
                  Registrar Primeiro Serviço
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Veículo</th>
                      <th className="p-3">Serviço / Item</th>
                      <th className="p-3">KM Apontado</th>
                      <th className="p-3">Custo (R$)</th>
                      <th className="p-3">Motorista</th>
                      <th className="p-3">Oficina</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredMaintenances.map((m) => {
                      const meta =
                        MAINTENANCE_TYPE_LABELS[m.type] || MAINTENANCE_TYPE_LABELS.outro;
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-medium text-white">{m.date}</td>
                          <td className="p-3 font-mono text-amber-400 font-bold">{m.vehiclePlate}</td>
                          <td className="p-3">
                            <span className="flex items-center gap-1.5 font-bold text-white">
                              <span>{meta.icon}</span>
                              <span>{m.type === 'outro' && m.customTypeLabel ? m.customTypeLabel : meta.label}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-blue-400 font-bold">
                            {m.kmAtMaintenance.toLocaleString('pt-BR')} KM
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">
                            R$ {m.cost.toFixed(2)}
                          </td>
                          <td className="p-3 text-slate-300">{m.driverName}</td>
                          <td className="p-3 text-[11px] text-slate-400">{m.workshopName || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: APROVAÇÕES DE EXCLUSÃO */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Solicitações de Exclusão de Fechamento</span>
            </h3>
            <p className="text-xs text-slate-400">
              Auditória de fechamentos do dia solicitados para cancelamento pelos motoristas
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Solicitações Pendentes de Análise ({pendingRequests.length})</span>
            </h4>

            {pendingRequests.length === 0 ? (
              <div className="bg-slate-950 p-8 rounded-xl text-center border border-slate-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h5 className="text-sm font-bold text-white">Nenhuma solicitação pendente</h5>
                <p className="text-xs text-slate-400 mt-1">
                  Todos os fechamentos de romaneios estão auditados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-amber-400 px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {req.vehiclePlate}
                        </span>
                        <span className="text-sm font-bold text-white">
                          Romaneio de {req.date}
                        </span>
                        <span className="text-xs text-slate-400">
                          por <strong>{req.driverName}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-1">
                        <div>
                          <span className="text-slate-500 text-[10px] block">KM Percorrido:</span>
                          <strong className="text-blue-400 font-mono">{req.totalKm} KM</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Valor Faturado:</span>
                          <strong className="text-emerald-400 font-mono">
                            R$ {req.deliveredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs">
                        <span className="text-slate-400 font-bold block mb-0.5">
                          Justificativa do Motorista:
                        </span>
                        <p className="text-amber-200 italic">"{req.reason}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => {
                          setRejectingRequestId(req.id);
                          setRejectNotes('');
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4 text-rose-400" />
                        <span>Recusar</span>
                      </button>

                      <button
                        onClick={() => onApproveDeletion(req.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovar Exclusão</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: VEÍCULOS */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Veículos da Frota ({vehicles.length})
            </h3>
            <button
              onClick={handleOpenAddVehicle}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Veículo</span>
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h5 className="text-xs font-bold text-white">Nenhum veículo cadastrado na frota</h5>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Cadastre os utilitários, furgões ou caminhões da sua empresa para iniciar a semana de testes reais.
              </p>
              <button
                onClick={handleOpenAddVehicle}
                className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
              >
                Cadastrar Primeiro Veículo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-black px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-amber-400 tracking-wider">
                        {v.plate}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          v.status === 'ativo'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{v.model}</h4>
                    <p className="text-xs text-slate-400">
                      {v.brand} • Ano {v.year} • {v.fuelType.toUpperCase()}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/60 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">Consumo Médio</span>
                        <strong className="text-white text-xs font-mono">{v.avgKmLiter} KM/L</strong>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">Motorista</span>
                        <strong className="text-blue-400 text-xs truncate block">
                          {v.assignedDriverName || 'Não atribuído'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEditVehicle(v)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Editar veículo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Remover veículo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: MOTORISTAS */}
      {activeTab === 'drivers' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Motoristas Cadastrados ({drivers.length})
            </h3>
            <button
              onClick={handleOpenAddDriver}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Motorista</span>
            </button>
          </div>

          {drivers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h5 className="text-xs font-bold text-white">Nenhum motorista cadastrado</h5>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Adicione os motoristas da equipe com suas respectivas residências para otimizar o retorno da rota.
              </p>
              <button
                onClick={handleOpenAddDriver}
                className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
              >
                Adicionar Primeiro Motorista
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {drivers.map((d) => (
                <div
                  key={d.uid}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/30">
                          {d.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{d.displayName}</h4>
                          <p className="text-[11px] text-slate-400">{d.phone || 'Sem telefone'}</p>
                        </div>
                      </div>

                      {d.vehiclePlate && (
                        <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          {d.vehiclePlate}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                      <div>
                        E-mail de Login: <span className="text-white font-semibold">{d.email}</span>
                      </div>

                      {/* Credenciais de Acesso Geradas */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Senha Gerada:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {d.accessPassword || 'Rota@1234'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(d)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                              title="Copiar credenciais do motorista"
                            >
                              {copiedDriverId === d.uid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Botão de Enviar Credenciais via WhatsApp */}
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(d)}
                          className="w-full mt-1 py-1.5 px-2 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Enviar Acesso via WhatsApp</span>
                        </button>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-purple-400 font-bold block mb-0.5 flex items-center gap-1">
                          <Home className="w-3 h-3" /> Residência Cadastrada:
                        </span>
                        <p className="text-[11px] text-slate-200 truncate">
                          {d.homeAddress || 'Não cadastrada pelo gestor'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEditDriver(d)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Editar motorista"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(d.uid)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Remover motorista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Cadastrar / Editar Base da Empresa */}
      {showBaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>{editingBaseId ? 'Editar Base da Empresa' : 'Cadastrar Base / CD da Empresa'}</span>
              </h3>
              <button onClick={() => setShowBaseModal(false)} className="text-slate-500 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCompanyBase} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome de Identificação da Base *
                </label>
                <input
                  type="text"
                  required
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  placeholder="Ex: CD Central, Galpão Anhanguera, Matriz Campinas"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Endereço Completo (Google Maps Autocomplete) *</span>
                  {isSearchingBaseAddress && (
                    <span className="text-[10px] text-blue-400 animate-pulse">Buscando endereço...</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={baseAddress}
                    onChange={(e) => {
                      setBaseAddress(e.target.value);
                      setBaseCoords(null);
                    }}
                    placeholder="Digite a rua, número, bairro e cidade..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
                </div>

                {baseSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                    {baseSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectBaseAddress(sug)}
                        className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{sug.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {baseCoords && (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Coordenadas GPS confirmadas: {baseCoords.lat.toFixed(5)}, {baseCoords.lng.toFixed(5)}</span>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2">
                <input
                  type="checkbox"
                  checked={baseIsDefault}
                  onChange={(e) => setBaseIsDefault(e.target.checked)}
                  className="rounded text-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-white">
                  Definir como Base Padrão de Saída (Origem principal)
                </span>
              </label>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBaseModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                >
                  Salvar Base da Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cadastrar / Editar Motorista & Residência */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>{editingDriverId ? 'Editar Motorista & Residência' : 'Cadastrar Novo Motorista'}</span>
              </h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-500 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="(19) 98765-4321"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    placeholder="motorista@rotatop.com.br"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Placa do Veículo Vinculado</label>
                  <select
                    value={driverPlate}
                    onChange={(e) => setDriverPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-amber-400 font-mono font-bold"
                  >
                    <option value="">Selecione um veículo...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} - {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Senha de Acesso Gerada Automaticamente */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Senha de Acesso do Motorista (Gerada Automaticamente) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setDriverPassword(generateRandomPassword())}
                    className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-bold cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Regerar Senha</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showDriverPassword ? 'text' : 'password'}
                    required
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    placeholder="Ex: Rota@8421"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-3 pr-20 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDriverPassword(!showDriverPassword)}
                    className="absolute right-2 px-2 py-1 text-slate-400 hover:text-white text-[11px] font-semibold bg-slate-800 rounded-lg"
                  >
                    {showDriverPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  O motorista usará este <strong>E-mail</strong> e esta <strong>Senha</strong> para acessar o <em>Portal do Motorista</em> com todas as paradas e veículos vinculados.
                </p>
              </div>

              {/* Endereço Residencial do Motorista */}
              <div className="pt-2 border-t border-slate-800">
                <div className="relative">
                  <label className="block text-xs font-bold text-purple-400 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-purple-400" />
                      <span>Endereço Residencial do Motorista (Google Maps Real)</span>
                    </span>
                    {isSearchingDriverAddress && (
                      <span className="text-[10px] text-blue-400 animate-pulse">Buscando endereço...</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={driverHomeAddress}
                      onChange={(e) => {
                        setDriverHomeAddress(e.target.value);
                        setDriverHomeCoords(null);
                      }}
                      placeholder="Digite rua, número, bairro e cidade de residência do motorista..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
                  </div>

                  {driverAddressSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                      {driverAddressSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDriverAddress(sug)}
                          className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-slate-200 border-b border-slate-800/60 flex items-center gap-2 cursor-pointer"
                        >
                          <Home className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{sug.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {driverHomeCoords && (
                  <div className="mt-2 p-2 bg-purple-950/30 border border-purple-500/30 rounded-xl text-[11px] text-purple-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Residência geocodificada: {driverHomeCoords.lat.toFixed(5)}, {driverHomeCoords.lng.toFixed(5)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                >
                  Salvar Motorista & Residência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Cadastrar Veículo */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-white mb-3">
              {editingVehicleId ? 'Editar Veículo da Frota' : 'Cadastrar Novo Veículo'}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Placa *</label>
                  <input
                    type="text"
                    required
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="BRA2E19"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Ano</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: Sprinter 314 CDI Furgão"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Mercedes-Benz"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Consumo (KM/L) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={avgKm}
                    onChange={(e) => setAvgKm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Combustível</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="gasolina">Gasolina</option>
                    <option value="etanol">Etanol</option>
                    <option value="gnv">GNV</option>
                    <option value="eletrico">Elétrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="manutencao">Em Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Motorista Atribuído
                </label>
                <select
                  value={assignedDriver}
                  onChange={(e) => setAssignedDriver(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="">Nenhum motorista</option>
                  {drivers.map((d) => (
                    <option key={d.uid} value={d.displayName}>
                      {d.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Registrar Manutenção (Gestor) */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 space-y-3">
            <h3 className="text-base font-black text-white">Lançar Manutenção (Gestor)</h3>
            <form onSubmit={handleSaveManagerMaintenance} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Veículo *</label>
                  <select
                    value={newMaintPlate}
                    onChange={(e) => setNewMaintPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-amber-400 font-mono font-bold"
                  >
                    <option value="">Selecione...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={newMaintDate}
                    onChange={(e) => setNewMaintDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Manutenção *</label>
                <select
                  value={newMaintType}
                  onChange={(e) => setNewMaintType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white"
                >
                  {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">KM no Serviço *</label>
                  <input
                    type="number"
                    required
                    value={newMaintKm}
                    onChange={(e) => setNewMaintKm(e.target.value)}
                    placeholder="Ex: 52000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newMaintCost}
                    onChange={(e) => setNewMaintCost(e.target.value)}
                    placeholder="R$ 350.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Oficina / Fornecedor</label>
                <input
                  type="text"
                  value={newMaintWorkshop}
                  onChange={(e) => setNewMaintWorkshop(e.target.value)}
                  placeholder="Nome do estabelecimento"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={newMaintNotes}
                  onChange={(e) => setNewMaintNotes(e.target.value)}
                  placeholder="NF, peças substituídas..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Recusar Solicitação de Exclusão */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-white">Recusar Exclusão de Fechamento</h3>
            <p className="text-xs text-slate-400">
              O romaneio continuará ativo e arquivado no histórico da empresa.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Motivo da Recusa (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Ex: Entregas já foram faturadas com notas emitidas..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirmar Recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Visualizador de Fotos do Romaneio */}
      <ManifestViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={viewerImages}
        title={viewerTitle}
        driverName={viewerMeta.driverName}
        vehiclePlate={viewerMeta.vehiclePlate}
        date={viewerMeta.date}
      />
    </div>
  );
};
