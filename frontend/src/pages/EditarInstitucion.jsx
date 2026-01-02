import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlantillaAdmin from "../components/PlantillaAdmin";
import { obtenerUsuarioPorId, actualizarUsuarioPorId } from "../services/usuariosService";
import "../style/EditarInstitucion.css";

const EditarInstitucion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombres: "",
    correo: "",
    nro_celular: "",
    contrasena: "",
    rol: "",
  });

  const [editable, setEditable] = useState({
    correo: false,
    nro_celular: false,
    contrasena: false,
  });

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Cargar datos de la institución (autoridad)
  useEffect(() => {
    const cargarInstitucion = async () => {
      try {
        const data = await obtenerUsuarioPorId(id);

        if (data.rol !== "autoridad") {
          setError("El usuario seleccionado no es una institución");
          return;
        }

        setForm({
          nombres: data.nombres,
          correo: data.correo,
          nro_celular: data.nro_celular,
          contrasena: "",
          rol: data.rol,
        });

        setPreview(data.foto || null);
      } catch (err) {
        setError("No se pudo cargar la institución");
      }
    };

    cargarInstitucion();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEditable = (campo) => {
    setEditable((prev) => ({ ...prev, [campo]: !prev[campo] }));
  };

  const manejarFoto = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setFoto(archivo);
    setPreview(URL.createObjectURL(archivo));
  };

  const manejarGuardar = async () => {
    setCargando(true);
    setError("");

    try {
      const data = new FormData();
      data.append("correo", form.correo);
      data.append("nro_celular", form.nro_celular);

      if (form.contrasena) {
        data.append("contrasena", form.contrasena);
      }

      if (foto) {
        data.append("foto", foto);
      }

      await actualizarUsuarioPorId(id, data);

      alert("Institución actualizada correctamente");
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Error al guardar los cambios");
    } finally {
      setCargando(false);
    }
  };

  return (
    <PlantillaAdmin tituloHeader="Editar Institución">
      <div className="editar-inst-container">

        {/* FOTO */}
        <div className="inst-foto-col">
          <img
            src={preview || "/institucion.png"}
            alt="institución"
            className="inst-foto"
          />
          <label className="inst-btn-subir">
            Subir Imagen
            <input type="file" accept="image/*" hidden onChange={manejarFoto} />
          </label>
        </div>

        {/* DATOS NO EDITABLES */}
        <div className="inst-bloque">
          <div className="inst-campo">
            <label>Nombre:</label>
            <input type="text" value={form.nombres} disabled />
          </div>

          <div className="inst-campo">
            <label>Rol:</label>
            <input type="text" value="Autoridad" disabled />
          </div>
        </div>

        {/* DATOS EDITABLES */}
        <div className="inst-bloque2">

          {/* CORREO */}
          <div className="inst-campo editable">
            <label>Correo de Contacto:</label>
            <div className="campo-editable">
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                readOnly={!editable.correo}
              />
              <button type="button" onClick={() => toggleEditable("correo")}>
                <img src="/Boton_modificar.png" alt="editar" />
              </button>
            </div>
          </div>

          {/* TELÉFONO */}
          <div className="inst-campo editable">
            <label>Teléfono de Contacto:</label>
            <div className="campo-editable">
              <input
                type="text"
                name="nro_celular"
                value={form.nro_celular}
                onChange={handleChange}
                readOnly={!editable.nro_celular}
                maxLength={9}
              />
              <button type="button" onClick={() => toggleEditable("nro_celular")}>
                <img src="/Boton_modificar.png" alt="editar" />
              </button>
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="inst-campo editable">
            <label>Contraseña:</label>
            <div className="campo-editable">
              <input
                type="password"
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                readOnly={!editable.contrasena}
              />
              <button type="button" onClick={() => toggleEditable("contrasena")}>
                <img src="/Boton_modificar.png" alt="editar" />
              </button>
            </div>
          </div>

        </div>

        {error && <div className="mensaje-error">{error}</div>}

        {/* BOTONES */}
        <div className="inst-botones">
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => navigate("/admin/dashboard")}
            disabled={cargando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn-guardar"
            onClick={manejarGuardar}
            disabled={cargando}
          >
            {cargando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

      </div>
    </PlantillaAdmin>
  );
};

export default EditarInstitucion;
