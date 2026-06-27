'use client';

import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface SerializedPool {
  id: string;
  departure_time: string; 
  destination_id: string;
  status: string;
  current_passengers: number;
  max_capacity: number;
  driver_name: string;
  vehicle_plate: string;
}

export default function ExportHistoryButton({ pools }: { pools: SerializedPool[] }) {
  
  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial Global');

    // 1. Definir columnas y su ancho
    worksheet.columns = [
      { header: 'ID Viaje', key: 'id', width: 30 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Hora', key: 'hora', width: 10 },
      { header: 'Destino', key: 'destino', width: 35 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Conductor', key: 'conductor', width: 25 },
      { header: 'Patente', key: 'patente', width: 15 },
      { header: 'Pasajeros Actuales', key: 'pasajeros', width: 20 },
      { header: 'Capacidad Máxima', key: 'capacidad', width: 20 },
    ];

    // 2. Estilos para los encabezados (Fila 1)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Letra blanca
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0A192F' } // Azul oscuro
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 3. Agregar los datos
    pools.forEach((pool) => {
      const dateObj = new Date(pool.departure_time);
      const dateStr = dateObj.toLocaleDateString("es-AR", {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      const timeStr = dateObj.toLocaleTimeString("es-AR", {
        hour: '2-digit', minute: '2-digit'
      });
      
      const destination = pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase();

      worksheet.addRow({
        id: pool.id,
        fecha: dateStr,
        hora: timeStr,
        destino: destination,
        estado: pool.status,
        conductor: pool.driver_name,
        patente: pool.vehicle_plate,
        pasajeros: pool.current_passengers,
        capacidad: pool.max_capacity
      });
    });

    // 4. Centrar todo el contenido de las celdas agregadas
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    // 5. Generar archivo y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'historial_viajes.xlsx');
  };

  return (
    <button 
      onClick={handleExport}
      className="text-xs font-bold text-[#0A192F] bg-white border border-[#D8DADC] hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer w-fit"
    >
      <span className="material-symbols-outlined text-sm font-bold">download</span>
      Descargar tabla Excel (Historial de viajes)
    </button>
  );
}
