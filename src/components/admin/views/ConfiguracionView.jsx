import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import Field, { Alert, EmptyRow } from '../common/Field';
import ConfirmarModal from '../modals/ConfirmarModal';
import { api } from '../../../services/api';
import { NIVELES_RIESGO, aplicarConfigSla, textoPlazo } from '../../../constants/pqrsf';
import { esSuperAdmin, puede } from '../../../utils/permisos';
import { formatearFechaHora } from '../../../utils/format';

/**
 * Configuración del sistema.
 * - Tiempos de respuesta: con el permiso CONFIGURAR_TIEMPOS.
 * - Áreas, cargos y permisos: solo Super Administrador.
 */
export default function ConfiguracionView({ user, onNotificar, onSlaCambiado }) {
  const superAdmin = esSuperAdmin(user);
  const tabs = [
    puede(user, 'CONFIGURAR_TIEMPOS') && { id: 'tiempos', label: 'Tiempos de respuesta', icon: 'clock' },
    superAdmin && { id: 'areas', label: 'Áreas', icon: 'globe' },
    superAdmin && { id: 'cargos', label: 'Cargos', icon: 'user' },
    superAdmin && { id: 'permisos', label: 'Permisos', icon: 'shield' }
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]?.id);

  if (!tabs.length) {
    return <div className="tail-chart-card tail-chart-empty">Su rol no tiene opciones de configuración disponibles.</div>;
  }

  return (
    <div className="tail-config">
      <div className="tail-config-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'tiempos' && <TiemposTab onNotificar={onNotificar} onSlaCambiado={onSlaCambiado} />}
      {tab === 'areas' && (
        <CatalogoTab
          titulo="Áreas / servicios"
          descripcion="Áreas de la IPS a las que se asocian los funcionarios y las solicitudes."
          singular="área"
          listar={api.listarAreas}
          guardar={api.guardarArea}
          eliminar={api.eliminarArea}
          onNotificar={onNotificar}
        />
      )}
      {tab === 'cargos' && (
        <CatalogoTab
          titulo="Cargos"
          descripcion="Cargos disponibles al crear o editar usuarios y en «Mi perfil»."
          singular="cargo"
          listar={api.listarCargos}
          guardar={api.guardarCargo}
          eliminar={api.eliminarCargo}
          onNotificar={onNotificar}
        />
      )}
      {tab === 'permisos' && <PermisosTab onNotificar={onNotificar} />}
    </div>
  );
}

