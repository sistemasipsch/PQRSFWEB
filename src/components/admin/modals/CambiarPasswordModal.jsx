import React, { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Field, { Alert } from '../common/Field';
import Icon from '../common/Icon';
import PasswordField from '../common/PasswordField';
import { api } from '../../../services/api';

const MIN = 8;

/** Nivel orientativo de la contraseña (longitud y variedad de caracteres). */
const fortaleza = (p) => {
  if (!p) return null;
  let puntos = 0;
  if (p.length >= MIN) puntos++;
  if (p.length >= 12) puntos++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) puntos++;
  if (/\d/.test(p)) puntos++;
  if (/[^A-Za-z0-9]/.test(p)) puntos++;
  if (puntos <= 2) return { nivel: 'debil', texto: 'Débil' };
  if (puntos <= 3) return { nivel: 'media', texto: 'Aceptable' };
  return { nivel: 'fuerte', texto: 'Fuerte' };
};

/** Asigna una nueva contraseña a un usuario desde el módulo de Usuarios. */
export default function CambiarPasswordModal({ usuario, accesoToken, onClose, onCambiada, onAccesoExpirado }) {
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const nivel = useMemo(() => fortaleza(nueva), [nueva]);

  const guardar = async (e) => {
    e.preventDefault();
    const errs = {};
    if (nueva.length < MIN) errs.nueva = `Mínimo ${MIN} caracteres.`;
    if (nueva !== confirmar) errs.confirmar = 'Las contraseñas no coinciden.';
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setGuardando(true);
    setError('');
    try {
      await api.cambiarPasswordUsuario(usuario.id, nueva, accesoToken);
      onCambiada(usuario);
    } catch (err) {
      if (err.motivo === 'ACCESO_REQUERIDO') onAccesoExpirado(err);
      else setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Cambiar contraseña" subtitle={`${usuario.nombre} · ${usuario.correo}`} onClose={onClose} width={480}>
      <form onSubmit={guardar} noValidate autoComplete="off">
        <div className="tail-modal-body tail-form-grid">
          {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}

          <Field label="Nueva contraseña" required error={errores.nueva} hint={`Mínimo ${MIN} caracteres`}>
            <PasswordField
              name="nueva-clave-usuario"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="Escribe la nueva contraseña"
              autoFocus
            />
          </Field>

          {nivel && (
            <div className={`tail-strength ${nivel.nivel}`}>
              <span className="tail-strength-bar"><span /></span>
              <span>{nivel.texto}</span>
            </div>
          )}

          <Field label="Confirmar contraseña" required error={errores.confirmar}>
            <PasswordField
              name="confirmar-clave-usuario"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </Field>

          <p className="tail-field-hint">
            Comunique la nueva contraseña al funcionario por un medio seguro. Podrá cambiarla luego desde «Mi perfil».
          </p>
        </div>
        <div className="tail-modal-footer">
          <button type="button" onClick={onClose} className="tail-btn-secondary">Cancelar</button>
          <button type="submit" disabled={guardando} className="tail-btn-primary">
            <Icon name="lock" size={16} /> {guardando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
