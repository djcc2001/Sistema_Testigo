// api.js

import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000', // URL base del backend
    timeout: 10000, // Tiempo máximo de espera en ms
});

// Interceptor para agregar el token automáticamente a las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Agrega token a headers
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido: limpiar almacenamiento y redirigir
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Servicios de autenticación
export const authService = {
    // Login de usuario
    login: async (credentials) => {
        const payload = {
            correoODni: credentials.username,
            contrasena: credentials.password
        };
        return await api.post('/usuarios/login', payload);
    },
    
    // Registro de usuario
    register: async (userData) => {
        return await api.post('/usuarios/register', {
            dni: userData.dni,
            nombres: userData.nombres,
            apellido_paterno: userData.apellidos.split(' ')[0] || '',
            apellido_materno: userData.apellidos.split(' ')[1] || '',
            nro_celular: userData.celular,
            correo: userData.correo,
            contrasena: userData.contrasenia,
            rol: 'ciudadano'
        });
    },
    
    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('usuario');
    },
    
    createUserAdmin: async (userData) => {
        const data = new FormData();
        data.append("dni", userData.dni);
        data.append("nombres", userData.nombres);
        data.append("apellido_paterno", userData.apellidos.split(" ")[0] || "");
        data.append("apellido_materno", userData.apellidos.split(" ")[1] || "");
        data.append("nro_celular", userData.celular);
        data.append("correo", userData.correo);
        data.append("contrasena", userData.contrasena);
        data.append("rol", userData.rol || "ciudadano");

        if (userData.foto) {
            data.append("foto", userData.foto);
        }

        // Enviar a /usuarios/admin para diferenciarnos del registro público
        return await api.post("/usuarios/admin", data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    // Obtener perfil del usuario autenticado
    getProfile: async () => {
        return await api.get('/usuarios/perfil');
    },

    // Actualizar perfil del usuario autenticado (foto opcional)
    updateProfile: async (profileData) => {
        const data = new FormData();
        if (profileData.dni) data.append('dni', profileData.dni); // <-- incluir dni
        if (profileData.correo) data.append('correo', profileData.correo);
        if (profileData.nro_celular) data.append('nro_celular', profileData.nro_celular);
        if (profileData.contrasena) data.append('contrasena', profileData.contrasena);
        if (profileData.foto) data.append('foto', profileData.foto);

        return await api.put('/usuarios/perfil', data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
};

// ===========================================================
// Servicios de reportes
// ===========================================================

export const reportesService = {
    // Crear un nuevo reporte
    crearReporte: async (reporteData) => {
    // reporteData YA es un FormData, no necesitamos crear otro
    return await api.post("/reportes", reporteData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    },
    // Obtener todos los reportes (solo admins)
    obtenerTodos: async () => {
        return await api.get("/reportes");
    },

    // Obtener reportes del usuario actual
    obtenerPorUsuario: async () => {
        return await api.get("/reportes/mis-reportes");
    },

    // Obtener reportes más recientes para carrusel
    obtenerRecientes: async (limite = 5) => {
        return await api.get(`/reportes/recientes?limite=${limite}`);
    },

    // Obtener estadísticas generales
    obtenerEstadisticasGenerales: async () => {
        return await api.get("/reportes/estadisticas/generales");
    },

    // Obtener estadísticas del ciudadano autenticado
    obtenerEstadisticasCiudadano: async () => {
        return await api.get("/reportes/estadisticas/ciudadano");
    },

    // Obtener resumen de reportes para autoridad
    obtenerResumenAutoridad: async () => {
        return await api.get("/reportes/autoridad/resumen");
    },

    // Listar reportes asignados a autoridad con filtros
    listarReportesAutoridad: async (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.estado_id) params.append('estado_id', filtros.estado_id);
        if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
        if (filtros.pagina) params.append('pagina', filtros.pagina);
        if (filtros.limite) params.append('limite', filtros.limite);
        
        const queryString = params.toString();
        return await api.get(`/reportes/autoridad/reportes${queryString ? '?' + queryString : ''}`);
    },

    // Obtener reportes archivados de la autoridad
    obtenerReportesArchivados: async (busqueda = '') => {
        const params = new URLSearchParams();
        params.append('estado_id', '4'); // Estado Archivado
        if (busqueda) params.append('busqueda', busqueda);
        params.append('limite', '100'); // Límite alto para mostrar todos
        
        return await api.get(`/reportes/autoridad/reportes?${params.toString()}`);
    }
};


// Reportes
export const crearReporte = reportesService.crearReporte;
export const obtenerTodosReportes = reportesService.obtenerTodos;
export const obtenerReportesUsuario = reportesService.obtenerPorUsuario;
export const obtenerReportesRecientes = reportesService.obtenerRecientes;
export const obtenerEstadisticasGenerales = reportesService.obtenerEstadisticasGenerales;
export const obtenerEstadisticasCiudadano = reportesService.obtenerEstadisticasCiudadano;
export const obtenerResumenAutoridad = reportesService.obtenerResumenAutoridad;
export const listarReportesAutoridad = reportesService.listarReportesAutoridad;
export const obtenerReportesArchivados = reportesService.obtenerReportesArchivados;

// Exportar funciones individuales para uso directo
export const login = authService.login;
export const register = authService.register;
export const logout = authService.logout;
export const createUserAdmin = authService.createUserAdmin;
export const getProfile = authService.getProfile;
export const updateProfile = authService.updateProfile;

export default api;
