'use client';

import React, { useState, useEffect } from 'react';
import { GrupoContrasena, Contrasena, ChecklistItem } from '@/lib/types';
import { 
  Plus, Trash2, Edit2, Share2, Search, X, Check, Eye, EyeOff, Layers, 
  Key, FileText, CheckSquare, Copy, CheckCircle2, ListPlus
} from 'lucide-react';

const LOCAL_GRUPOS_KEY = 'repos_isp_local_grupos';
const LOCAL_CONTRASENAS_KEY = 'repos_isp_local_contrasenas';

export const PasswordManagement: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoContrasena[]>([]);
  const [contrasenas, setContrasenas] = useState<Contrasena[]>([]);
  const [grupoActivoId, setGrupoActivoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'contrasena' | 'nota'>('todos');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Modal state
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [editGrupo, setEditGrupo] = useState<GrupoContrasena | null>(null);
  const [grupoNombre, setGrupoNombre] = useState('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalTipoRegistro, setModalTipoRegistro] = useState<'contrasena' | 'nota'>('contrasena');
  const [editContrasena, setEditContrasena] = useState<Contrasena | null>(null);

  // Form states for password
  const [formTitulo, setFormTitulo] = useState('');
  const [formUsuario, setFormUsuario] = useState('');
  const [formContrasena, setFormContrasena] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  // Form states for note
  const [formTipoNota, setFormTipoNota] = useState<'abierta' | 'lista'>('abierta');
  const [formContenidoNota, setFormContenidoNota] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [nuevoItemTexto, setNuevoItemTexto] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Local Storage Helpers
  const getLocalGrupos = (): GrupoContrasena[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_GRUPOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalGrupos = (data: GrupoContrasena[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_GRUPOS_KEY, JSON.stringify(data));
  };

  const getLocalContrasenas = (): Contrasena[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_CONTRASENAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalContrasenas = (data: Contrasena[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_CONTRASENAS_KEY, JSON.stringify(data));
  };

  // On Load
  useEffect(() => {
    // 1. Cargar desde LocalStorage para acceso offline instantáneo
    const localG = getLocalGrupos();
    if (localG.length > 0) {
      setGrupos(localG);
      setGrupoActivoId(localG[0].id || null);
    }
    const localC = getLocalContrasenas();
    if (localC.length > 0) {
      setContrasenas(localC);
    }

    // 2. Sincronizar con servidor
    loadGrupos();
  }, []);

  useEffect(() => {
    if (grupoActivoId) {
      loadContrasenas(grupoActivoId);
    } else {
      setContrasenas([]);
    }
    setSelectedIds(new Set());
  }, [grupoActivoId]);

  const loadGrupos = async () => {
    try {
      const res = await fetch('/api/grupos-contrasenas');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setGrupos(json.data);
          saveLocalGrupos(json.data);
          if (json.data.length > 0 && !grupoActivoId) {
            setGrupoActivoId(json.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Modo offline: usando grupos de localStorage', error);
    }
  };

  const loadContrasenas = async (grupo_id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contrasenas?grupo_id=${grupo_id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setContrasenas(json.data);
          // Actualizar caché de este grupo en localStorage
          const localAll = getLocalContrasenas();
          const otherGroups = localAll.filter((c) => c.grupo_id !== grupo_id);
          const updatedAll = [...otherGroups, ...json.data];
          saveLocalContrasenas(updatedAll);
        }
      }
    } catch (error) {
      console.error('Modo offline: usando contraseñas de localStorage', error);
      const localAll = getLocalContrasenas();
      setContrasenas(localAll.filter((c) => c.grupo_id === grupo_id));
    } finally {
      setLoading(false);
    }
  };

  // Guardar Grupo
  const handleSaveGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoNombre.trim()) return;

    const nombre = grupoNombre.trim();
    if (editGrupo && editGrupo.id) {
      // Editar
      const updatedList = grupos.map((g) => (g.id === editGrupo.id ? { ...g, nombre } : g));
      setGrupos(updatedList);
      saveLocalGrupos(updatedList);
      try {
        await fetch('/api/grupos-contrasenas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editGrupo.id, nombre }),
        });
      } catch (err) {
        console.error('Error offline al guardar grupo:', err);
      }
    } else {
      // Crear
      const newId = Date.now();
      const newGrupo: GrupoContrasena = { id: newId, nombre, fecha_creacion: new Date().toISOString().split('T')[0] };
      const updatedList = [...grupos, newGrupo];
      setGrupos(updatedList);
      saveLocalGrupos(updatedList);
      setGrupoActivoId(newId);

      try {
        const res = await fetch('/api/grupos-contrasenas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre }),
        });
        if (res.ok) {
          await loadGrupos();
        }
      } catch (err) {
        console.error('Error offline al crear grupo:', err);
      }
    }

    setIsGrupoModalOpen(false);
    setGrupoNombre('');
    setEditGrupo(null);
  };

  const handleDeleteGrupo = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este grupo y todos sus elementos?')) return;
    const updatedGrupos = grupos.filter((g) => g.id !== id);
    setGrupos(updatedGrupos);
    saveLocalGrupos(updatedGrupos);

    const localAll = getLocalContrasenas().filter((c) => c.grupo_id !== id);
    saveLocalContrasenas(localAll);

    if (grupoActivoId === id) {
      setGrupoActivoId(updatedGrupos.length > 0 ? (updatedGrupos[0].id as number) : null);
    }

    try {
      await fetch(`/api/grupos-contrasenas?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error offline al eliminar grupo:', err);
    }
  };

  // Abrir Modal de Creación
  const openCreateModal = (tipo: 'contrasena' | 'nota') => {
    if (!grupoActivoId) return;
    setModalTipoRegistro(tipo);
    setEditContrasena(null);
    setFormTitulo('');
    setFormUsuario('admin');
    setFormContrasena('');
    setFormDescripcion('');
    setFormTipoNota('abierta');
    setFormContenidoNota('');
    setChecklistItems([]);
    setNuevoItemTexto('');
    setIsItemModalOpen(true);
  };

  // Abrir Modal de Edición
  const openEditModal = (item: Contrasena) => {
    setModalTipoRegistro(item.tipo_registro || 'contrasena');
    setEditContrasena(item);
    setFormTitulo(item.titulo);
    setFormUsuario(item.usuario || '');
    setFormContrasena(item.contrasena || '');
    setFormDescripcion(item.descripcion || '');
    setFormTipoNota(item.tipo_nota || 'abierta');
    setFormContenidoNota(item.tipo_nota === 'abierta' ? item.contenido || '' : '');
    
    if (item.tipo_nota === 'lista' && item.contenido) {
      try {
        setChecklistItems(JSON.parse(item.contenido));
      } catch {
        setChecklistItems([]);
      }
    } else {
      setChecklistItems([]);
    }
    setNuevoItemTexto('');
    setIsItemModalOpen(true);
  };

  // Añadir ítem a la lista checklist
  const handleAddChecklistItem = () => {
    if (!nuevoItemTexto.trim()) return;
    const item: ChecklistItem = {
      id: String(Date.now()),
      texto: nuevoItemTexto.trim(),
      completado: false,
    };
    setChecklistItems([...checklistItems, item]);
    setNuevoItemTexto('');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setChecklistItems(
      checklistItems.map((it) => (it.id === itemId ? { ...it, completado: !it.completado } : it))
    );
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    setChecklistItems(checklistItems.filter((it) => it.id !== itemId));
  };

  // Toggle rápido de checklist directamente desde la tarjeta
  const handleToggleCardChecklist = async (item: Contrasena, checklistId: string) => {
    if (!item.id || item.tipo_nota !== 'lista' || !item.contenido) return;
    try {
      const list: ChecklistItem[] = JSON.parse(item.contenido);
      const updatedList = list.map((c) => (c.id === checklistId ? { ...c, completado: !c.completado } : c));
      const updatedContenido = JSON.stringify(updatedList);

      // Actualizar estado local inmediatamente
      const updatedContrasenas = contrasenas.map((c) =>
        c.id === item.id ? { ...c, contenido: updatedContenido } : c
      );
      setContrasenas(updatedContrasenas);

      // Actualizar localStorage
      const localAll = getLocalContrasenas().map((c) =>
        c.id === item.id ? { ...c, contenido: updatedContenido } : c
      );
      saveLocalContrasenas(localAll);

      // Enviar a la API
      await fetch('/api/contrasenas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, contenido: updatedContenido }),
      });
    } catch (err) {
      console.error('Error actualizando checklist:', err);
    }
  };

  // Guardar Contraseña o Nota
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoActivoId || !formTitulo.trim()) return;

    const contenidoFinal =
      modalTipoRegistro === 'nota'
        ? formTipoNota === 'lista'
          ? JSON.stringify(checklistItems)
          : formContenidoNota
        : undefined;

    const payload: Partial<Contrasena> = {
      grupo_id: grupoActivoId,
      tipo_registro: modalTipoRegistro,
      titulo: formTitulo.trim(),
      usuario: modalTipoRegistro === 'contrasena' ? formUsuario.trim() : undefined,
      contrasena: modalTipoRegistro === 'contrasena' ? formContrasena.trim() : undefined,
      tipo_nota: modalTipoRegistro === 'nota' ? formTipoNota : undefined,
      contenido: contenidoFinal,
      descripcion: formDescripcion.trim() || undefined,
    };

    if (editContrasena && editContrasena.id) {
      // Editar
      const id = editContrasena.id;
      const updated = contrasenas.map((c) => (c.id === id ? { ...c, ...payload } : c));
      setContrasenas(updated);

      const localAll = getLocalContrasenas().map((c) => (c.id === id ? { ...c, ...payload } : c));
      saveLocalContrasenas(localAll);

      try {
        await fetch('/api/contrasenas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...payload }),
        });
      } catch (err) {
        console.error('Error offline al actualizar contraseña/nota:', err);
      }
    } else {
      // Crear
      const tempId = Date.now();
      const newItem: Contrasena = {
        id: tempId,
        grupo_id: grupoActivoId,
        tipo_registro: modalTipoRegistro,
        titulo: formTitulo.trim(),
        usuario: modalTipoRegistro === 'contrasena' ? formUsuario.trim() : undefined,
        contrasena: modalTipoRegistro === 'contrasena' ? formContrasena.trim() : undefined,
        tipo_nota: modalTipoRegistro === 'nota' ? formTipoNota : undefined,
        contenido: contenidoFinal,
        descripcion: formDescripcion.trim() || undefined,
        fecha_creacion: new Date().toISOString().split('T')[0],
      };

      const updated = [newItem, ...contrasenas];
      setContrasenas(updated);

      const localAll = [newItem, ...getLocalContrasenas()];
      saveLocalContrasenas(localAll);

      try {
        const res = await fetch('/api/contrasenas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await loadContrasenas(grupoActivoId);
        }
      } catch (err) {
        console.error('Error offline al crear contraseña/nota:', err);
      }
    }

    setIsItemModalOpen(false);
  };

  // Eliminar Contraseña / Nota
  const handleDeleteItem = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    const updated = contrasenas.filter((c) => c.id !== id);
    setContrasenas(updated);

    const localAll = getLocalContrasenas().filter((c) => c.id !== id);
    saveLocalContrasenas(localAll);

    try {
      await fetch(`/api/contrasenas?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error offline al eliminar:', err);
    }
  };

  // Copiar al portapapeles
  const handleCopyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compartir en WhatsApp
  const shareSelected = () => {
    if (selectedIds.size === 0) return;

    const selected = contrasenas.filter((c) => c.id && selectedIds.has(c.id));
    let message = `🔑 *Información Compartida desde Repos ISP*\n\n`;

    selected.forEach((c) => {
      message += `📌 *${c.titulo}*\n`;
      if (c.tipo_registro === 'contrasena') {
        if (c.usuario) message += `👤 Usuario: ${c.usuario}\n`;
        if (c.contrasena) message += `🔑 Contraseña: ${c.contrasena}\n`;
      } else if (c.tipo_registro === 'nota') {
        if (c.tipo_nota === 'abierta') {
          message += `📝 Nota:\n${c.contenido || ''}\n`;
        } else if (c.tipo_nota === 'lista' && c.contenido) {
          try {
            const list: ChecklistItem[] = JSON.parse(c.contenido);
            message += `☑️ Lista de verificación:\n`;
            list.forEach((item) => {
              message += `${item.completado ? '✅' : '🔲'} ${item.texto}\n`;
            });
          } catch {}
        }
      }
      if (c.descripcion) message += `ℹ️ Nota: ${c.descripcion}\n`;
      message += `\n`;
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filtrado de elementos
  const filteredItems = contrasenas.filter((item) => {
    if (filtroTipo === 'contrasena' && item.tipo_registro !== 'contrasena') return false;
    if (filtroTipo === 'nota' && item.tipo_registro !== 'nota') return false;
    
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      item.titulo.toLowerCase().includes(q) ||
      (item.usuario && item.usuario.toLowerCase().includes(q)) ||
      (item.contrasena && item.contrasena.toLowerCase().includes(q)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(q)) ||
      (item.contenido && item.contenido.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-brand-600" />
            Gestión de Contraseñas y Notas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Guarda credenciales, notas abiertas y listas de verificación con acceso offline garantizado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={shareSelected}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Compartir ({selectedIds.size})
            </button>
          )}

          <button
            onClick={() => {
              setEditGrupo(null);
              setGrupoNombre('');
              setIsGrupoModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Grupo
          </button>

          {grupoActivoId && (
            <>
              <button
                onClick={() => openCreateModal('contrasena')}
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all active:scale-95"
              >
                <Key className="w-4 h-4" />
                + Crear Contraseña
              </button>

              <button
                onClick={() => openCreateModal('nota')}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4" />
                + Crear Nota
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* BARRA LATERAL DE GRUPOS */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Grupos
          </h3>
          <div className="space-y-1.5">
            {grupos.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-xs italic px-2">No hay grupos creados.</p>
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
                  <span
                    className={`font-bold text-xs sm:text-sm ${
                      grupoActivoId === grupo.id ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
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

        {/* ÁREA PRINCIPAL: LISTADO DE CONTRASEÑAS Y NOTAS */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          {grupoActivoId ? (
            <>
              {/* TOOLBAR Y FILTROS */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, usuario, IP o nota..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setFiltroTipo('todos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      filtroTipo === 'todos'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Todas ({contrasenas.length})
                  </button>
                  <button
                    onClick={() => setFiltroTipo('contrasena')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      filtroTipo === 'contrasena'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Key className="w-3 h-3" /> Contraseñas
                  </button>
                  <button
                    onClick={() => setFiltroTipo('nota')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      filtroTipo === 'nota'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Notas
                  </button>
                </div>
              </div>

              {/* LISTADO DE TARJETAS / FILAS */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {loading ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                    {busqueda ? 'No se encontraron resultados con ese criterio.' : 'No hay registros en este grupo.'}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.id as number);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-300 dark:border-brand-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const newSet = new Set(selectedIds);
                                if (newSet.has(item.id as number)) newSet.delete(item.id as number);
                                else newSet.add(item.id as number);
                                setSelectedIds(newSet);
                              }}
                              className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                {item.tipo_registro === 'nota' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {item.tipo_nota === 'lista' ? <CheckSquare className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    {item.tipo_nota === 'lista' ? 'Lista Checklist' : 'Nota Abierta'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                                    <Key className="w-3 h-3" /> Contraseña
                                  </span>
                                )}

                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                  {item.titulo}
                                </h4>
                              </div>

                              {/* VERSIÓN CONTRASEÑA */}
                              {item.tipo_registro === 'contrasena' && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {item.usuario && (
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                      👤 {item.usuario}
                                    </span>
                                  )}

                                  {/* MOSTRAR CONTRASEÑA DIRECTAMENTE (SIN OCULTAR POR DEFECTO) */}
                                  {item.contrasena && (
                                    <div className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-xs font-bold px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                                      🔑 <span>{item.contrasena}</span>
                                      <button
                                        onClick={() => handleCopyText(item.contrasena || '', item.id as number)}
                                        className="ml-1 p-0.5 text-slate-400 hover:text-white transition-colors"
                                        title="Copiar Contraseña"
                                      >
                                        {copiedId === item.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* VERSIÓN NOTA ABIERTA */}
                              {item.tipo_registro === 'nota' && item.tipo_nota === 'abierta' && item.contenido && (
                                <div className="mt-2 p-3 bg-amber-500/5 dark:bg-amber-950/20 rounded-xl border border-amber-500/10 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                                  {item.contenido}
                                </div>
                              )}

                              {/* VERSIÓN NOTA LISTA / CHECKLIST */}
                              {item.tipo_registro === 'nota' && item.tipo_nota === 'lista' && item.contenido && (
                                <div className="mt-2 space-y-1.5">
                                  {(() => {
                                    try {
                                      const list: ChecklistItem[] = JSON.parse(item.contenido);
                                      return list.map((check) => (
                                        <div
                                          key={check.id}
                                          onClick={() => handleToggleCardChecklist(item, check.id)}
                                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                                            check.completado
                                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 line-through'
                                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={check.completado}
                                            onChange={() => {}} // Handled by div onClick
                                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                          />
                                          <span>{check.texto}</span>
                                        </div>
                                      ));
                                    } catch {
                                      return <p className="text-xs text-slate-400">Error parseando lista.</p>;
                                    }
                                  })()}
                                </div>
                              )}

                              {item.descripcion && (
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                                  📝 {item.descripcion}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-brand-600 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id as number)}
                              className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ningún grupo seleccionado</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-xs sm:text-sm">
                Selecciona un grupo en la barra lateral o crea uno nuevo para comenzar a gestionar contraseñas y notas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITAR/NUEVO GRUPO */}
      {isGrupoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsGrupoModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h3>
              <button
                onClick={() => setIsGrupoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrupo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Grupo
                </label>
                <input
                  type="text"
                  required
                  value={grupoNombre}
                  onChange={(e) => setGrupoNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. Servidores MikroTik, Antenas Ubiquiti, Notas de Campo"
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
                  Guardar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR ITEM (CONTRASEÑA O NOTA) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsItemModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {modalTipoRegistro === 'contrasena' ? (
                  <Key className="w-6 h-6 text-brand-600" />
                ) : (
                  <FileText className="w-6 h-6 text-amber-500" />
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editContrasena
                    ? `Editar ${modalTipoRegistro === 'contrasena' ? 'Contraseña' : 'Nota'}`
                    : `Crear Nueva ${modalTipoRegistro === 'contrasena' ? 'Contraseña' : 'Nota'}`}
                </h3>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* TÍTULO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título o Dispositivo *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder={
                    modalTipoRegistro === 'contrasena'
                      ? 'Ej. Router OLT Principal / Antena Juan'
                      : 'Ej. Procedimiento de Fusión de Fibra'
                  }
                />
              </div>

              {/* CAMPOS DE CONTRASEÑA */}
              {modalTipoRegistro === 'contrasena' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      required
                      value={formUsuario}
                      onChange={(e) => setFormUsuario(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      placeholder="admin / root"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="text"
                      required
                      value={formContrasena}
                      onChange={(e) => setFormContrasena(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      placeholder="Pass1234!"
                    />
                  </div>
                </div>
              )}

              {/* CAMPOS DE NOTA */}
              {modalTipoRegistro === 'nota' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Nota
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormTipoNota('abierta')}
                        className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          formTipoNota === 'abierta'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> Nota Abierta (Texto)
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormTipoNota('lista')}
                        className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          formTipoNota === 'lista'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Lista (Checklist)
                      </button>
                    </div>
                  </div>

                  {/* SUB-FORMA NOTA ABIERTA */}
                  {formTipoNota === 'abierta' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contenido de la Nota Libre
                      </label>
                      <textarea
                        rows={5}
                        required
                        value={formContenidoNota}
                        onChange={(e) => setFormContenidoNota(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-sans"
                        placeholder="Escribe el texto libre de la nota, configuraciones, listas de comandos, etc."
                      />
                    </div>
                  )}

                  {/* SUB-FORMA NOTA CHECKLIST */}
                  {formTipoNota === 'lista' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ítems de la Lista de Verificación
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nuevoItemTexto}
                          onChange={(e) => setNuevoItemTexto(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistItem();
                            }
                          }}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                          placeholder="Añadir elemento..."
                        />
                        <button
                          type="button"
                          onClick={handleAddChecklistItem}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/50">
                        {checklistItems.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-2">
                            Agrega ítems a tu lista arriba.
                          </p>
                        ) : (
                          checklistItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700"
                            >
                              <div
                                onClick={() => handleToggleChecklistItem(item.id)}
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.completado}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    item.completado
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {item.texto}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveChecklistItem(item.id)}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NOTA ADICIONAL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nota / Descripción Adicional (Opcional)
                </label>
                <input
                  type="text"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej. IP: 192.168.1.100 / Ubicación en torre"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-md"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
