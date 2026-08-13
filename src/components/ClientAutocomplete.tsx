'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Cliente } from '@/lib/types';

interface ClientAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectClient: (cliente: Cliente) => void;
  displayFormat?: 'name' | 'ip';
  inputClassName?: string;
  autoSelectExactIp?: boolean;
}

export const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSelectClient,
  displayFormat = 'name',
  inputClassName = 'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500',
  autoSelectExactIp = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/clientes/search?q=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          const list: Cliente[] = data.results || [];
          setResults(list);
          setShowDropdown(list.length > 0);

          // Si autoSelectExactIp está activo y se escribió una IP exacta completa (ej. 172.17.8.63)
          if (autoSelectExactIp && clean.length >= 7) {
            const exactMatch = list.find(
              (c) => c.ip && c.ip.trim().toLowerCase() === clean.toLowerCase()
            );
            if (exactMatch) {
              onSelectClient(exactMatch);
              setShowDropdown(false);
            }
          }
        }
      } catch (err) {
        console.error('Error searching clients:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [query, autoSelectExactIp]);

  const handleSelect = (c: Cliente) => {
    onSelectClient(c);
    const displayVal = displayFormat === 'ip' ? (c.ip || query) : `${c.nombre} ${c.direccion ? `- ${c.direccion}` : ''}`.trim();
    setQuery(displayVal);
    onChange(displayVal);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            if (e.target.value.trim().length >= 2) setShowDropdown(true);
          }}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          className={inputClassName}
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-brand-600 absolute right-3 top-2.5" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-44 sm:max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((c) => (
            <li
              key={c.id}
              onClick={() => handleSelect(c)}
              className="px-3.5 py-2.5 hover:bg-brand-50/60 dark:hover:bg-slate-800 cursor-pointer flex flex-col transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  {c.nombre} {c.folio ? `(${c.folio})` : ''}
                </span>
                {c.ip && (
                  <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800 shrink-0">
                    IP: {c.ip}
                  </span>
                )}
              </div>
              {(c.direccion || c.telefono) && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {c.telefono && <span>📞 {c.telefono} </span>}
                  {c.direccion && <span>• 📍 {c.direccion}</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
