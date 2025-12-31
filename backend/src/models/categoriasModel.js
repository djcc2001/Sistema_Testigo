const pool = require('../config/db');

const listarCategorias = async () => {
  const query = `
    SELECT id, descripcion
    FROM categoria
    ORDER BY id
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  listarCategorias
};
