import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import LayoutPrincipal from "../components/PlantillaCiudadano";
import '../style/CiudadanoHome.css';

const CiudadanoHome = () => {
  const navigate = useNavigate();
  const [aceptado, setAceptado] = useState(false); // Controla si el usuario aceptó los términos

  // Alterna el estado del checkbox
  const manejarCheckbox = () => {
    setAceptado(!aceptado);
  };

  // Navega a la página de nuevo reporte si el usuario aceptó los términos
  const manejarSiguiente = () => {
    if (aceptado) {
      navigate('/ciudadano/Nuevo-reporte');
    }
  };

  // Cancela la acción y vuelve al dashboard
  const manejarCancelar = () => {
    navigate('/dashboard');
  };

  return (
    <LayoutPrincipal tituloHeader="Nuevo Reporte">
      <div className="terminos-legales">
        <h3>TÉRMINOS LEGALES</h3>

        {/* Contenedor de Términos y Condiciones */}
        <div className="terminos-contenedor">
          <div className="terminos-texto">

            <h4>1. Introducción</h4>
            <p>
              Bienvenido a TestiGO, una plataforma digital destinada a la recepción y
              gestión de denuncias ciudadanas relacionadas con problemas urbanos.
              Al acceder, registrarse y utilizar la plataforma, el usuario acepta de
              manera expresa los presentes Términos y Condiciones.
            </p>

            <h4>2. Marco Legal Aplicable</h4>
            <p>
              El uso de la plataforma se rige por la normativa vigente en la República
              del Perú, incluyendo, entre otras, la Ley N.º 27444 – Ley del Procedimiento
              Administrativo General, la Ley N.º 29733 – Ley de Protección de Datos
              Personales y las disposiciones aplicables del Código Penal Peruano.
            </p>

            <h4>3. Información Personal y Protección de Datos</h4>
            <p>
              De conformidad con la Ley N.º 29733, los datos personales proporcionados
              por el usuario serán tratados únicamente para la gestión de su cuenta,
              el registro y seguimiento de denuncias, y fines estadísticos internos.
            </p>
            <p>
              El usuario tiene derecho a acceder, rectificar, actualizar y cancelar sus
              datos personales conforme a la legislación vigente. TestiGO adopta las
              medidas técnicas y organizativas necesarias para garantizar la seguridad
              de la información.
            </p>

            <h4>4. Uso Adecuado de la Plataforma</h4>
            <p>
              El usuario se compromete a utilizar TestiGO de manera responsable,
              respetando el ordenamiento jurídico y la finalidad del sistema. Queda
              estrictamente prohibido el uso de la plataforma para fines ilícitos,
              fraudulentos o que puedan afectar el normal funcionamiento del servicio
              o la imagen de la plataforma.
            </p>

            <h4>5. Principio de Buena Fe y Veracidad de la Información</h4>
            <p>
              De acuerdo con el principio de buena fe establecido en la Ley N.º 27444,
              el usuario declara que toda la información proporcionada en las denuncias
              es veraz, completa y corresponde a hechos reales ocurridos en el lugar y
              momento indicados.
            </p>

            <h4>6. Denuncias Falsas o Malintencionadas</h4>
            <p>
              El uso de la plataforma para generar denuncias falsas, malintencionadas,
              con información manipulada o con la intención de perjudicar a terceros
              está expresamente prohibido.
            </p>
            <p>
              En caso de detectarse denuncias falsas de manera reiterada, TestiGO se
              reserva el derecho de anular los reportes correspondientes, suspender
              temporal o permanentemente la cuenta del usuario y registrar dichas
              acciones para fines de control interno.
            </p>
            <p>
              TestiGO no actúa como entidad sancionadora ni penal, sin embargo, podrá
              colaborar con las autoridades competentes proporcionando la información
              requerida, conforme a la legislación vigente.
            </p>

            <h4>7. Propiedad Intelectual</h4>
            <p>
              Todos los contenidos de la plataforma, incluyendo textos, diseños,
              logotipos, imágenes y código, son propiedad de TestiGO o de sus
              respectivos titulares, y se encuentran protegidos por las normas de
              propiedad intelectual. Queda prohibida su reproducción sin autorización.
            </p>

            <h4>8. Responsabilidad de la Plataforma</h4>
            <p>
              TestiGO actúa como un medio tecnológico de recepción de información y no
              garantiza la veracidad ni exactitud del contenido proporcionado por los
              usuarios. La plataforma no se hace responsable por daños directos o
              indirectos derivados del uso de la información registrada por terceros.
            </p>

            <h4>9. Modificaciones de los Términos</h4>
            <p>
              TestiGO se reserva el derecho de modificar los presentes Términos y
              Condiciones en cualquier momento. Las modificaciones serán publicadas
              en esta sección y entrarán en vigor desde su publicación.
            </p>

            <h4>10. Aceptación de los Términos</h4>
            <p>
              Al marcar la casilla “He leído y acepto los términos y condiciones”, el
              usuario declara haber leído, comprendido y aceptado íntegramente los
              presentes Términos y Condiciones, otorgando su consentimiento expreso
              para el tratamiento de sus datos personales y el uso de la plataforma.
            </p>

          </div>
        </div>

        {/* Checkbox de aceptación */}
        <div className="aceptacion">
          <input
            type="checkbox"
            id="acepto"
            checked={aceptado}
            onChange={manejarCheckbox} // Cambia estado de aceptación
          />
          <label htmlFor="acepto">He leído y acepto los términos.</label>
        </div>

        {/* Botones de navegación */}
        <div className="botones">
          <button className="cancelar" onClick={manejarCancelar}>
            Cancelar
          </button>
          <button
            className="siguiente"
            onClick={manejarSiguiente}
            disabled={!aceptado} // Solo se puede avanzar si se aceptan los términos
          >
            Siguiente
          </button>
        </div>
      </div>
    </LayoutPrincipal>
  );
};

export default CiudadanoHome;
