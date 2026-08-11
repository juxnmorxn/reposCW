import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Reporte } from './types';

export function generateWeeklyReportPDF(
  reportes: Reporte[],
  semana: number,
  año: number,
  nombreIngeniero: string = 'Ingeniero de Soporte Técnico'
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
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REPOS - INFORME DE ACTIVIDADES', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporte de Actividades | Ingeniero: ${nombreIngeniero}`, 14, 18);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 18, { align: 'right' });

  y = 32;

  // 2. RESUMEN EJECUTIVO (KPIS)
  const total = reportes.length;
  const resueltos = reportes.filter((r) => r.estado === 'Resuelto').length;
  const pendientes = reportes.filter((r) => r.estado === 'Pendiente' || r.estado === 'En Proceso').length;
  const rechazados = reportes.filter((r) => r.estado === 'Rechazado').length;

  doc.setFillColor(248, 250, 252); // Slate 50
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
  doc.text(`✅ Resueltos: ${resueltos}`, 18 + colWidth, y + 14);
  doc.text(`⏳ Pendientes: ${pendientes}`, 18 + colWidth * 2, y + 14);
  doc.text(`🚫 Rechazados: ${rechazados}`, 18 + colWidth * 3, y + 14);

  y += 30;

  // 3. TABLA PRINCIPAL DE REPORTES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('TABLA DETALLADA DE REPORTES', 14, y);
  y += 4;

  const tableData = reportes.map((r) => {
    const tipoStr = r.tipo_actividad.toUpperCase();
    const sujeto = r.cliente || r.equipo || r.cliente_seguimiento || 'General';
    const detalle = r.problema || r.configuracion_realizada || r.motivo_seguimiento || r.descripcion_actividad || '-';
    const solucion = r.accion_realizada || r.resultado_pruebas || r.resultado_seguimiento || '-';

    return [
      r.fecha_creacion,
      tipoStr,
      sujeto,
      detalle,
      solucion,
      r.estado,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Tipo', 'Cliente / Equipo', 'Problema / Solicitud', 'Acción / Resultado', 'Estado']],
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
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 45 },
      4: { cellWidth: 42 },
      5: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const estado = data.cell.raw as string;
        if (estado === 'Resuelto') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'Pendiente' || estado === 'En Proceso') {
          data.cell.styles.textColor = [245, 158, 11];
        } else if (estado === 'Rechazado') {
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
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('ANEXO DE EVIDENCIAS FOTOGRÁFICAS Y CAPTURAS', 14, y);
    y += 6;

    let posX = 14;
    const thumbWidth = 45; // 45mm x 45mm cuadrícula limpia
    const thumbHeight = 45;
    const gap = 12;

    reportesConFotos.forEach((r) => {
      const sujeto = r.cliente || r.equipo || 'Evidencia';
      (r.evidencia_urls || []).forEach((imgUrl, idx) => {
        if (y + thumbHeight + 15 > 280) {
          doc.addPage();
          y = 20;
          posX = 14;
        }

        // Si la imagen es una base64 data URL
        if (imgUrl.startsWith('data:image/')) {
          try {
            const format = imgUrl.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(imgUrl, format, posX, y, thumbWidth, thumbHeight);

            // Marco del recuadro
            doc.setDrawColor(203, 213, 225);
            doc.rect(posX, y, thumbWidth, thumbHeight, 'S');

            // Etiqueta del anexo
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(71, 85, 105);
            doc.text(`${sujeto.substring(0, 20)} (${idx + 1})`, posX, y + thumbHeight + 4);
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

    if (posX !== 14) {
      y += thumbHeight + 12;
    }
  }

  // 5. PIE DE FIRMA
  if (y > 250) {
    doc.addPage();
    y = 30;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth / 2 - 40, y + 15, pageWidth / 2 + 40, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(nombreIngeniero, pageWidth / 2, y + 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Departamento de Soporte Técnico y Mantenimiento - Repos', pageWidth / 2, y + 24, { align: 'center' });

  doc.save(`Repos_Reporte_Actividades_${new Date().toISOString().split('T')[0]}.pdf`);
}
