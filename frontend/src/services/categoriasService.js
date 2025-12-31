import api from './api';

export const getCategorias = async () => {
  const res = await api.get('/categorias');
  return res.data;
};
