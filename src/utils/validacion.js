// Validaciones reutilizables

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validarEmail = (email) => Boolean(email) && EMAIL_RE.test(email.trim());

export const soloDigitos = (valor = '') => valor.replace(/\D/g, '');

/** Bloquea teclas no numéricas en campos de teléfono. */
export const bloquearNoNumericos = (e) => {
  const permitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
  if (permitidas.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
};
