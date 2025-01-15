import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadEquipajes();
    loadReservas();
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
    document.getElementById('saveEquipaje').addEventListener('click', saveEquipaje);
    
    const modal = document.getElementById('equipajeModal');
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('equipajeForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nuevo Equipaje';
    });

    // Agregar validación de peso y dimensiones
    ['peso', 'longitud', 'ancho', 'altura'].forEach(field => {
        document.getElementById(field).addEventListener('input', validateDimensions);
    });
}

function validateDimensions() {
    const peso = parseFloat(document.getElementById('peso').value);
    const longitud = parseFloat(document.getElementById('longitud').value);
    const ancho = parseFloat(document.getElementById('ancho').value);
    const altura = parseFloat(document.getElementById('altura').value);

    if (peso > 32) {
        showError('El peso máximo permitido es 32 kg');
        document.getElementById('peso').value = '';
        return false;
    }

    if (isNaN(longitud) || isNaN(ancho) || isNaN(altura)) {
        return false;
    }

    const dimensionTotal = longitud + ancho + altura;
    if (dimensionTotal > 158) {
        showError('La suma de dimensiones no puede exceder 158 cm');
        return false;
    }

    return true;
}

function initializeDataTable() {
    table = new DataTable('#equipajesTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_equipaje' },
            { 
                data: 'reserva',
                render: function(data, type, row) {
                    return `Reserva #${row.id_reserva}`;
                }
            },
            { 
                data: 'peso',
                render: function(data) {
                    return `${data} kg`;
                }
            },
            { data: 'tipo' },
            { 
                data: null,
                render: function(data) {
                    return `${data.longitud} × ${data.ancho} × ${data.altura} cm`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-warning me-1" onclick="editEquipaje(${data.id_equipaje})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEquipaje(${data.id_equipaje})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
}

async function loadReservas() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/reservas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar reservas');
        
        const reservas = await response.json();
        const select = document.getElementById('id_reserva');
        select.innerHTML = '<option value="">Seleccione una reserva</option>' + 
            reservas.map(reserva => 
                `<option value="${reserva.id_reserva}">Reserva #${reserva.id_reserva} - ${reserva.pasajero.nombre} ${reserva.pasajero.apellido}</option>`
            ).join('');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar las reservas');
    }
}

async function loadEquipajes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/equipaje`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar equipajes');
        
        const data = await response.json();
        table.clear();
        table.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los equipajes');
    }
}

window.editEquipaje = async function(id) {
    editingId = id;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/equipaje/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar datos del equipaje');
        
        const equipaje = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Equipaje';
        document.getElementById('equipajeId').value = equipaje.id_equipaje;
        document.getElementById('id_reserva').value = equipaje.id_reserva;
        document.getElementById('peso').value = equipaje.peso;
        document.getElementById('tipo').value = equipaje.tipo;
        document.getElementById('longitud').value = equipaje.longitud;
        document.getElementById('ancho').value = equipaje.ancho;
        document.getElementById('altura').value = equipaje.altura;
        
        new bootstrap.Modal(document.getElementById('equipajeModal')).show();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos del equipaje');
    }
};

window.deleteEquipaje = async function(id) {
    const confirmed = await showConfirm(
        '¿Estás seguro?',
        'El equipaje será eliminado permanentemente'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/equipaje/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Equipaje eliminado exitosamente');
                loadEquipajes();
            } else {
                const errorData = await response.json();
                showError(errorData.message || 'Error al eliminar el equipaje');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar el equipaje');
        }
    }
};

async function saveEquipaje() {
    if (!validateDimensions()) {
        return;
    }

    const formData = {
        id_reserva: parseInt(document.getElementById('id_reserva').value),
        peso: parseFloat(document.getElementById('peso').value),
        tipo: document.getElementById('tipo').value,
        longitud: parseFloat(document.getElementById('longitud').value),
        ancho: parseFloat(document.getElementById('ancho').value),
        altura: parseFloat(document.getElementById('altura').value)
    };

    if (!formData.id_reserva) {
        showError('Por favor seleccione una reserva');
        return;
    }

    const url = editingId 
        ? `${config.API_URL}/equipaje/${editingId}`
        : `${config.API_URL}/equipaje`;
        
    const method = editingId ? 'PUT' : 'POST';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('equipajeModal')).hide();
            showSuccess(editingId ? 'Equipaje actualizado exitosamente' : 'Equipaje creado exitosamente');
            loadEquipajes();
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Error al guardar el equipaje');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar el equipaje');
    }
}