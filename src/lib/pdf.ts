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
    orientation: 'landscape', // Better for tables with many columns
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // 1. ENCABEZADO CORPORATIVO "REPOS"
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REPOS - INFORME DE ACTIVIDADES', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporte de Actividades`, 14, 18);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 18, { align: 'right' });

  y = 32;

  // 2. RESUMEN EJECUTIVO (KPIS) sin emojis
  const total = reportes.length;
  const completados = reportes.filter((r) => r.estado === 'Completado' || r.estado === 'Resuelto').length;
  const pendientes = reportes.filter((r) => r.estado === 'Pendiente' || r.estado === 'En Proceso').length;
  const noCompletados = reportes.filter((r) => r.estado === 'No Completado' || r.estado === 'Rechazado').length;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 22, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 22, 3, 3, 'S');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMEN GENERAL DE REGISTROS', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const colWidth = (pageWidth - 36) / 4;
  doc.text(`Total Registros: ${total}`, 18, y + 14);
  doc.text(`Completados: ${completados}`, 18 + colWidth, y + 14);
  doc.text(`Pendientes: ${pendientes}`, 18 + colWidth * 2, y + 14);
  doc.text(`No Completados: ${noCompletados}`, 18 + colWidth * 3, y + 14);

  y += 30;

  // 3. TABLA PRINCIPAL DE REPORTES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('TABLA DETALLADA DE REPORTES', 14, y);
  y += 4;

  const tableData = reportes.map((r) => {
    const tipo = r.tipo_actividad.toUpperCase();
    
    let folioStr = r.folio ? `Folio: ${r.folio}` : '';
    let clienteStr = r.nombre_cliente ? `${r.nombre_cliente}\nTel: ${r.telefono_cliente || '-'}` : '-';
    
    let diagnosticoStr = '-';
    let solucionStr = '-';

    if (r.tipo_actividad === 'soporte') {
      diagnosticoStr = `RX: ${r.equipo_de_rx || '-'}\nAbonados: ${r.abonados_con_senal_degradada || '-'}\nParam Actuales: ${r.parametros_actuales || '-'}`;
      solucionStr = `Accion: ${r.accion_realizada || '-'}\nParam Mejorados: ${r.parametros_mejorados || '-'}`;
    } else {
      solucionStr = r.descripcion_actividad || '-';
    }

    return [
      cleanForPDF(r.fecha_creacion),
      cleanForPDF(`${folioStr}\\n[${tipo}]`),
      cleanForPDF(clienteStr),
      cleanForPDF(diagnosticoStr),
      cleanForPDF(solucionStr),
      cleanForPDF(r.estado),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Folio / Tipo', 'Cliente / Ubicacion', 'Diagnostico Inicial', 'Accion / Solucion', 'Estado']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 60 },
      4: { cellWidth: 85 },
      5: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const estado = data.cell.raw as string;
        if (estado === 'Completado' || estado === 'Resuelto') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (estado === 'Pendiente' || estado === 'En Proceso') {
          data.cell.styles.textColor = [245, 158, 11];
        } else if (estado === 'No Completado' || estado === 'Rechazado') {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 12;

  // 4. ANEXO DE EVIDENCIAS FOTOGRÁFICAS (IMÁGENES EN MINIATURA CUADRADAS)
  const reportesConFotos = reportes.filter((r) => r.evidencia_urls && r.evidencia_urls.length > 0);

  if (reportesConFotos.length > 0) {
    if (y > 170) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('ANEXO DE EVIDENCIAS FOTOGRAFICAS Y CAPTURAS', 14, y);
    y += 6;

    let posX = 14;
    const thumbWidth = 45;
    const thumbHeight = 45;
    const gap = 12;

    reportesConFotos.forEach((r) => {
      const sujeto = r.nombre_cliente || r.folio || 'Evidencia';
      (r.evidencia_urls || []).forEach((imgUrl, idx) => {
        if (y + thumbHeight + 15 > 200) {
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
            y += thumbHeight + 12;
          }
        }
      });
    });
  }

  doc.save(`Repos_Reporte_Actividades_${new Date().toISOString().split('T')[0]}.pdf`);
}
