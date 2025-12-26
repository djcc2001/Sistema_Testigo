// reniecService.js
import api from './api';

// Cache para evitar consultas repetidas
const cache = new Map();

export const consultarRENIEC = async (dni) => {
  // Validación básica del DNI
  if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
    throw new Error('DNI debe tener 8 dígitos numéricos');
  }

  // Verificar si ya está en cache
  if (cache.has(dni)) {
    const cached = cache.get(dni);
    if (cached) {
      console.log('Usando cache para DNI:', dni);
      return cached;
    }
    throw new Error('DNI no encontrado en RENIEC');
  }

  try {
    // Llama a TU backend (no directamente a Decolecta)
    const response = await api.get(`/reniec/dni/${dni}`);

    // axios ya parsea el JSON automáticamente
    const result = response.data;

    // Verificar si la respuesta es exitosa
    if (!result.ok) {
      cache.set(dni, null);
      throw new Error(result.error || 'DNI no encontrado en RENIEC');
    }

    // Procesar respuesta exitosa
    if (result.nombres) {
      const userData = {
        nombres: result.nombres,
        apellidos: result.apellidos,
        documentNumber: result.documentNumber,
        fullName: result.fullName
      };
      
      cache.set(dni, userData);
      return userData;
    }

    throw new Error('Formato de respuesta no reconocido');

  } catch (error) {
    console.error('Error en consulta RENIEC:', error.message);

    // Si es un error de axios con respuesta del servidor
    if (error.response) {
      const errorMsg = error.response.data?.error || 'Error en la consulta';
      
      if (error.response.status === 404) {
        cache.set(dni, null);
        throw new Error('DNI no encontrado en RENIEC');
      }
      if (error.response.status === 503) {
        throw new Error('Servicio RENIEC no disponible. Configure DECOLECTA_TOKEN en el backend');
      }
      
      throw new Error(errorMsg);
    }

    // Error de red o conexión
    throw error;
  }
};

// Función para limpiar el cache
export const limpiarCache = () => {
  cache.clear();
  console.log('Cache de RENIEC limpiado');
};
