import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Reporte } from './types';

// Helper to remove emojis and non-Latin1 characters that break jsPDF Helvetica font
const cleanForPDF = (str: string | undefined | null) => {
  if (!str) return '-';
  // Remove non-ASCII and non-Latin1 characters (this automatically removes emojis and strange symbols)
  return str
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .trim();
};

export function generateWeeklyReportPDF(
  reportes: Reporte[],
  semana: number,
  año: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // 1. ENCABEZADO CORPORATIVO "REPOS"
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REPOS - INFORME DE ACTIVIDADES', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 13, { align: 'right' });

  y = 26;

  // 2. RESUMEN EJECUTIVO COMPACTO
  const total = reportes.length;
  const completados = reportes.filter((r) => r.estado === 'Completado' || r.estado === 'Resuelto').length;
  const pendientes = reportes.filter((r) => r.estado === 'Pendiente' || r.estado === 'En Proceso').length;
  const noCompletados = reportes.filter((r) => r.estado === 'No Completado' || r.estado === 'Rechazado').length;

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Resumen: Total (${total}) | Completados (${completados}) | Pendientes (${pendientes}) | No Completados (${noCompletados})`, 14, y);
  
  y += 6;

  // Separar los reportes
  const reportesSoporte = reportes.filter(r => r.tipo_actividad === 'soporte');
  const reportesLibres = reportes.filter(r => r.tipo_actividad === 'libre');

  // 3. TABLA DE REPORTES DE SOPORTE TÉCNICO
  if (reportesSoporte.length > 0) {
    const tableDataSoporte = reportesSoporte.map((r) => {
      
      let clienteStr = '';
      if (r.folio) clienteStr += `Folio: ${r.folio}\n`;
      if (r.nombre_cliente) clienteStr += `${r.nombre_cliente}\n`;
      if (r.telefono_cliente) clienteStr += `Tel: ${r.telefono_cliente}`;
      
      let diagnosticoStr = `RX: ${r.equipo_de_rx || '-'}\nParam Actuales: ${r.parametros_actuales || '-'}`;
      let solucionStr = `Accion: ${r.accion_realizada || '-'}\nParam Mejorados: ${r.parametros_mejorados || '-'}`;
      let estadoStr = `${r.estado}\nCierre: ${r.fecha_solucion || '-'}`;

      return [
        cleanForPDF(r.fecha_creacion),
        cleanForPDF(clienteStr),
        cleanForPDF(diagnosticoStr),
        cleanForPDF(solucionStr),
        cleanForPDF(estadoStr),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Fecha Creacion', 'Cliente y Ubicacion', 'Diagnostico Inicial', 'Accion y Resultados', 'Estado y Cierre']],
      body: tableDataSoporte,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 40 },
        3: { cellWidth: 55 },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const estadoInfo = data.cell.raw as string;
          if (estadoInfo.includes('Completado') || estadoInfo.includes('Resuelto')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (estadoInfo.includes('Pendiente') || estadoInfo.includes('En Proceso')) {
            data.cell.styles.textColor = [245, 158, 11];
          } else if (estadoInfo.includes('No Completado') || estadoInfo.includes('Rechazado')) {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // 4. TABLA DE REPORTES LIBRES
  if (reportesLibres.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('REPORTE DE ACTIVIDADES LIBRES', 14, y);
    y += 4;

    const tableDataLibre = reportesLibres.map((r) => {
      return [
        cleanForPDF(r.fecha_creacion),
        cleanForPDF(r.descripcion_actividad),
        cleanForPDF(r.estado),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Fecha Creacion', 'Detalle de Actividad Libre', 'Estado']],
      body: tableDataLibre,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110], // Teal 700 para distinguirlo visualmente
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 122 },
        2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const estadoInfo = data.cell.raw as string;
          if (estadoInfo.includes('Completado') || estadoInfo.includes('Resuelto')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (estadoInfo.includes('Pendiente') || estadoInfo.includes('En Proceso')) {
            data.cell.styles.textColor = [245, 158, 11];
          } else if (estadoInfo.includes('No Completado') || estadoInfo.includes('Rechazado')) {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. ANEXO DE EVIDENCIAS FOTOGRÁFICAS
  const reportesConFotos = reportes.filter((r) => r.evidencia_urls && r.evidencia_urls.length > 0);

  if (reportesConFotos.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('ANEXO DE EVIDENCIAS FOTOGRAFICAS Y CAPTURAS', 14, y);
    y += 6;

    let posX = 14;
    const thumbWidth = 40;
    const thumbHeight = 40;
    const gap = 6;

    reportesConFotos.forEach((r) => {
      const sujeto = r.nombre_cliente || r.folio || 'Evidencia';
      (r.evidencia_urls || []).forEach((imgUrl, idx) => {
        if (y + thumbHeight + 15 > 280) {
          doc.addPage();
          y = 20;
          posX = 14;
        }

        if (imgUrl.startsWith('data:image/')) {
          try {
            const format = imgUrl.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(imgUrl, format, posX, y, thumbWidth, thumbHeight);

            doc.setDrawColor(203, 213, 225);
            doc.rect(posX, y, thumbWidth, thumbHeight, 'S');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(71, 85, 105);
            doc.text(cleanForPDF(`${sujeto.substring(0, 20)} (${idx + 1})`), posX, y + thumbHeight + 4);
          } catch (e) {
            console.warn('Error adjuntando imagen al PDF:', e);
          }

          posX += thumbWidth + gap;
          if (posX + thumbWidth > pageWidth - 14) {
            posX = 14;
            y += thumbHeight + 8;
          }
        }
      });
    });
  }

  doc.save(`Repos_Reporte_Actividades_${new Date().toISOString().split('T')[0]}.pdf`);
}
