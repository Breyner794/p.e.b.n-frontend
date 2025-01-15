import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let aeropuertosTable, vuelosTable, avionesTable;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    initializeTables();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Cargar datos cuando se abran los modales
    document.getElementById('aeropuertosModal').addEventListener('show.bs.modal', loadAeropuertos);
    document.getElementById('vuelosModal').addEventListener('show.bs.modal', loadVuelos);
    document.getElementById('avionesModal').addEventListener('show.bs.modal', loadAviones);
}

function initializeTables() {
    // Inicializar DataTable para Aeropuertos
    aeropuertosTable = new DataTable('#aeropuertosTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'codigo_iata' },
            { data: 'nombre' },
            { data: 'ciudad' },
            { data: 'pais' }
        ]
    });

    // Inicializar DataTable para Vuelos
    vuelosTable = new DataTable('#vuelosTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'numero_de_vuelo' },
            { data: 'origen' },
            { data: 'destino' },
            { data: 'fecha_hora_salida' },
            { data: 'estado_vuelo' }
        ]
    });

    // Inicializar DataTable para Aviones
    avionesTable = new DataTable('#avionesTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_avion' },
            { data: 'modelo' },
            { data: 'capacidad' },
            { data: 'estado_avion' },
            { data: 'year_fabricacion'}
        ]
    });
}

// Para mensajes de éxito
function showSuccess(message) {
    Swal.fire({
        title: '¡Éxito!',
        text: message,
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar'
    });
}

// Para mensajes de error
function showError(message) {
    Swal.fire({
        title: '¡Error!',
        text: message,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar'
    });
}

//Carga todo los aeropuertos que tengas en la base de datos
async function loadAeropuertos() {
    try {

        showSuccess('Carga Exitosa');

        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/aeropuertos`, { //verificar la API_URL en js/config.js y revisar la ruta de backend
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new showError('Error al cargar aeropuertos');
        
        const data = await response.json();
        aeropuertosTable.clear();
        aeropuertosTable.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los aeropuertos');
    }
}

//Carga todo los vuelos que tengas cargados en la base de datos
async function loadVuelos() {
    try {

        showSuccess('Carga Exitosa');

        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/vuelos`, { //verificar la API_URL en js/config.js y revisar la ruta de backend
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new showError('Error al cargar vuelos');
        
        const data = await response.json();
        vuelosTable.clear();
        vuelosTable.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los vuelos');
    }
}

//Carga todas los aviones que tengas en la base de datos 
async function loadAviones() {
    try {
        showSuccess('Carga Exitosa')
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/aviones`, { //verificar la API_URL en js/config.js y revisar la ruta de backend
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new showError('Error al cargar aviones');
        
        const data = await response.json();
        avionesTable.clear();
        avionesTable.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los aviones');
    }
}