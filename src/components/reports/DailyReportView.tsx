import React, { useState } from 'react';
import { Route, TimeFilter } from '../../types';
import { RequestClosureDeletionModal } from './RequestClosureDeletionModal';
import { downloadFinancialClosurePdf } from '../../lib/pdfGenerator';
import {
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Truck,
  Fuel,
  DollarSign,
  FileSpreadsheet,
  ArrowUpRight,
  Trash2,
  Clock,
  ShieldAlert,
  FileText,
} from 'lucide-react';

interface DailyReportViewProps {
  activeRoute: Route;
  historicalRoutes: Route[];
  onRequestDeleteRoute?: (routeId: string, reason: string) => void;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  activeRoute,
  historicalRoutes,
  onRequestDeleteRoute,
}) => {
  const [filter, setFilter] = useState<TimeFilter>('dia');
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [selectedRouteForDeletion, setSelectedRouteForDeletion] = useState<Route | null>(null);

  const allRoutes = [activeRoute, ...historicalRoutes];

  // Aggregate metrics based on filter
  // Filter logic:
  // 'dia' => today (active route)
  // 'semana' => last 7 days (all mock dates are within this week)
  // 'mes' => all
  // 'ano' => all
  const filteredRoutes =
    filter === 'dia'
      ? [activeRoute]
      : filter === 'semana'
      ? allRoutes.slice(0, 3)
      : allRoutes;

  const totalFinishedDeliveries = filteredRoutes.reduce((acc, r) => {
    return acc + (r.stops ? r.stops.filter((s) => s.status === 'entregue').length : 4);
  }, 0);

  const totalCanceledDeliveries = filteredRoutes.reduce((acc, r) => {
    return acc + (r.stops ? r.stops.filter((s) => s.status === 'cancelada').length : 0);
  }, 0);

  const totalRescheduledDeliveries = filteredRoutes.reduce((acc, r) => {
    return acc + (r.stops ? r.stops.filter((s) => s.status === 'reentregar').length : 1);
  }, 0);

  const totalKmRun = filteredRoutes.reduce((acc, r) => acc + (r.totalKm || 0), 0);
  const totalProductiveKm = filteredRoutes.reduce((acc, r) => acc + (r.productiveKm || 0), 0);
  const totalUnproductiveKm = filteredRoutes.reduce((acc, r) => acc + (r.unproductiveKm || 0), 0);
  const totalFuelCost = filteredRoutes.reduce((acc, r) => acc + (r.estimatedFuelCost || 0), 0);
  const totalCargoValue = filteredRoutes.reduce((acc, r) => acc + (r.deliveredValue || 0), 0);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Data',
      'Motorista',
      'Placa',
      'Status',
      'KM Produtiva',
      'KM Improdutiva',
      'KM Total',
      'Custo Combustível (R$)',
      'Valor Entregue (R$)',
      'Total Entregas',
    ];

    const rows = filteredRoutes.map((r) => [
      r.date,
      r.driverName,
      r.vehiclePlate,
      r.status,
      r.productiveKm,
      r.unproductiveKm,
      r.totalKm,
      r.estimatedFuelCost.toFixed(2),
      r.deliveredValue.toFixed(2),
      r.stops ? r.stops.length : 5,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rotatop_relatorio_${filter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const handleExportPdf = () => {
    downloadFinancialClosurePdf(
      filteredRoutes,
      {
        title: `PRESTAÇÃO DE CONTAS & FECHAMENTO - ${filter === 'dia' ? 'HOJE' : filter.toUpperCase()}`,
        subtitle: 'Relatório Oficial de Fechamento Operacional e Financeiro da Frota',
        periodLabel: filter === 'dia' ? 'Hoje' : `Filtro: ${filter}`,
        driverName: activeRoute.driverName,
        vehiclePlate: activeRoute.vehiclePlate,
        companyBaseAddress: activeRoute.startAddress,
      },
      `prestacao_contas_${filter}`
    );
  };

  const handleExportSinglePdf = (route: Route) => {
    downloadFinancialClosurePdf(
      [route],
      {
        title: `COMPROVANTE DE FECHAMENTO - ROTA ${route.date}`,
        subtitle: `Auditoria de Entregas, Odômetro e Combustível - Placa ${route.vehiclePlate}`,
        periodLabel: route.date,
        driverName: route.driverName,
        vehiclePlate: route.vehiclePlate,
        companyBaseAddress: route.startAddress,
      },
      `comprovante_rota_${route.date}_${route.vehiclePlate}`
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Filter & Export Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Relatórios e Fechamento Operacional
          </h3>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Time Filter Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {(['dia', 'semana', 'mes', 'ano'] as TimeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  filter === t
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'dia' ? 'Hoje' : t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar Prestação de Contas em Documento PDF Oficial"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar dados para Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Entregas Finalizadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {totalFinishedDeliveries}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Concluídas com sucesso</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Canceladas / Devolvidas</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {totalCanceledDeliveries}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Tentativas frustradas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Reentregas Realocadas</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {totalRescheduledDeliveries}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Movidas para fim de rota</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Gasto de Combustível</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            R$ {totalFuelCost.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {totalKmRun.toFixed(1)} km rodados
          </span>
        </div>
      </div>

      {/* KM Analysis Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Eficiência de Deslocamento Acumulada
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-0.5">Quilometragem Total</span>
            <strong className="text-lg text-white font-mono">{totalKmRun.toFixed(1)} KM</strong>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-blue-900/40">
            <span className="text-blue-400 block mb-0.5">KM Produtiva (Com Carga)</span>
            <strong className="text-lg text-blue-400 font-mono">
              {totalProductiveKm.toFixed(1)} KM{' '}
              <span className="text-xs font-normal text-slate-400">
                ({totalKmRun > 0 ? Math.round((totalProductiveKm / totalKmRun) * 100) : 0}%)
              </span>
            </strong>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-purple-900/40">
            <span className="text-purple-400 block mb-0.5">KM Improdutiva (Vazio)</span>
            <strong className="text-lg text-purple-400 font-mono">
              {totalUnproductiveKm.toFixed(1)} KM{' '}
              <span className="text-xs font-normal text-slate-400">
                ({totalKmRun > 0 ? Math.round((totalUnproductiveKm / totalKmRun) * 100) : 0}%)
              </span>
            </strong>
          </div>
        </div>
      </div>

      {/* Historical Routes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Histórico de Romaneios ({filteredRoutes.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Motorista</th>
                <th className="p-3">Veículo</th>
                <th className="p-3">KM (Prod / Total)</th>
                <th className="p-3">Combustível</th>
                <th className="p-3">Valor Faturado</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-medium text-white">{r.date}</td>
                  <td className="p-3">{r.driverName}</td>
                  <td className="p-3 font-mono text-amber-400 font-bold">{r.vehiclePlate}</td>
                  <td className="p-3 font-mono">
                    <span className="text-blue-400">{r.productiveKm} km</span> / {r.totalKm} km
                  </td>
                  <td className="p-3 font-mono text-amber-400 font-bold">
                    R$ {r.estimatedFuelCost.toFixed(2)}
                  </td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">
                    R$ {r.deliveredValue.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {r.status === 'aguardando_exclusao' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Aguardando Gestor
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'concluida'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleExportSinglePdf(r)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 rounded-lg transition-all cursor-pointer"
                        title="Baixar comprovante desta rota em PDF"
                      >
                        <FileText className="w-3 h-3" />
                        <span>PDF</span>
                      </button>

                      {r.status === 'aguardando_exclusao' ? (
                        <span
                          className="text-[11px] text-amber-400/90 font-medium cursor-help"
                          title={r.deletionReason ? `Motivo: ${r.deletionReason}` : 'Aguardando aprovação do gestor'}
                        >
                          Exclusão solicitada
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRouteForDeletion(r);
                            setIsDeletionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 rounded-lg transition-all cursor-pointer"
                          title="Solicitar aprovação para apagar este fechamento"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Apagar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closure Deletion Request Modal */}
      <RequestClosureDeletionModal
        isOpen={isDeletionModalOpen}
        route={selectedRouteForDeletion}
        onClose={() => {
          setIsDeletionModalOpen(false);
          setSelectedRouteForDeletion(null);
        }}
        onSubmitRequest={(routeId, reason) => {
          onRequestDeleteRoute?.(routeId, reason);
        }}
      />
    </div>
  );
};
