import React, { useState } from 'react';
import { Route, Vehicle, UserProfile } from '../../types';
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
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Gauge,
  Calendar,
} from 'lucide-react';

interface ManagerDashboardProps {
  vehicles: Vehicle[];
  onSaveVehicles: (vehicles: Vehicle[]) => void;
  activeRoute: Route;
  historicalRoutes: Route[];
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  vehicles,
  onSaveVehicles,
  activeRoute,
  historicalRoutes,
}) => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'vehicles' | 'drivers'>('kpis');

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
  const [driverName, setDriverName] = useState('');

  // Consolidated KPIs
  const allRoutes = [activeRoute, ...historicalRoutes];
  const activeVehiclesCount = vehicles.filter((v) => v.status === 'ativo').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'manutencao').length;

  const totalDeliveriesCount = allRoutes.reduce((acc, r) => acc + (r.stops?.length || 5), 0);
  const completedDeliveriesCount = allRoutes.reduce(
    (acc, r) =>
      acc +
      (r.stops ? r.stops.filter((s) => s.status === 'entregue').length : 4),
    0
  );
  const totalRevenue = allRoutes.reduce((acc, r) => acc + (r.totalValue || 0), 0);
  const totalFuelCost = allRoutes.reduce((acc, r) => acc + (r.estimatedFuelCost || 0), 0);
  const totalKmRun = allRoutes.reduce((acc, r) => acc + (r.totalKm || 0), 0);

  const deliverySuccessRate =
    totalDeliveriesCount > 0
      ? Math.round((completedDeliveriesCount / totalDeliveriesCount) * 100)
      : 100;

  // Mock Drivers List
  const [drivers, setDrivers] = useState<UserProfile[]>([
    {
      uid: 'driver-carlos',
      displayName: 'Carlos Silva',
      email: 'carlos.motorista@rotatop.com.br',
      role: 'motorista',
      phone: '(11) 98765-4321',
      vehiclePlate: 'BRA-2E19',
    },
    {
      uid: 'driver-marcos',
      displayName: 'Marcos Oliveira',
      email: 'marcos.rotas@rotatop.com.br',
      role: 'motorista',
      phone: '(11) 97654-3210',
      vehiclePlate: 'RTO-8A45',
    },
    {
      uid: 'driver-roberto',
      displayName: 'Roberto Souza',
      email: 'roberto.entrega@rotatop.com.br',
      role: 'motorista',
      phone: '(11) 96543-2109',
      vehiclePlate: 'LOG-4F90',
    },
  ]);

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverPlate, setNewDriverPlate] = useState('');

  const handleOpenAddVehicle = () => {
    setEditingVehicleId(null);
    setPlate('');
    setModel('');
    setBrand('');
    setYear('2023');
    setAvgKm('9.5');
    setFuelType('diesel');
    setStatus('ativo');
    setDriverName('');
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
    setDriverName(v.assignedDriverName || '');
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
              assignedDriverName: driverName.trim(),
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
        assignedDriverName: driverName.trim(),
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

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim()) return;

    const newDriver: UserProfile = {
      uid: `driver-${Date.now()}`,
      displayName: newDriverName.trim(),
      email: `${newDriverName.toLowerCase().replace(/\s+/g, '.')}@rotatop.com.br`,
      role: 'motorista',
      phone: newDriverPhone.trim() || '(11) 90000-0000',
      vehiclePlate: newDriverPlate.toUpperCase().trim(),
    };

    setDrivers([...drivers, newDriver]);
    setNewDriverName('');
    setNewDriverPhone('');
    setNewDriverPlate('');
    setShowDriverModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Manager Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'kpis'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Frota de Veículos ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'drivers'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Motoristas ({drivers.length})</span>
        </button>
      </div>

      {/* 1. KPIs View */}
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
                {maintenanceCount} veículo(s) em manutenção preventiva
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
                {deliverySuccessRate}% de taxa de sucesso acumulada
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Valor Transportado</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total de carga consolidada em rotas
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Custo com Combustível</span>
                <Fuel className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                R$ {totalFuelCost.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalKmRun.toFixed(0)} KM rodados no total
              </p>
            </div>
          </div>

          {/* Active Route Real-Time Monitor Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Rota do Dia em Andamento (Ao Vivo)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Motorista: {activeRoute.driverName} • {activeRoute.vehiclePlate}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Status de Paradas</span>
                <div className="flex items-center gap-2 text-sm font-bold text-white mt-1">
                  <span className="text-emerald-400">
                    {activeRoute.stops.filter((s) => s.status === 'entregue').length} Entregues
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400">
                    {activeRoute.stops.filter((s) => s.status === 'pendente' || s.status === 'reentregar').length} Pendentes
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Quilometragem</span>
                <div className="text-sm font-bold text-white mt-1">
                  <span className="text-blue-400">{activeRoute.productiveKm} km produtiva</span>{' '}
                  <span className="text-slate-500">/ {activeRoute.totalKm} km total</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Consumo & Custo Estimado</span>
                <div className="text-sm font-bold text-amber-400 mt-1">
                  R$ {activeRoute.estimatedFuelCost.toFixed(2)}{' '}
                  <span className="text-slate-500 font-normal">
                    ({activeRoute.avgKmLiter} km/l @ R${activeRoute.fuelPrice})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Vehicles Management */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Veículos da Frota
            </h3>
            <button
              onClick={handleOpenAddVehicle}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Veículo</span>
            </button>
          </div>

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
                          : v.status === 'manutencao'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Editar veículo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Remover veículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Drivers Management */}
      {activeTab === 'drivers' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Motoristas Cadastrados
            </h3>
            <button
              onClick={() => setShowDriverModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Motorista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {drivers.map((d) => (
              <div
                key={d.uid}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-black text-sm flex items-center justify-center border border-blue-500/30">
                    {d.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{d.displayName}</h4>
                    <p className="text-xs text-slate-400">{d.phone}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>
                    E-mail: <span className="text-slate-200">{d.email}</span>
                  </div>
                  <div>
                    Veículo Vinculado:{' '}
                    <span className="font-mono text-amber-400 font-bold">
                      {d.vehiclePlate || 'Nenhum'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Form Modal */}
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
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nome do motorista responsável"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
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

      {/* Driver Form Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-base font-black text-white mb-3">Cadastrar Novo Motorista</h3>
            <form onSubmit={handleAddDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Telefone WhatsApp</label>
                <input
                  type="text"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Placa do Veículo</label>
                <input
                  type="text"
                  value={newDriverPlate}
                  onChange={(e) => setNewDriverPlate(e.target.value)}
                  placeholder="BRA-2E19"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono uppercase"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
