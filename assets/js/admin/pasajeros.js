import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadPasajeros();
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
    document.getElementById('savePasajero').addEventListener('click', savePasajero);
    
    const modal = document.getElementById('pasajeroModal');
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('pasajeroForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nuevo Pasajero';
    });
}

function initializeDataTable() {
    table = new DataTable('#pasajerosTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_pasajero' },
            { data: 'nombre' },
            { data: 'apellido' },
            { data: 'pasaporte' },
            { data: 'dni' },
            { data: 'email' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-warning me-1" onclick="editPasajero(${data.id_pasajero})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deletePasajero(${data.id_pasajero})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
}

async function loadPasajeros() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/pasajeros`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar pasajeros');
        
        const data = await response.json();
        table.clear();
        table.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los pasajeros');
    }
}

window.editPasajero = async function(id) {
    editingId = id;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/pasajeros/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const pasajero = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Pasajero';
        document.getElementById('pasajeroId').value = pasajero.id_pasajero;
        document.getElementById('nombre').value = pasajero.nombre;
        document.getElementById('apellido').value = pasajero.apellido;
        document.getElementById('fecha_nacimiento').value = pasajero.fecha_nacimiento.split('T')[0];
        document.getElementById('nacionalidad').value = pasajero.nacionalidad;
        document.getElementById('pasaporte').value = pasajero.pasaporte;
        document.getElementById('contacto').value = pasajero.contacto;
        document.getElementById('dni').value = pasajero.dni;
        document.getElementById('email').value = pasajero.email;
        
        new bootstrap.Modal(document.getElementById('pasajeroModal')).show();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos del pasajero');
    }
};

window.deletePasajero = async function(id) {
    const confirmed = await showConfirm(
        '¿Estás seguro?',
        'El pasajero será eliminado permanentemente'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/pasajeros/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Pasajero eliminado exitosamente');
                loadPasajeros();
            } else {
                const errorData = await response.json();
                
                // Verificar si el error es de restricción de llave foránea
                if (errorData.error && (
                    errorData.error.includes('foreign key constraint') ||
                    errorData.error.includes('llave foránea') ||
                    errorData.error.includes('constraint') ||
                    response.status === 409
                )) {
                    Swal.fire({
                        title: 'No se puede eliminar',
                        text: 'Este pasajero no puede ser eliminado porque está relacionado con otras tablas (por ejemplo, reservas o vuelos). Debe eliminar primero esas referencias antes de poder eliminar el pasajero.',
                        icon: 'warning',
                        confirmButtonColor: '#3085d6'
                    });
                } else {
                    showError(errorData.message || 'Error al eliminar el pasajero');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar el pasajero');
        }
    }
};

async function savePasajero() {
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        nacionalidad: document.getElementById('nacionalidad').value,
        pasaporte: document.getElementById('pasaporte').value,
        contacto: parseInt(document.getElementById('contacto').value),
        dni: parseInt(document.getElementById('dni').value),
        email: document.getElementById('email').value
    };

    const token = localStorage.getItem('token');
    try {
        const url = editingId 
            ? `${config.API_URL}/pasajeros/${editingId}`
            : `${config.API_URL}/pasajeros`;
            
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
            bootstrap.Modal.getInstance(document.getElementById('pasajeroModal')).hide();
            showSuccess(editingId ? 'Pasajero actualizado exitosamente' : 'Pasajero creado exitosamente');
            loadPasajeros();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar el pasajero');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el pasajero');
    }
}