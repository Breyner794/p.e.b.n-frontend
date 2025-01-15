import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadTripulacion();
    loadVuelos();
    loadEmpleados();
    setupEventListeners();
});

function showSuccess(message) {
    Swal.fire({
        title: '¡Éxito!',
        text: message,
        icon: 'success',
        confirmButtonColor: '#3085d6'
    });
}

function showError(message) {
    Swal.fire({
        title: '¡Error!',
        text: message,
        icon: 'error',
        confirmButtonColor: '#d33'
    });
}

async function showConfirm(title, text) {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
}

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('saveTripulacion').addEventListener('click', saveTripulacion);
    
    const modal = document.getElementById('tripulacionModal');
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('tripulacionForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nueva Tripulación';
    });
}

function initializeDataTable() {
    table = new DataTable('#tripulacionTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_tripulacion' },
            { 
                data: 'vuelo',
                render: function(data) {
                    return `Vuelo ${data.id_vuelo}`; // Ajusta según la estructura de tus datos
                }
            },
            { 
                data: 'empleado',
                render: function(data) {
                    return data.nombre; // Ajusta según la estructura de tus datos
                }
            },
            { data: 'rol' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-warning me-1" onclick="editTripulacion(${data.id_tripulacion})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTripulacion(${data.id_tripulacion})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
}

async function loadVuelos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/vuelos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar vuelos');
        
        const vuelos = await response.json();
        const select = document.getElementById('id_vuelo');
        select.innerHTML = vuelos.map(vuelo => 
            `<option value="${vuelo.id_vuelo}">Vuelo ${vuelo.id_vuelo}</option>`
        ).join('');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los vuelos');
    }
}

async function loadEmpleados() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/empleados`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar empleados');
        
        const empleados = await response.json();
        const select = document.getElementById('id_empleado');
        select.innerHTML = empleados.map(empleado => 
            `<option value="${empleado.id_empleado}">${empleado.nombre}</option>`
        ).join('');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los empleados');
    }
}

async function loadTripulacion() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/tripulacion`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar tripulación');
        
        const data = await response.json();
        table.clear();
        table.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar la tripulación');
    }
}

window.editTripulacion = async function(id) {
    editingId = id;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/tripulacion/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const tripulacion = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Tripulación';
        document.getElementById('tripulacionId').value = tripulacion.id_tripulacion;
        document.getElementById('id_vuelo').value = tripulacion.id_vuelo;
        document.getElementById('id_empleado').value = tripulacion.id_empleado;
        document.getElementById('rol').value = tripulacion.rol;
        
        new bootstrap.Modal(document.getElementById('tripulacionModal')).show();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos de la tripulación');
    }
};

window.deleteTripulacion = async function(id) {
    const confirmed = await showConfirm(
        '¿Estás seguro?',
        'La tripulación será eliminada permanentemente'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/tripulacion/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Tripulación eliminada exitosamente');
                loadTripulacion();
            } else {
                showError('Error al eliminar la tripulación');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar la tripulación');
        }
    }
};

async function saveTripulacion() {
    const formData = {
        id_vuelo: parseInt(document.getElementById('id_vuelo').value),
        id_empleado: parseInt(document.getElementById('id_empleado').value),
        rol: document.getElementById('rol').value
    };

    const token = localStorage.getItem('token');
    try {
        const url = editingId 
            ? `${config.API_URL}/tripulacion/${editingId}`
            : `${config.API_URL}/tripulacion`;
            
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
            bootstrap.Modal.getInstance(document.getElementById('tripulacionModal')).hide();
            showSuccess(editingId ? 'Tripulación actualizada exitosamente' : 'Tripulación creada exitosamente');
            loadTripulacion();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar la tripulación');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar la tripulación');
    }
}