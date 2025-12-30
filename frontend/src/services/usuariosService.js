// src/services/usuariosService.js
import api from './api';

export const getUsuarios = async () => {
  try {
    const response = await api.get('/usuarios');
    return response.data; // aquí vendrán los usuarios
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Obtener un usuario por su ID
 */
export const obtenerUsuarioPorId = async (id) => {
  try {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Editar un usuario por su ID para el admin
 */
export const actualizarUsuarioPorId = async (id, data) => {
  try {
    const response = await api.put(`/usuarios/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario con id ${id}:`, error);
    throw error;
  }
};

/**
 * Instituciones
 */
export const getInstituciones = async () => {
  try {
    const response = await api.get('/usuarios/instituciones');
    return response.data;
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    throw error;
  }
};

export const eliminarUsuario = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar usuario con id ${id}:`, error);
    throw error;
  }
};
