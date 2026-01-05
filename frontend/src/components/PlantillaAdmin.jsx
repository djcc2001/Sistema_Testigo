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
        <div className="perfil perfil-admin">
          <div className="admin-badge">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="3"/>
              <path d="M40 20C33.3726 20 28 25.3726 28 32C28 38.6274 33.3726 44 40 44C46.6274 44 52 38.6274 52 32C52 25.3726 46.6274 20 40 20Z" fill="white"/>
              <path d="M40 48C28.954 48 20 52.477 20 58V62H60V58C60 52.477 51.046 48 40 48Z" fill="white"/>
            </svg>
          </div>
          <p className="titulo-bienvenida">ADMINISTRADOR</p>
          <p className="nombre-usuario">{usuario?.nombres || 'Admin'}</p>
          <span className="rol-usuario">{usuario?.correo || ''}</span>
        </div>

        {/* Menú de navegación */}
        <nav className="menu">
          <button onClick={() => navegarConCierre('/admin/dashboard')}>Usuarios</button>
          <button onClick={() => navegarConCierre('/admin/instituciones-colaboradoras')}>Instituciones</button>
          <button onClick={() => navegarConCierre('/admin/reportes-totales')}>Reportes Totales</button>
          <button onClick={() => navegarConCierre('/admin/estadisticas')}>Estadísticas</button>
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