// ============================================================================
// TIEMPOS DE RESPUESTA
// ============================================================================
function TiemposTab({ onNotificar, onSlaCambiado }) {
  const [config, setConfig] = useState(null);
  const [plazos, setPlazos] = useState({});
  const [umbral, setUmbral] = useState(50);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const c = await api.obtenerConfigSla();
      setConfig(c);
      setPlazos(Object.fromEntries((c.niveles || []).map((n) => [n.nivel, n.plazoHoras])));
      setUmbral(c.umbralAlertaPorcentaje || 50);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambios = config && (
    (config.niveles || []).some((n) => Number(plazos[n.nivel]) !== n.plazoHoras) || Number(umbral) !== config.umbralAlertaPorcentaje
  );

  const guardar = async () => {
    const invalido = Object.entries(plazos).find(([, h]) => !(Number(h) >= 1 && Number(h) <= 2160));
    if (invalido) return setError(`El plazo de ${NIVELES_RIESGO[invalido[0]]?.label.toLowerCase()} debe estar entre 1 y 2160 horas.`);
    if (!(umbral >= 10 && umbral <= 95)) return setError('El umbral de alerta debe estar entre 10% y 95%.');
    setGuardando(true);
    setError('');
    try {
      const c = await api.guardarConfigSla(Object.fromEntries(Object.entries(plazos).map(([k, v]) => [k, Number(v)])), Number(umbral));
      setConfig(c);
      aplicarConfigSla(c);
      onSlaCambiado?.(c);
      onNotificar('exito', 'Tiempos de respuesta actualizados. El semáforo de todas las solicitudes abiertas se recalcula con los nuevos plazos.');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () => {
    setPlazos(Object.fromEntries((config?.niveles || []).map((n) => [n.nivel, n.plazoPredeterminadoHoras])));
    setUmbral(50);
  };

  if (!config) {
    return <section className="tail-chart-card">{error ? <Alert tipo="error">{error}</Alert> : <div className="tail-chart-empty">Cargando…</div>}</section>;
  }

  return (
    <section className="tail-chart-card">
      <div className="tail-chart-header">
        <div className="tail-chart-header-left">
          <h3>Tiempos de respuesta (SLA)</h3>
          <p>Plazo máximo para responder según el nivel de riesgo del tipo de solicitud. Aplica a todas las solicitudes abiertas.</p>
        </div>
      </div>

      {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="tail-sla-config-grid">
        {(config.niveles || []).map((n) => {
          const info = NIVELES_RIESGO[n.nivel];
          const horas = Number(plazos[n.nivel]) || 0;
          return (
            <div key={n.nivel} className={`tail-sla-config-card ${n.nivel.toLowerCase()}`}>
              <div className="tail-sla-config-head">
                <span className={`tail-riesgo-dot ${n.nivel.toLowerCase()}`} />
                <strong>{n.etiqueta}</strong>
              </div>
              <p className="tail-cell-sub">{info?.tipos}</p>
              <Field label="Plazo en horas" hint={horas > 0 ? `= ${textoPlazo(horas)} · alerta a las ${Math.round((horas * umbral) / 100)} h` : ' '}>
                <input
                  type="number"
                  min={1}
                  max={2160}
                  value={plazos[n.nivel] ?? ''}
                  onChange={(e) => setPlazos({ ...plazos, [n.nivel]: e.target.value })}
                />
              </Field>
              {horas !== n.plazoPredeterminadoHoras && (
                <span className="tail-cell-sub">Predeterminado: {n.plazoPredeterminadoHoras} h</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="tail-sla-umbral">
        <Field label={`Alerta «por vencer» (amarillo) cuando se ha consumido el ${umbral}% del plazo`}>
          <input type="range" min={10} max={95} step={5} value={umbral} onChange={(e) => setUmbral(Number(e.target.value))} />
        </Field>
      </div>

      <div className="tail-config-actions">
        <span className="tail-cell-sub">
          {config.actualizadoEl ? <>Última modificación: {formatearFechaHora(config.actualizadoEl)} por {config.actualizadoPor}</> : 'Usando los valores predeterminados.'}
        </span>
        <div className="tail-header-actions-group">
          <button type="button" className="tail-btn-ghost" onClick={restablecer}>Restablecer predeterminados</button>
          <button type="button" className="tail-btn-primary" onClick={guardar} disabled={!cambios || guardando}>
            {guardando ? 'Guardando…' : 'Guardar tiempos'}
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CATÁLOGO GENÉRICO (ÁREAS / CARGOS)
// ============================================================================
function CatalogoTab({ titulo, descripcion, singular, listar, guardar, eliminar, onNotificar }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null); // {} nuevo | item
  const [borrar, setBorrar] = useState(null);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setItems((await listar()) || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [listar]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return q ? items.filter((i) => `${i.nombre} ${i.descripcion || ''}`.toLowerCase().includes(q)) : items;
  }, [items, filtro]);

  const alternarActivo = async (item) => {
    try {
      await guardar({ ...item, activo: !item.activo });
      onNotificar('exito', `${item.nombre} ${item.activo ? 'desactivado(a)' : 'activado(a)'}.`);
      cargar();
    } catch (e) {
      onNotificar('error', e.message);
    }
  };

  const confirmarBorrado = async () => {
    const item = borrar;
    setBorrar(null);
    try {
      await eliminar(item.id);
      onNotificar('exito', `${item.nombre} eliminado(a).`);
      cargar();
    } catch (e) {
      onNotificar('error', e.message);
    }
  };

  return (
    <div className="tail-table-card">
      <div className="tail-table-toolbar">
        <div>
          <div className="tail-card-title">{titulo}</div>
          <div className="tail-card-sub">{descripcion}</div>
        </div>
        <div className="tail-header-actions-group">
          <div className="tail-inline-search">
            <Icon name="search" size={16} />
            <input type="text" placeholder={`Buscar ${singular}…`} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
          <button type="button" className="tail-btn-primary" onClick={() => setEditando({})}>
            <Icon name="plus" size={16} /> {singular === 'área' ? 'Nueva área' : `Nuevo ${singular}`}
          </button>
        </div>
      </div>

      <div className="tail-table-wrapper">
        <table className="tail-modern-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className={cargando ? 'tail-loading-fade' : ''}>
            {error ? (
              <EmptyRow colSpan={4}><span className="tail-text-danger">{error}</span></EmptyRow>
            ) : !visibles.length ? (
              <EmptyRow colSpan={4}>{cargando ? 'Cargando…' : `No hay ${titulo.toLowerCase()} registrados.`}</EmptyRow>
            ) : (
              visibles.map((i) => (
                <tr key={i.id}>
                  <td className="tail-cell-strong">{i.nombre}</td>
                  <td className="tail-cell-muted">{i.descripcion || '—'}</td>
                  <td><span className={`tail-status-pill ${i.activo ? 'solucionado' : 'inactivo'}`}>{i.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="tail-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="tail-icon-action-btn" title="Editar" onClick={() => setEditando(i)}>
                        <Icon name="edit" size={15} />
                      </button>
                      <button type="button" className="tail-btn-secondary sm" onClick={() => alternarActivo(i)}>
                        {i.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button type="button" className="tail-icon-action-btn danger" title="Eliminar" onClick={() => setBorrar(i)}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <CatalogoItemModal
          item={editando}
          singular={singular}
          onClose={() => setEditando(null)}
          onGuardar={async (datos) => {
            await guardar(datos);
            setEditando(null);
            onNotificar('exito', `${datos.nombre} guardado(a).`);
            cargar();
          }}
        />
      )}

      {borrar && (
        <ConfirmarModal
          titulo={`Eliminar ${singular}`}
          confirmar="Eliminar"
          peligro
          onCancelar={() => setBorrar(null)}
          onConfirmar={confirmarBorrado}
        >
          ¿Eliminar <strong>{borrar.nombre}</strong>? Si está en uso no se podrá eliminar; en ese caso desactívelo para que no aparezca en las listas.
        </ConfirmarModal>
      )}
    </div>
  );
}

function CatalogoItemModal({ item, singular, onClose, onGuardar }) {
  const [nombre, setNombre] = useState(item.nombre || '');
  const [descripcion, setDescripcion] = useState(item.descripcion || '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (nombre.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres.');
    setGuardando(true);
    setError('');
    try {
      await onGuardar({ ...item, nombre: nombre.trim(), descripcion: descripcion.trim(), activo: item.id ? item.activo : true });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Modal title={item.id ? `Editar ${singular}` : singular === 'área' ? 'Nueva área' : `Nuevo ${singular}`} onClose={onClose} width={480}>
      <form onSubmit={enviar} noValidate>
        <div className="tail-modal-body tail-form-grid">
          {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}
          <Field label="Nombre" required hint={item.id ? 'Si lo renombra, se actualiza en los usuarios y solicitudes que lo tienen.' : undefined}>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} autoFocus />
          </Field>
          <Field label="Descripción">
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={255} placeholder="Opcional" />
          </Field>
        </div>
        <div className="tail-modal-footer">
          <button type="button" className="tail-btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tail-btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// PERMISOS POR CARGO
// ============================================================================
function PermisosTab({ onNotificar }) {
  const [matriz, setMatriz] = useState(null);
  const [sel, setSel] = useState(null); // nombre del cargo seleccionado
  const [edicion, setEdicion] = useState(new Set());
  const [filtro, setFiltro] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const aplicar = useCallback((m, cargoSel) => {
    setMatriz(m);
    const actual = m.cargos.find((c) => c.cargo === cargoSel) || m.cargos[0] || null;
    setSel(actual?.cargo || null);
    setEdicion(new Set(actual?.permisos || []));
  }, []);

  const cargar = useCallback(async () => {
    try {
      aplicar(await api.obtenerPermisos(), null);
    } catch (e) {
      setError(e.message);
    }
  }, [aplicar]);

  useEffect(() => { cargar(); }, [cargar]);

  const grupos = useMemo(
    () => (matriz?.permisos || []).reduce((acc, p) => ({ ...acc, [p.grupo]: [...(acc[p.grupo] || []), p] }), {}),
    [matriz]
  );

  if (!matriz) {
    return <section className="tail-chart-card">{error ? <Alert tipo="error">{error}</Alert> : <div className="tail-chart-empty">Cargando…</div>}</section>;
  }

  const total = matriz.permisos.length;
  const cargo = matriz.cargos.find((c) => c.cargo === sel);
  const original = new Set(cargo?.permisos || []);
  const cambiado = !!cargo && (original.size !== edicion.size || [...edicion].some((c) => !original.has(c)));
  const visibles = matriz.cargos.filter((c) => c.cargo.toLowerCase().includes(filtro.trim().toLowerCase()));

  const seleccionar = (c) => {
    if (c.cargo === sel) return;
    if (cambiado && !window.confirm(`Hay cambios sin guardar en «${sel}». ¿Descartarlos?`)) return;
    setSel(c.cargo);
    setEdicion(new Set(c.permisos));
  };

  const alternar = (codigo) => {
    const s = new Set(edicion);
    if (s.has(codigo)) s.delete(codigo); else s.add(codigo);
    setEdicion(s);
  };

  const alternarGrupo = (lista, marcar) => {
    const s = new Set(edicion);
    lista.forEach((p) => (marcar ? s.add(p.codigo) : s.delete(p.codigo)));
    setEdicion(s);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      aplicar(await api.guardarPermisos(sel, [...edicion]), sel);
      onNotificar('exito', `Permisos del cargo «${sel}» guardados. Se aplican cuando esos usuarios recarguen el panel.`);
    } catch (e) {
      onNotificar('error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="tail-table-card">
      <div className="tail-table-toolbar">
        <div>
          <div className="tail-card-title">Permisos de funcionalidades por cargo</div>
          <div className="tail-card-sub">
            Cada usuario recibe los permisos de su cargo. El Super Administrador siempre tiene todos;
            Usuarios, Áreas, Cargos y Permisos son exclusivos de él. Los cargos se crean en la pestaña Cargos.
          </div>
        </div>
      </div>

      {!matriz.cargos.length ? (
        <div className="tail-chart-empty">No hay cargos. Créelos en la pestaña Cargos.</div>
      ) : (
        <div className="tail-perm-layout">
          <aside className="tail-perm-cargos">
            <input
              type="search"
              className="tail-perm-buscar"
              placeholder={`Buscar entre ${matriz.cargos.length} cargos…`}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <ul>
              {visibles.map((c) => {
                const n = c.cargo === sel ? edicion.size : c.permisos.length;
                return (
                  <li key={c.cargo}>
                    <button type="button" className={`tail-perm-cargo ${c.cargo === sel ? 'active' : ''}`} onClick={() => seleccionar(c)}>
                      <span className="tail-perm-cargo-nombre">
                        {c.cargo}
                        {!c.activo && <span className="tail-perm-tag">Inactivo</span>}
                      </span>
                      <span className="tail-perm-cargo-meta">
                        {c.usuarios.length} usuario{c.usuarios.length === 1 ? '' : 's'} · {n}/{total} permisos
                      </span>
                      <span className="tail-perm-bar"><span style={{ width: `${(n / total) * 100}%` }} /></span>
                    </button>
                  </li>
                );
              })}
              {!visibles.length && <li className="tail-cell-muted tail-perm-vacio">Sin coincidencias</li>}
            </ul>
          </aside>

          {cargo && (
            <section className="tail-perm-detalle">
              <header className="tail-perm-detalle-head">
                <div>
                  <h4>{cargo.cargo}</h4>
                  <div className="tail-cell-sub">
                    {cargo.usuarios.length
                      ? cargo.usuarios.map((u) => `${u.nombre}${u.rol === 'SUPER_ADMIN' ? ' (Super admin: tiene todo)' : ''}`).join(' · ')
                      : 'Ningún usuario tiene este cargo todavía.'}
                  </div>
                </div>
                <div className="tail-perm-acciones-rapidas">
                  <button type="button" className="tail-btn-secondary sm" onClick={() => setEdicion(new Set(matriz.permisos.map((p) => p.codigo)))}>Marcar todo</button>
                  <button type="button" className="tail-btn-secondary sm" onClick={() => setEdicion(new Set())}>Quitar todo</button>
                </div>
              </header>

              <div className="tail-perm-grupos">
                {Object.entries(grupos).map(([grupo, lista]) => {
                  const todos = lista.every((p) => edicion.has(p.codigo));
                  return (
                    <fieldset key={grupo} className="tail-perm-grupo">
                      <legend>
                        {grupo}
                        <button type="button" className="tail-link-btn" onClick={() => alternarGrupo(lista, !todos)}>
                          {todos ? 'Quitar grupo' : 'Marcar grupo'}
                        </button>
                      </legend>
                      {lista.map((p) => (
                        <label key={p.codigo} className={`tail-perm-item ${edicion.has(p.codigo) ? 'on' : ''}`}>
                          <input type="checkbox" checked={edicion.has(p.codigo)} onChange={() => alternar(p.codigo)} />
                          <span>{p.descripcion}</span>
                        </label>
                      ))}
                    </fieldset>
                  );
                })}
              </div>

              <footer className="tail-perm-footer">
                <span className="tail-cell-muted">{cambiado ? 'Hay cambios sin guardar.' : 'Sin cambios.'}</span>
                <div className="tail-header-actions-group">
                  <button type="button" className="tail-btn-secondary sm" disabled={!cambiado || guardando} onClick={() => setEdicion(new Set(cargo.permisos))}>
                    Descartar
                  </button>
                  <button type="button" className="tail-btn-primary sm" disabled={!cambiado || guardando} onClick={guardar}>
                    <Icon name="check" size={14} /> {guardando ? 'Guardando…' : 'Guardar permisos'}
                  </button>
                </div>
              </footer>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
