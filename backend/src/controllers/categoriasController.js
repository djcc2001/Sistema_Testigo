const CategoriasModel = require('../models/categoriasModel');

exports.listarCategorias = async (req, res) => {
  try {
    const categorias = await CategoriasModel.listarCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener categorías"
    });
  }
};
