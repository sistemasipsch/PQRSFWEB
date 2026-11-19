import React from 'react';

export default function PublicFooter() {
  return (
    <footer className="site-footer">
      &copy; {new Date().getFullYear()} IPS Clinical House &bull; Servicio de Información y Atención al Usuario (SIAU)
    </footer>
  );
}
