import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAutentificacion } from "../context/AutentificacionContext";
import '../style/Plantilla.css';

const LayoutPrincipal = ({ children, tituloHeader = "Dashboard" }) => {
  const navigate = useNavigate();
  const { usuario, logout } = useAutentificacion(); // Contexto de usuario y funciones de login/logout
  const [menuAbierto, setMenuAbierto] = useState(false); // Estado del menú lateral

  // Mostrar mensaje mientras se carga el usuario desde contexto
  if (!usuario) return <p>Cargando...</p>;

  // Funciones para manejar menú lateral
  const toggleMenu = () => setMenuAbierto(!menuAbierto); // Abrir/Cerrar menú
  const cerrarMenu = () => setMenuAbierto(false);        // Cerrar menú
  const navegarConCierre = (ruta) => {                   // Navegar y cerrar menú
    navigate(ruta);
    cerrarMenu();
  };

  // Función para cerrar sesión
  const manejarCerrarSesion = () => {
    logout();                 // Limpia usuario y token
    cerrarMenu();             // Cierra menú
    navigate("/login");       // Redirige a login
  };

  return (
    <div className="layout-principal">
      {/* Overlay para cerrar menú al hacer clic fuera */}
      <div 
        className={`overlay ${menuAbierto ? 'active' : ''}`}
        onClick={cerrarMenu}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'active' : ''}`}>
        <div className="perfil">
          {/* Foto del usuario */}
          <div className="foto-usuario">
            <img 
              src={usuario?.foto || "/usuario.png"} 
              alt="Foto de perfil"
              onError={(e) => {
                e.target.src = "/usuario.png";
              }}
            />
          </div>
          <p className="titulo-bienvenida">BIENVENIDO(A)</p>
          <p className="nombre-usuario">{usuario?.nombres || 'Autoridad'}</p>
          <span className="rol-usuario">{usuario?.correo || ''}</span>
        </div>

        {/* Menú de navegación */}
        <nav className="menu">
          <button onClick={() => navegarConCierre('/autoridad/home')}>Inicio</button>
          <button onClick={() => navegarConCierre('/autoridad/ReportesRecibidos')}>Reportes Recibidos</button>
          <button onClick={() => navegarConCierre('/autoridad/ReportesRevision')}>Reportes en Revision</button>
          <button onClick={() => navegarConCierre('/autoridad/ReportesArchivados')}>Reportes Archivados</button>
          <button onClick={() => navegarConCierre('/autoridad/estadisticas')}>Estadisticas</button>
          <button onClick={manejarCerrarSesion}>Cerrar Sesión</button>
        </nav>

        {/* Logo de la app */}
        <div className="logo">
          <img src="/logo.png" alt="testiGO" />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="contenido-principal">
        <div className="header">
          <div className="header-izquierdo">
            {/* Botón menú hamburguesa */}
            <button 
              className={`menu-hamburguesa ${menuAbierto ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Abrir/Cerrar menú"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          <div className="header-derecho">
            <h2>{tituloHeader}</h2> {/* Título dinámico de la página */}
          </div>
        </div>

        {/* Contenido dinámico que se renderiza dentro del layout */}
        <div className="contenido-dinamico">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutPrincipal;
