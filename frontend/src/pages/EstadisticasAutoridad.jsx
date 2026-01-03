import React, { useState, useEffect, useCallback } from "react";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import {
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

import "../style/EstadisticasAutoridad.css";
import { obtenerEstadisticasAutoridad } from "../services/api";

const COLORES = [
  "#ff6b6b", "#4ecdc4", "#45aaf2", "#f7b731",
  "#a55eea", "#26de81", "#ffa502", "#2ed573"
];

export default function EstadisticasAutoridad() {
  const [datos, setDatos] = useState({
    datosCategoria: [],
    datosEstado: [],
    datosTiempo: []
  });

  const [cargando, setCargando] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const cargarEstadisticas = useCallback(async () => {
    try {
      setCargando(true);
      const response = await obtenerEstadisticasAutoridad(fechaInicio, fechaFin);
      
      if (response.data.ok) {
        setDatos(response.data.estadisticas);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  // Se agrega cargarEstadisticas al array de dependencias para quitar el Warning
  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const handleFiltrar = (e) => {
    e.preventDefault();
    cargarEstadisticas();
  };

  if (cargando) {
    return (
      <PlantillaAutoridad tituloHeader="Estadísticas">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <p>Cargando estadísticas reales...</p>
        </div>
      </PlantillaAutoridad>
    );
  }

  return (
    <PlantillaAutoridad tituloHeader="Estadísticas">
      <div className="estadisticas-container">

        {/* =================== FILTROS =================== */}
        <div className="filtros-box">
          <div>
            <label>Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div>
            <label>Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <button className="btn-filtrar" onClick={handleFiltrar}>
            Filtrar Datos
          </button>
        </div>

        {/* =================== CATEGORÍAS =================== */}
        <h2 className="titulo-seccion">Reportes por Categoría</h2>
        <div className="grafico-centro">
          {datos.datosCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={datos.datosCategoria}
                  dataKey="valor"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ nombre, valor }) => `${nombre}: ${valor}`}
                >
                  {datos.datosCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-msg">No hay reportes asignados en estas categorías.</div>
          )}
        </div>

        <div className="fila-graficos">
          {/* =================== EVOLUCIÓN POR MESES =================== */}
          <div className="tarjeta-grafico">
            <h2 className="titulo-seccion">Evolución Mensual</h2>
            {datos.datosTiempo.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={datos.datosTiempo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    name="Reportes"
                    stroke="#4b7bec" 
                    strokeWidth={3} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>Sin datos en el tiempo.</p>
            )}
          </div>

          {/* =================== ESTADOS =================== */}
          <div className="tarjeta-grafico">
            <h2 className="titulo-seccion">Distribución por Estado</h2>
            {datos.datosEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={datos.datosEstado}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {datos.datosEstado.map((_, index) => (
                      <Cell key={`cell-est-${index}`} fill={COLORES[(index + 2) % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No hay reportes con estados registrados.</p>
            )}
          </div>
        </div>
      </div>
    </PlantillaAutoridad>
  );
}