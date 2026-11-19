import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RecuperarSolicitarForm from './RecuperarSolicitarForm';
import RecuperarConfirmarForm from './RecuperarConfirmarForm';
import '../../styles/login.css';

const TITULOS = {
  login: 'Gestor de peticiones',
  solicitar: 'Recuperar contraseña',
  confirmar: 'Recuperar contraseña'
};

/** Pantalla de acceso al panel SIAU (inicio de sesión y recuperación de contraseña). */
export default function AdminLoginPage({ onLoginSuccess, aviso = '' }) {
  const [modo, setModo] = useState('login');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState(aviso);
  const [exito, setExito] = useState('');

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError('');
    setExito('');
  };

  const mostrarError = (msg) => {
    setError(msg);
    if (msg) setExito('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/assets/logo-clinical-house.png" alt="IPS Clinical House" className="login-logo" />
        <h1 className="login-title">{TITULOS[modo]}</h1>

        {error && <div className="login-alert error" role="alert">{error}</div>}
        {exito && <div className="login-alert success" role="status">{exito}</div>}

        {modo === 'login' && (
          <LoginForm
            key={correo}
            correoInicial={correo}
            onLogin={onLoginSuccess}
            onOlvido={() => cambiarModo('solicitar')}
            onError={mostrarError}
            onInfo={(msg) => { setError(''); setExito(msg); }}
          />
        )}

        {modo === 'solicitar' && (
          <RecuperarSolicitarForm
            correoInicial={correo}
            onEnviado={(c, msg) => { setCorreo(c); cambiarModo('confirmar'); setExito(msg); }}
            onVolver={() => cambiarModo('login')}
            onError={mostrarError}
          />
        )}

        {modo === 'confirmar' && (
          <RecuperarConfirmarForm
            correo={correo}
            onRestablecido={(msg) => { cambiarModo('login'); setExito(msg); }}
            onVolver={() => cambiarModo('login')}
            onError={mostrarError}
          />
        )}

        <div className="login-footer">
          <a href="/">&larr; Ir al formulario público de PQRSF</a>
        </div>
      </div>
    </div>
  );
}
