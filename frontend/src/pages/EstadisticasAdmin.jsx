import React, { useState, useEffect } from "react";
import PlantillaAdmin from "../components/PlantillaAdmin";
import api from "../services/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";
import "../style/EstadisticasAdmin.css";

export default function EstadisticasAdmin() {
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      const response = await api.get('/reportes/estadisticas/admin');
      
      if (response.data && response.data.estadisticas) {
        setEstadisticas(response.data.estadisticas);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      alert('Error al cargar las estadísticas');
    } finally {
      setCargando(false);
    }
  };

  // Mostrar loading
  if (cargando || !estadisticas) {
    return (
      <PlantillaAdmin tituloHeader="Estadísticas del Sistema">
        <div className="estadisticas-admin-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            Cargando estadísticas...
          </div>
        </div>
      </PlantillaAdmin>
    );
  }

  const { kpis, crecimientoUsuarios, volumenReportes, rankingInstituciones, distribucionCategorias } = estadisticas;
  const colores = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a770ef", "#c771ef"];

  return (
    <PlantillaAdmin tituloHeader="Estadísticas del Sistema">
      <div className="estadisticas-admin-container">

        {/* =================== KPIs GLOBALES =================== */}
        <div className="kpis-globales">
          <div className="kpi-card-admin">
            <div className="kpi-icono usuarios">
              <Users size={32} />
            </div>
            <div className="kpi-contenido">
              <h3>Usuarios Activos</h3>
              <p className="kpi-numero">{kpis.totalUsuarios.toLocaleString()}</p>
            </div>
          </div>

          <div className="kpi-card-admin">
            <div className="kpi-icono reportes">
              <FileText size={32} />
            </div>
            <div className="kpi-contenido">
              <h3>Total Reportes</h3>
              <p className="kpi-numero">{kpis.totalReportes.toLocaleString()}</p>
            </div>
          </div>

          <div className="kpi-card-admin">
            <div className="kpi-icono resueltos">
              <CheckCircle size={32} />
            </div>
            <div className="kpi-contenido">
              <h3>Tasa de Resolución</h3>
              <p className="kpi-numero">{kpis.tasaResolucion}%</p>
            </div>
          </div>

          <div className="kpi-card-admin">
            <div className="kpi-icono tiempo">
              <Clock size={32} />
            </div>
            <div className="kpi-contenido">
              <h3>Tiempo Promedio</h3>
              <p className="kpi-numero">{kpis.tiempoPromedioDias || 0} días</p>
            </div>
          </div>
        </div>

        {/* =================== GRÁFICO: CRECIMIENTO DE USUARIOS =================== */}
        <div className="grafico-seccion">
          <h2 className="titulo-grafico">Crecimiento de Usuarios</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={crecimientoUsuarios}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ciudadanos" stroke="#4A90E2" strokeWidth={3} name="Ciudadanos" />
              <Line type="monotone" dataKey="instituciones" stroke="#F5A623" strokeWidth={3} name="Instituciones" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* =================== GRÁFICO: VOLUMEN DE REPORTES =================== */}
        <div className="grafico-seccion">
          <h2 className="titulo-grafico">Volumen de Reportes por Semana</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumenReportes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reportes" fill="#7ED321" name="Reportes Creados" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* =================== DOS COLUMNAS: RANKING + DISTRIBUCIÓN =================== */}
        <div className="fila-dos-columnas">
          
          {/* RANKING DE INSTITUCIONES */}
          <div className="columna-grafico">
            <h2 className="titulo-grafico">Ranking de Instituciones</h2>
            <div className="tabla-ranking">
              <table>
                <thead>
                  <tr>
                    <th>Institución</th>
                    <th>Resueltos</th>
                    <th>Tiempo Prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingInstituciones.map((inst, idx) => (
                    <tr key={idx}>
                      <td>{inst.nombre}</td>
                      <td className="numero-destacado">{inst.resueltos}</td>
                      <td className="numero-destacado">{inst.tiempoPromedio} días</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DISTRIBUCIÓN POR CATEGORÍA */}
          <div className="columna-grafico">
            <h2 className="titulo-grafico">Distribución por Categoría</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribucionCategorias}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="valor"
                  nameKey="categoria"
                  label
                >
                  {distribucionCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </PlantillaAdmin>
  );
}
