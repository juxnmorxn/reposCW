'use client';

import React, { useState, useEffect } from 'react';
import { GrupoContrasena, Contrasena } from '@/lib/types';
import { Plus, Trash2, Edit2, Share2, Search, X, Check, Eye, EyeOff, Layers } from 'lucide-react';

export const PasswordManagement: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoContrasena[]>([]);
  const [contrasenas, setContrasenas] = useState<Contrasena[]>([]);
  const [grupoActivoId, setGrupoActivoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Modals state
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [editGrupo, setEditGrupo] = useState<GrupoContrasena | null>(null);
  
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [editPass, setEditPass] = useState<Contrasena | null>(null);

  // Forms state
  const [grupoNombre, setGrupoNombre] = useState('');
  
  const [passForm, setPassForm] = useState<Partial<Contrasena>>({
    titulo: '',
    usuario: '',
    contrasena: '',
    descripcion: ''
  });
  
  // Selection
  const [selectedPassIds, setSelectedPassIds] = useState<Set<number>>(new Set());
  
  // Visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (grupoActivoId) {
      loadContrasenas(grupoActivoId);
    } else {
      setContrasenas([]);
    }
    setSelectedPassIds(new Set());
    setVisiblePasswords(new Set());
  }, [grupoActivoId]);

  const loadGrupos = async () => {
    try {
      const res = await fetch('/api/grupos-contrasenas');
      const json = await res.json();
      if (json.success) {
        setGrupos(json.data);
        if (json.data.length > 0 && !grupoActivoId) {
          setGrupoActivoId(json.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading grupos', error);
    }
  };

  const loadContrasenas = async (grupo_id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contrasenas?grupo_id=${grupo_id}`);
      const json = await res.json();
      if (json.success) {
        setContrasenas(json.data);
      }
    } catch (error) {
      console.error('Error loading contraseñas', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editGrupo ? 'PUT' : 'POST';
      const body = editGrupo ? { id: editGrupo.id, nombre: grupoNombre } : { nombre: grupoNombre };
      const res = await fetch('/api/grupos-contrasenas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsGrupoModalOpen(false);
        setGrupoNombre('');
        setEditGrupo(null);
        await loadGrupos();
      }
    } catch (error) {
      console.error('Error saving grupo', error);
    }
  };

  const handleDeleteGrupo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este grupo y TODAS sus contraseñas?')) return;
    try {
      const res = await fetch(`/api/grupos-contrasenas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (grupoActivoId === id) setGrupoActivoId(null);
        await loadGrupos();
      }
    } catch (error) {
      console.error('Error deleting grupo', error);
    }
  };

  const handleSavePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoActivoId) return;
    
    try {
      const method = editPass ? 'PUT' : 'POST';
      const body = editPass 
        ? { ...passForm, id: editPass.id }
        : { ...passForm, grupo_id: grupoActivoId };
        
      const res = await fetch('/api/contrasenas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsPassModalOpen(false);
        setPassForm({ titulo: '', usuario: '', contrasena: '', descripcion: '' });
        setEditPass(null);
        await loadContrasenas(grupoActivoId);
      }
    } catch (error) {
      console.error('Error saving password', error);
    }
  };

  const handleDeletePass = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta contraseña?')) return;
    try {
      const res = await fetch(`/api/contrasenas?id=${id}`, { method: 'DELETE' });
      if (res.ok && grupoActivoId) {
        await loadContrasenas(grupoActivoId);
      }
    } catch (error) {
      console.error('Error deleting pass', error);
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedPassIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPassIds(newSet);
  };

  const handleToggleSelectAll = () => {
    if (selectedPassIds.size === filteredContrasenas.length) {
      setSelectedPassIds(new Set());
    } else {
      setSelectedPassIds(new Set(filteredContrasenas.map(c => c.id as number)));
    }
  };

  const handleToggleVisibility = (id: number) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisiblePasswords(newSet);
  };

  const shareSelected = () => {
    if (selectedPassIds.size === 0) return;
    
    const selected = contrasenas.filter(c => c.id && selectedPassIds.has(c.id));
    let message = `🔐 *Contraseñas compartidas*\n\n`;
    
    selected.forEach(c => {
      message += `*${c.titulo}*\n`;
      message += `👤 Usuario: ${c.usuario}\n`;
      message += `🔑 Contraseña: ${c.contrasena}\n`;
      if (c.descripcion) message += `📝 Nota: ${c.descripcion}\n`;
      message += `\n`;
    });
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredContrasenas = contrasenas.filter(c => 
    c.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.usuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-600" />
            Gestión de Contraseñas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organiza y comparte credenciales de forma segura.</p>
        </div>
        
        <div className="flex gap-2">
          {selectedPassIds.size > 0 && (
            <button
              onClick={shareSelected}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Compartir ({selectedPassIds.size})
            </button>
          )}
          
          <button
            onClick={() => {
              setEditGrupo(null);
              setGrupoNombre('');
              setIsGrupoModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Grupo
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Grupos */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">
            Grupos
          </h3>
          <div className="space-y-1.5">
            {grupos.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm italic px-2">No hay grupos creados.</p>
            ) : (
              grupos.map((grupo) => (
                <div
                  key={grupo.id}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    grupoActivoId === grupo.id
                      ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-500/30 border'
                      : 'bg-white border-transparent hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/50 border'
                  }`}
                  onClick={() => setGrupoActivoId(grupo.id as number)}
                >
                  <span className={`font-semibold ${
                    grupoActivoId === grupo.id ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {grupo.nombre}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditGrupo(grupo);
                        setGrupoNombre(grupo.nombre);
                        setIsGrupoModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGrupo(grupo.id as number);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área Principal - Tabla de Contraseñas */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          {grupoActivoId ? (
            <>
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar credencial..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                
                <button
                  onClick={() => {
                    setEditPass(null);
                    setPassForm({ titulo: '', usuario: '', contrasena: '', descripcion: '' });
                    setIsPassModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Contraseña
                </button>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedPassIds.size > 0 && selectedPassIds.size === filteredContrasenas.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Título</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuario</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contraseña</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nota</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </td>
                      </tr>
                    ) : filteredContrasenas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          {busqueda ? 'No se encontraron resultados.' : 'No hay contraseñas en este grupo.'}
                        </td>
                      </tr>
                    ) : (
                      filteredContrasenas.map((pass) => (
                        <tr 
                          key={pass.id} 
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${selectedPassIds.has(pass.id as number) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                          onClick={() => handleToggleSelect(pass.id as number)}
                        >
                          <td className="px-4 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedPassIds.has(pass.id as number)}
                              onChange={() => {}} // Handled by tr onClick
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">
                            {pass.titulo}
                          </td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                            {pass.usuario}
                          </td>
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-sm text-slate-800 dark:text-slate-200">
                                {visiblePasswords.has(pass.id as number) ? pass.contrasena : '••••••••'}
                              </span>
                              <button 
                                onClick={() => handleToggleVisibility(pass.id as number)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1"
                              >
                                {visiblePasswords.has(pass.id as number) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                            {pass.descripcion || '-'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditPass(pass);
                                  setPassForm(pass);
                                  setIsPassModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-brand-600 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePass(pass.id as number)}
                                className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ningún grupo seleccionado</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Selecciona un grupo en la barra lateral o crea uno nuevo para comenzar a gestionar contraseñas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Grupo */}
      {isGrupoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsGrupoModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h3>
              <button onClick={() => setIsGrupoModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveGrupo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  value={grupoNombre}
                  onChange={(e) => setGrupoNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. Antenas Ubiquiti"
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGrupoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Contraseña */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsPassModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editPass ? 'Editar Contraseña' : 'Nueva Contraseña'}
              </h3>
              <button onClick={() => setIsPassModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePass} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Título / Dispositivo</label>
                <input
                  type="text"
                  required
                  value={passForm.titulo || ''}
                  onChange={(e) => setPassForm({...passForm, titulo: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. Antena Cliente Juan"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Usuario</label>
                  <input
                    type="text"
                    required
                    value={passForm.usuario || ''}
                    onChange={(e) => setPassForm({...passForm, usuario: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                  <input
                    type="text"
                    required
                    value={passForm.contrasena || ''}
                    onChange={(e) => setPassForm({...passForm, contrasena: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nota (Opcional)</label>
                <input
                  type="text"
                  value={passForm.descripcion || ''}
                  onChange={(e) => setPassForm({...passForm, descripcion: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. IP: 192.168.1.100"
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
