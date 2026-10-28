import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Route } from '../types';

export interface PdfReportOptions {
  title?: string;
  subtitle?: string;
  driverName?: string;
  vehiclePlate?: string;
  periodLabel?: string;
  companyName?: string;
  companyBaseAddress?: string;
}

/**
 * Format currency in Brazilian Real
 */
function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Format date in Brazilian standard DD/MM/YYYY
 */
function formatDateBR(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

/**
 * Generates and downloads a comprehensive, production-grade PDF financial & delivery report
 */
export function generateFinancialClosurePdf(
  routes: Route[],
  options: PdfReportOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const title = options.title || 'PRESTAÇÃO DE CONTAS & FECHAMENTO FINANCEIRO';
  const subtitle =
    options.subtitle ||
    'Relatório Oficial de Fechamento Operacional, Odômetro e Custos de Frota';
  const companyName = options.companyName || 'ROTATOP LOGÍSTICA & FROTAS';
  const emitDate = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  // Aggregate Metrics across provided routes
  const totalRoutesCount = routes.length;
  const totalDeliveredValue = routes.reduce((acc, r) => acc + (r.deliveredValue || 0), 0);
  const totalDeliveredWeight = routes.reduce((acc, r) => acc + (r.deliveredWeight || 0), 0);
  const totalProductiveKm = routes.reduce((acc, r) => acc + (r.productiveKm || 0), 0);
  const totalUnproductiveKm = routes.reduce((acc, r) => acc + (r.unproductiveKm || 0), 0);
  const totalKmRun = routes.reduce((acc, r) => acc + (r.totalKm || 0), 0);
  const totalFuelCost = routes.reduce((acc, r) => acc + (r.estimatedFuelCost || 0), 0);
  const netOperatingMargin = Math.max(0, totalDeliveredValue - totalFuelCost);

  let totalFinishedDeliveries = 0;
  let totalCanceledDeliveries = 0;
  let totalPendingDeliveries = 0;

  routes.forEach((r) => {
    if (Array.isArray(r.stops)) {
      r.stops.forEach((s) => {
        if (s.status === 'entregue') totalFinishedDeliveries++;
        else if (s.status === 'cancelada') totalCanceledDeliveries++;
        else totalPendingDeliveries++;
      });
    }
  });

  // 1. Header Banner (Dark Navy Theme with Gold Accent)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(companyName, margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(subtitle, margin, 18);

  // Emission Date Top Right
  doc.setFontSize(8);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(`Emissão: ${emitDate}`, pageWidth - margin, 12, { align: 'right' });
  doc.setTextColor(148, 163, 184); // slate-400
  if (options.periodLabel) {
    doc.text(`Período: ${options.periodLabel}`, pageWidth - margin, 18, { align: 'right' });
  }

  let cursorY = 36;

  // 2. Report Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin, cursorY);
  cursorY += 6;

  // 3. Driver & Vehicle Info Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const driverLabel = options.driverName || routes[0]?.driverName || 'Motorista Titular';
  const plateLabel = options.vehiclePlate || routes[0]?.vehiclePlate || 'Frota Geral';
  const baseLabel = options.companyBaseAddress || routes[0]?.startAddress || 'Centro de Distribuição Regional';

  doc.text(`MOTORISTA:`, margin + 4, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(driverLabel, margin + 26, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`PLACA:`, margin + 85, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(plateLabel, margin + 100, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`FECHAMENTOS:`, margin + 130, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalRoutesCount} romaneio(s)`, margin + 158, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`BASE OPERACIONAL:`, margin + 4, cursorY + 12);
  doc.setFont('helvetica', 'normal');
  const cleanBase = baseLabel.length > 70 ? baseLabel.slice(0, 67) + '...' : baseLabel;
  doc.text(cleanBase, margin + 39, cursorY + 12);

  cursorY += 21;

  // 4. Executive Financial & KPI Summary Cards
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 17;

  // Card 1: Valor Faturado
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(margin, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text('TOTAL FATURADO (R$)', margin + 3, cursorY + 5);
  doc.setFontSize(10.5);
  doc.text(formatBRL(totalDeliveredValue), margin + 3, cursorY + 12);

  // Card 2: Peso Transportado
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(margin + cardWidth + 3, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(55, 48, 163); // indigo-800
  doc.text('PESO TRANSPORTADO', margin + cardWidth + 6, cursorY + 5);
  doc.setFontSize(10.5);
  doc.text(`${totalDeliveredWeight.toFixed(1)} kg`, margin + cardWidth + 6, cursorY + 12);

  // Card 3: KM Rodada (Produtiva vs Improdutiva)
  doc.setFillColor(245, 243, 255); // purple-50
  doc.setDrawColor(233, 213, 255); // purple-200
  doc.roundedRect(margin + (cardWidth + 3) * 2, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(107, 33, 168); // purple-800
  doc.text('QUILOMETRAGEM TOTAL', margin + (cardWidth + 3) * 2 + 3, cursorY + 5);
  doc.setFontSize(10.5);
  doc.text(`${totalKmRun.toFixed(1)} km`, margin + (cardWidth + 3) * 2 + 3, cursorY + 12);

  // Card 4: Custo Combustível
  doc.setFillColor(254, 243, 199); // amber-50
  doc.setDrawColor(253, 230, 138); // amber-200
  doc.roundedRect(margin + (cardWidth + 3) * 3, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('CUSTO COMBUSTÍVEL', margin + (cardWidth + 3) * 3 + 3, cursorY + 5);
  doc.setFontSize(10.5);
  doc.text(formatBRL(totalFuelCost), margin + (cardWidth + 3) * 3 + 3, cursorY + 12);

  cursorY += cardHeight + 4;

  // Secondary Strip: KM Produtivo vs Improdutivo & Entregas
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 7, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const kmDetailsText = `Detalhamento KM:  Produtiva (Com Carga): ${totalProductiveKm.toFixed(1)} km  |  Improdutiva (Deslocamento / Odômetro): ${totalUnproductiveKm.toFixed(1)} km  |  Entregas Feitas: ${totalFinishedDeliveries}  |  Devoluções: ${totalCanceledDeliveries}`;
  doc.text(kmDetailsText, margin + 4, cursorY + 4.5);

  cursorY += 11;

  // 5. Main Routes Closure Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('HISTÓRICO DE ROTAS E FECHAMENTOS', margin, cursorY);
  cursorY += 2;

  const tableRows = routes.map((r, idx) => {
    const stopsCount = r.stops ? r.stops.length : 0;
    const deliveredCount = r.stops ? r.stops.filter((s) => s.status === 'entregue').length : 0;
    const odoCalibrated = r.odometerCalculated ? '✓ Sim' : 'Estimado';

    return [
      `#${idx + 1}`,
      formatDateBR(r.date),
      r.driverName || driverLabel,
      r.vehiclePlate || plateLabel,
      `${deliveredCount}/${stopsCount}`,
      `${r.productiveKm.toFixed(1)} km`,
      `${r.unproductiveKm.toFixed(1)} km`,
      `${r.totalKm.toFixed(1)} km`,
      odoCalibrated,
      formatBRL(r.estimatedFuelCost),
      formatBRL(r.deliveredValue),
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [[
      'Seq',
      'Data',
      'Motorista',
      'Placa',
      'Entregas',
      'KM Prod',
      'KM Impr',
      'KM Total',
      'Odômetro',
      'Combustível',
      'Faturado',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 16 },
      2: { cellWidth: 28 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 15 },
      6: { halign: 'right', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 15, fontStyle: 'bold' },
      8: { halign: 'center', cellWidth: 15 },
      9: { halign: 'right', cellWidth: 20 },
      10: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
    },
  });

  // Get final Y after table
  const lastTable = (doc as any).lastAutoTable;
  cursorY = lastTable ? lastTable.finalY + 8 : cursorY + 40;

  // 6. Detailed Delivery Stops (If single route or detailed view is applicable)
  const allStopsWithDetails: Array<{ routeDate: string; stop: any }> = [];
  routes.forEach((r) => {
    if (r.stops) {
      r.stops.forEach((s) => {
        allStopsWithDetails.push({ routeDate: r.date, stop: s });
      });
    }
  });

  // If there are deliveries, print delivery stops breakdown table
  if (allStopsWithDetails.length > 0 && allStopsWithDetails.length <= 40) {
    // Check if new page is needed
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DETALHAMENTO INDIVIDUAL DAS ENTREGAS REALIZADAS', margin, cursorY);
    cursorY += 2;

    const stopRows = allStopsWithDetails.map(({ routeDate, stop }, idx) => [
      `${idx + 1}`,
      formatDateBR(routeDate),
      stop.orderNumber || (stop.notes?.match(/Pedido\s*(\d+)/i)?.[1]) || '—',
      stop.clientName || 'Cliente',
      stop.address ? (stop.address.length > 38 ? stop.address.slice(0, 35) + '...' : stop.address) : '—',
      `${(stop.totalWeight || 0).toFixed(1)} kg`,
      formatBRL(stop.orderValue || 0),
      stop.status === 'entregue' ? 'Entregue' : stop.status === 'cancelada' ? 'Cancelada' : 'Pendente',
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['#', 'Data', 'Pedido / NF', 'Cliente Destinatário', 'Endereço', 'Peso', 'Valor (R$)', 'Status']],
      body: stopRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 6.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 18 },
        3: { cellWidth: 42 },
        4: { cellWidth: 50 },
        5: { halign: 'right', cellWidth: 14 },
        6: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
        7: { halign: 'center', cellWidth: 17 },
      },
    });

    const lastStopTable = (doc as any).lastAutoTable;
    cursorY = lastStopTable ? lastStopTable.finalY + 10 : cursorY + 40;
  }

  // 7. Signatures & Settlement Block
  // Ensure we don't overflow the page
  if (cursorY > pageHeight - 38) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Declaro para os devidos fins que os valores arrecadados, paradas cumpridas e quilometragens apontadas neste relatório foram auditados e conferidos rigorosamente.',
    margin + 4,
    cursorY + 5
  );

  const sigWidth = 70;
  const sigY = cursorY + 20;

  // Driver signature line
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 12, sigY, margin + 12 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Assinatura do Motorista', margin + 12 + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(driverLabel, margin + 12 + sigWidth / 2, sigY + 7, { align: 'center' });

  // Manager signature line
  const managerX = pageWidth - margin - 12 - sigWidth;
  doc.line(managerX, sigY, managerX + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Assinatura / Visto do Gestor (Frota)', managerX + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Guilherme (Gestão Operacional)', managerX + sigWidth / 2, sigY + 7, { align: 'center' });

  // 8. Footer page number on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Rotatop Gestão Logística • Documento de prestação de contas gerado em ${emitDate} • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Convenience helper to download the PDF directly in the browser
 */
export function downloadFinancialClosurePdf(
  routes: Route[],
  options: PdfReportOptions = {},
  filenamePrefix = 'prestacao_contas'
) {
  const doc = generateFinancialClosurePdf(routes, options);
  const cleanDate = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${cleanDate}.pdf`;
  doc.save(filename);
}
