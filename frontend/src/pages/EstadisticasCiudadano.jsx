import React, { useState, useEffect } from "react";
import LayoutPrincipal from "../components/PlantillaCiudadano";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid, ResponsiveContainer
} from "recharts";
import "../style/EstadisticasCiudadano.css";
import { obtenerEstadisticasCiudadano } from "../services/api";

// Colores para los gráficos
const colores = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a770ef", "#4b7bec", "#e74c3c", "#2ecc71"];

export default function EstadisticasCiudadano() {
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    kpis: {
      totalReportes: 0,
      reportesResueltos: 0,
      porcentajeResueltos: 0,
      tiempoPromedioDias: 0
    },
    distribucionCategoria: [],
    tendenciaTiempo: [],
    distribucionEstado: []
  });

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setCargando(true);
        const response = await obtenerEstadisticasCiudadano();
        if (response.data.ok && response.data.estadisticas) {
          setEstadisticas(response.data.estadisticas);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        // Mantener valores por defecto en caso de error
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, []);

  // Extraer datos para facilitar el uso
  const { kpis, distribucionCategoria, tendenciaTiempo, distribucionEstado } = estadisticas;
  const totalReportes = kpis.totalReportes || 0;
  const porcentajeResueltos = kpis.porcentajeResueltos || 0;
  const promedioDiasResolucion = kpis.tiempoPromedioDias || 0;

  // Formatear datos de categoría para el gráfico
  const datosCategoria = distribucionCategoria.map(item => ({
    categoria: item.categoria,
    cantidad: item.cantidad
  }));

  // Formatear datos de tendencia
  const datosTiempo = tendenciaTiempo.length > 0 
    ? tendenciaTiempo 
    : [{ mes: "Sin datos", reportes: 0 }];

  // Formatear datos de estado
  const datosEstado = distribucionEstado.map(item => ({
    nombre: item.nombre || "Sin nombre",
    valor: Number(item.valor) || 0
  })).filter(item => item.valor > 0); // Filtrar estados con valor 0

  if (cargando) {
    return (
      <LayoutPrincipal tituloHeader="Estadísticas">
        <div className="panel-estadisticas">
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </LayoutPrincipal>
    );
  }

  return (
    <LayoutPrincipal tituloHeader="Estadísticas">
      <div className="panel-estadisticas">
        {/* KPIs */}
        <div className="panel-kpis">
          <div className="kpi-card">
            <h3>Total Reportes</h3>
            <p className="kpi-valor">{totalReportes}</p>
          </div>
          <div className="kpi-card">
            <h3>% Resueltos</h3>
            <p className="kpi-valor">{porcentajeResueltos}%</p>
          </div>
          <div className="kpi-card">
            <h3>Tiempo Promedio de Resolución</h3>
            <p className="kpi-valor">{promedioDiasResolucion} días</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="graficos-grid">
          {/* Gráfico de categorías */}
          <div className="grafico-card">
            <h3>Reportes por Categoría</h3>
            {datosCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosCategoria}>
                  <XAxis 
                    dataKey="categoria" 
                    tick={{ fontSize: 10 }} 
                    interval={0} 
                    angle={-20} 
                    textAnchor="end" 
                    height={70} 
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#4b7bec" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p>No hay datos de categorías disponibles</p>
              </div>
            )}
          </div>

          {/* Gráfico de tendencia */}
          <div className="grafico-card">
            <h3>Tendencia de Reportes en el Tiempo</h3>
            {datosTiempo.length > 0 && datosTiempo[0].reportes !== undefined ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datosTiempo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reportes" stroke="#00C49F" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p>No hay datos de tendencia disponibles</p>
              </div>
            )}
          </div>

          {/* Gráfico de estado */}
          <div className="grafico-card">
            <h3>Distribución por Estado</h3>
            {datosEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosEstado}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                    nameKey="nombre"
                    label={({ valor, percent }) => `${valor} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {datosEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p>No hay datos de estados disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  );
}
