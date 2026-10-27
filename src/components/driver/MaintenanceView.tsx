import React, { useState } from 'react';
import { MaintenanceRecord, MaintenanceType, Vehicle, UserProfile } from '../../types';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Gauge,
  Truck,
  Disc,
  Droplets,
  Layers,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

interface MaintenanceViewProps {
  currentUser: UserProfile;
  vehicles: Vehicle[];
  maintenances: MaintenanceRecord[];
  onAddMaintenance: (record: MaintenanceRecord) => void;
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, { label: string; icon: string }> = {
  troca_oleo: { label: 'Troca de Óleo', icon: '🛢️' },
  troca_pneu: { label: 'Troca de Pneu', icon: '🔘' },
  alinhamento_balanceamento: { label: 'Alinhamento & Balanceamento', icon: '⚖️' },
  freios: { label: 'Freios e Pastilhas', icon: '🛑' },
  filtros: { label: 'Filtros (Ar / Combustível)', icon: '💨' },
  revisao_geral: { label: 'Revisão Periódica', icon: '🔧' },
  suspensao: { label: 'Suspensão e Amortecedor', icon: '🔩' },
  bateria: { label: 'Bateria e Elétrica', icon: '🔋' },
  outro: { label: 'Outro Reparo', icon: '🛠️' },
};

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  currentUser,
  vehicles,
  maintenances,
  onAddMaintenance,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  // Form State
  const defaultPlate =
    currentUser.vehiclePlate || (vehicles.length > 0 ? vehicles[0].plate : 'BRA-2E19');
  const [vehiclePlate, setVehiclePlate] = useState(defaultPlate);
  const [type, setType] = useState<MaintenanceType>('troca_oleo');
  const [customLabel, setCustomLabel] = useState('');
  const [cost, setCost] = useState('');
  const [kmAtMaintenance, setKmAtMaintenance] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [workshopName, setWorkshopName] = useState('');
  const [notes, setNotes] = useState('');

  // Driver's vehicle stats
  const driverMaintenances = maintenances.filter(
    (m) => m.vehiclePlate === vehiclePlate || m.driverId === currentUser.uid
  );

  const totalSpentByDriver = driverMaintenances.reduce((acc, m) => acc + m.cost, 0);

  // Find last oil change
  const lastOilChange = driverMaintenances
    .filter((m) => m.type === 'troca_oleo')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // Find last tire change
  const lastTireChange = driverMaintenances
    .filter((m) => m.type === 'troca_pneu')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const handleOpenModal = () => {
    setVehiclePlate(currentUser.vehiclePlate || (vehicles.length > 0 ? vehicles[0].plate : 'BRA-2E19'));
    setType('troca_oleo');
    setCustomLabel('');
    setCost('');
    setKmAtMaintenance('');
    setDate(new Date().toISOString().slice(0, 10));
    setWorkshopName('');
    setNotes('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cost || !kmAtMaintenance) return;

    const newRecord: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      driverId: currentUser.uid,
      driverName: currentUser.displayName || 'Motorista',
      type,
      customTypeLabel: type === 'outro' ? customLabel.trim() : undefined,
      cost: parseFloat(cost) || 0,
      kmAtMaintenance: parseInt(kmAtMaintenance) || 0,
      date,
      workshopName: workshopName.trim() || 'Oficina Não Informada',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddMaintenance(newRecord);
    setShowModal(false);
  };

  const filteredMaintenances = maintenances.filter((m) => {
    const matchesSearch =
      m.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.workshopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'todos' || m.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Controle de Manutenção do Veículo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lance trocas de óleo, pneus e reparos para gerar histórico de custos e KM para a gestão
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Apontar Manutenção</span>
        </button>
      </div>

      {/* Driver Vehicle Maintenance Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Gasto no Veículo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Investimento em Manutenção</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            R$ {totalSpentByDriver.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {driverMaintenances.length} serviços realizados no seu veículo
          </span>
        </div>

        {/* Última Troca de Óleo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Última Troca de Óleo</span>
            <span className="text-base">🛢️</span>
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {lastOilChange ? `${lastOilChange.kmAtMaintenance.toLocaleString('pt-BR')} KM` : 'Sem registro'}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {lastOilChange ? `Data: ${lastOilChange.date} • ${lastOilChange.workshopName || 'Oficina'}` : 'Recomenda-se trocar a cada 10.000 KM'}
          </span>
        </div>

        {/* Última Troca de Pneu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Último Rodízio / Troca Pneu</span>
            <span className="text-base">🔘</span>
          </div>
          <div className="text-xl font-black text-blue-400 font-mono">
            {lastTireChange ? `${lastTireChange.kmAtMaintenance.toLocaleString('pt-BR')} KM` : 'Sem registro'}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {lastTireChange ? `Data: ${lastTireChange.date}` : 'Calibrar semanalmente'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, oficina, observação..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos os Serviços</option>
            {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Maintenances List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Histórico de Manutenções Lançadas ({filteredMaintenances.length})
          </h4>
          <span className="text-[11px] text-slate-500">
            Visível também para a diretoria/gestor da frota
          </span>
        </div>

        {filteredMaintenances.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center">
            <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhum registro de manutenção encontrado.</p>
            <button
              onClick={handleOpenModal}
              className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              Lançar Primeiro Serviço
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMaintenances.map((m) => {
              const meta = MAINTENANCE_TYPE_LABELS[m.type] || MAINTENANCE_TYPE_LABELS.outro;
              return (
                <div
                  key={m.id}
                  className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <h5 className="text-xs font-bold text-white">
                            {m.type === 'outro' && m.customTypeLabel ? m.customTypeLabel : meta.label}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            Data: {m.date}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {m.vehiclePlate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs my-2.5">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 block">KM no Serviço</span>
                        <strong className="text-white font-mono">{m.kmAtMaintenance.toLocaleString('pt-BR')} KM</strong>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 block">Custo Total</span>
                        <strong className="text-emerald-400 font-mono">
                          R$ {m.cost.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {m.workshopName && (
                      <p className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Oficina:</span> {m.workshopName}
                      </p>
                    )}

                    {m.notes && (
                      <p className="text-[11px] text-slate-300 mt-1 italic bg-slate-900/40 p-1.5 rounded border border-slate-800/40">
                        "{m.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Lançado por: {m.driverName}</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Registrado no Gestor
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Maintenance Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Lançar Manutenção de Veículo</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Veículo / Placa *
                  </label>
                  <select
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-amber-400 font-mono font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} - {v.model}
                      </option>
                    ))}
                    {vehicles.length === 0 && (
                      <option value="BRA-2E19">BRA-2E19 - Sprinter 314</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Data do Serviço *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tipo de Manutenção / Peça *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MaintenanceType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                >
                  {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {type === 'outro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Descrição do Reparo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Ex: Troca de correia dentada, bomba d'água..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    KM Atual do Veículo *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={kmAtMaintenance}
                      onChange={(e) => setKmAtMaintenance(e.target.value)}
                      placeholder="Ex: 48500"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono font-bold pr-10"
                    />
                    <span className="absolute right-2.5 top-2 text-xs text-slate-500 font-bold">
                      KM
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Valor Pago / Custo (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-bold">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="450.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-3 text-xs text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Oficina Mecânica / Posto / Fornecedor
                </label>
                <input
                  type="text"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="Ex: Auto Mecânica São Cristóvão / Posto Ipiranga"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Detalhes / Número da Nota Fiscal
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: NF 14590, troca de 7 litros de óleo 5W30 com filtro fram..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-950/40 cursor-pointer"
                >
                  Salvar Manutenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
