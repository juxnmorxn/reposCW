'use client';

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Cliente } from '@/lib/types';

interface CSVUploaderProps {
  onUploadSuccess?: () => void;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const clientesParseados: Cliente[] = [];
          
          results.data.forEach((row: any) => {
            if (!row['Nombre'] || !row['Ip']) return; // Ignorar filas sin nombre o IP
            
            const routerText = row['Router'] || '';
            const es_antena = !routerText.toLowerCase().includes('olt');
            
            // Extraer posible folio del servicio si aplica.
            // A veces el servicio viene como "0949- Nombre"
            let folio = '';
            if (row['Servicio'] && typeof row['Servicio'] === 'string') {
              const match = row['Servicio'].match(/^(\d+)-/);
              if (match) {
                folio = match[1];
              }
            }

            clientesParseados.push({
              folio,
              nombre: row['Nombre'],
              ip: row['Ip'],
              router: routerText,
              direccion: row['Dirección'] || '',
              plan_internet: row['Plan Internet'] || '',
              es_antena,
              activo: es_antena, // Deshabilitar si es fibra
            });
          });

          if (clientesParseados.length === 0) {
            throw new Error('No se encontraron clientes válidos en el archivo CSV. Verifica las cabeceras.');
          }

          // Enviar al servidor
          const res = await fetch('/api/clientes/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientesParseados),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al importar');

          setMessage({
            type: 'success',
            text: `Importación exitosa: ${data.insertados} nuevos, ${data.actualizados} actualizados.`
          });
          if (onUploadSuccess) onUploadSuccess();
        } catch (error: any) {
          setMessage({
            type: 'error',
            text: error.message || 'Error al procesar el archivo CSV'
          });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        setIsUploading(false);
        setMessage({ type: 'error', text: 'Error leyendo CSV: ' + error.message });
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
      />
      
      <label
        htmlFor="csv-upload"
        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          isUploading 
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 pointer-events-none'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
        }`}
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span>Importar Clientes CSV</span>
      </label>

      {message && (
        <span className={`text-xs font-semibold flex items-center gap-1 animate-in fade-in ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </span>
      )}
    </div>
  );
};
