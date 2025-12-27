import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getInstituciones } from "../services/usuariosService";
import PlantillaAdmin from "../components/PlantillaAdmin";
import "../style/InstitucionesColaboradoras.css";

const ListarInstituciones = () => {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");

  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstituciones = async () => {
      try {
        const data = await getInstituciones();
        setInstituciones(data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la lista de instituciones");
      } finally {
        setLoading(false);
      }
    };

    fetchInstituciones();
  }, []);

  // Filtrado por nombre o correo
  const institucionesFiltradas = instituciones.filter((i) =>
    (i.nombres || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.correo || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <PlantillaAdmin tituloHeader="Instituciones">
      <div className="contenido-interno">
        {/* Barra de búsqueda y botón */}
        <div className="acciones-barra">
          <input
            type="text"
            placeholder="Buscar institución..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador"
          />
          <button
            className="crear-btn"
            onClick={() => navigate("/admin/crear-institucion")}
          >
            Crear nueva institución
          </button>
        </div>

        {/* Tabla de instituciones */}
        <table className="instituciones-table">
          <thead>
            <tr>
              <th>Nombre de la Institución</th>
              <th>Reportes Recibidos</th>
              <th>Correo de Contacto</th>
              <th>Editar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {institucionesFiltradas.map((inst, index) => (
              <tr
                key={inst.id ?? index}
                className={index % 2 === 0 ? "fila-verde" : "fila-blanca"}
              >
                <td>{inst.nombres}</td>
                <td>{inst.reportes_recibidos}</td>
                <td>{inst.correo}</td>
                <td>
                  <span
                    className="editar-link"
                    onClick={() =>
                      navigate(`/admin/instituciones/${inst.id}/editar`)
                    }
                  >
                    Ver...
                  </span>
                </td>
                <td>
                  <span className="eliminar">❌</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlantillaAdmin>
  );
};

export default ListarInstituciones;
