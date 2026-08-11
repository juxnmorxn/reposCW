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
}

export const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSelectClient,
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
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/clientes/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowDropdown(data.results && data.results.length > 0);
        }
      } catch (err) {
        console.error('Error searching clients:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (c: Cliente) => {
    onSelectClient(c);
    setQuery(c.nombre);
    onChange(c.nombre);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
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
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-brand-600 absolute right-3 top-2.5" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
          {results.map((c) => (
            <li
              key={c.id}
              onClick={() => handleSelect(c)}
              className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
            >
              <span className="text-sm font-bold text-slate-800">{c.nombre} {c.folio ? `(${c.folio})` : ''}</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-2">
                {c.ip && <span className="text-brand-600 font-semibold">{c.ip}</span>}
                {c.direccion && <span>• {c.direccion}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
