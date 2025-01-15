import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadAeropuertos();
    setupEventListeners();
});

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

// Función reutilizable para confirmaciones
async function showConfirmDialog(title, text) {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
    });

    return result.isConfirmed;
}

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('saveAeropuerto').addEventListener('click', saveAeropuerto);
    
    // Reset form when modal is closed
    const modal = document.getElementById('aeropuertoModal');
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('aeropuertoForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nuevo Aeropuerto';
    });
}

function initializeDataTable() {
    table = new DataTable('#aeropuertosTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_aeropuerto' },
            { data: 'codigo_iata' },
            { data: 'nombre' },
            { data: 'ciudad' },
            { data: 'pais' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-warning me-1" onclick="editAeropuerto(${data.id_aeropuerto})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAeropuerto(${data.id_aeropuerto})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
}

async function loadAeropuertos() {
    try {

        showSuccess('Carga Exitosa');
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/aeropuertos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new showError('Error al cargar aeropuertos');
        
        const data = await response.json();
        table.clear();
        table.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los aeropuertos');
    }
}

// Hacer las funciones globales para los botones de la tabla
window.editAeropuerto = async function(id_aeropuerto) {
    editingId = id_aeropuerto;
    try {
        showSuccess('Carga para actualizar datos exitosa');
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/aeropuertos/${id_aeropuerto}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const aeropuerto = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Aeropuerto';
        document.getElementById('aeropuertoId').value = aeropuerto.id_aeropuerto;
        document.getElementById('codigo_iata').value = aeropuerto.codigo_iata;
        document.getElementById('nombre').value = aeropuerto.nombre;
        document.getElementById('ciudad').value = aeropuerto.ciudad;
        document.getElementById('pais').value = aeropuerto.pais;
        
        new bootstrap.Modal(document.getElementById('aeropuertoModal')).show();

    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos del aeropuerto');
    }
};

window.deleteAeropuerto = async function(id) {

    const confirmed = await showConfirmDialog(
        '¿Estás seguro?',
        '¿Deseas eliminar este aeropuerto?'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/aeropuertos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Aeropuerto eliminado exitosamente');
                loadAeropuertos();
            } else {
                showError('Error al eliminar el aeropuerto');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar el aeropuerto');
        }
    }
};

async function saveAeropuerto() {
    const formData = {
        codigo_iata: document.getElementById('codigo_iata').value,
        nombre: document.getElementById('nombre').value,
        ciudad: document.getElementById('ciudad').value,
        pais: document.getElementById('pais').value
    };

    const token = localStorage.getItem('token');
    try {
        const url = editingId 
            ? `${config.API_URL}/aeropuertos/${editingId}`
            : `${config.API_URL}/aeropuertos`;
            
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('aeropuertoModal')).hide();
            loadAeropuertos();
            showSuccess(editingId ? 'Aeropuerto actualizado exitosamente' : 'Aeropuerto creado exitosamente');
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar el aeropuerto');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el aeropuerto');
    }
}