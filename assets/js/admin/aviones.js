import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadAviones();
    setupEventListeners();
});

// Funciones de utilidad para alertas
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
    document.getElementById('saveAvion').addEventListener('click', saveAvion);
    
    // Reset form when modal is closed
    const modal = document.getElementById('avionModal');
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('avionForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nuevo Avión';
    });
}

function initializeDataTable() {
    table = new DataTable('#avionesTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_avion' },
            { data: 'modelo' },
            { data: 'capacidad' },
            { data: 'year_fabricacion' },
            { data: 'estado_avion' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-warning me-1" onclick="editAvion(${data.id_avion})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAvion(${data.id_avion})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
}

async function loadAviones() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/aviones`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar aviones');
        
        const data = await response.json();
        table.clear();
        table.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los aviones');
    }
}

// Hacer las funciones globales para los botones de la tabla
window.editAvion = async function(id_avion) {
    editingId = id_avion;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/aviones/${id_avion}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const avion = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Avión';
        document.getElementById('avionId').value = avion.id_avion;
        document.getElementById('modelo').value = avion.modelo;
        document.getElementById('capacidad').value = avion.capacidad;
        document.getElementById('year_fabricacion').value = avion.year_fabricacion;
        document.getElementById('estado_avion').value = avion.estado_avion;
        
        new bootstrap.Modal(document.getElementById('avionModal')).show();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos del avión');
    }
};

window.deleteAvion = async function(id) {
    const confirmed = await showConfirm(
        '¿Estás seguro?',
        'El avión será eliminado permanentemente'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/aviones/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Avión eliminado exitosamente');
                loadAviones();
            } else {
                showError('Error al eliminar el avión');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar el avión');
        }
    }
};

async function saveAvion() {
    const formData = {
        modelo: document.getElementById('modelo').value,
        capacidad: parseInt(document.getElementById('capacidad').value),
        year_fabricacion: parseInt(document.getElementById('year_fabricacion').value),
        estado_avion: document.getElementById('estado_avion').value
    };

    const token = localStorage.getItem('token');
    try {
        const url = editingId 
            ? `${config.API_URL}/aviones/${editingId}`
            : `${config.API_URL}/aviones`;
            
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
            bootstrap.Modal.getInstance(document.getElementById('avionModal')).hide();
            showSuccess(editingId ? 'Avión actualizado exitosamente' : 'Avión creado exitosamente');
            loadAviones();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar el avión');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el avión');
    }
}