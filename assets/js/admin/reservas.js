import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadReservas();
    loadPasajeros();
    loadVuelos();
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
    document.getElementById('saveReserva').addEventListener('click', saveReserva);
    
    const modal = document.getElementById('reservaModal');
    modal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('reservaForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nueva Reserva';
    });

    // Agregar evento para validar fecha de reserva cuando se selecciona un vuelo
    document.getElementById('id_vuelo').addEventListener('change', async function() {
        const vueloId = this.value;
        if (vueloId) {
            await validateFechaReserva(vueloId);
        }
    });
}

function initializeDataTable() {
    table = new DataTable('#reservasTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        columns: [
            { data: 'id_reserva' },
            { 
                data: 'pasajero',
                render: function(data) {
                    return `${data.nombre} ${data.apellido}`;
                }
            },
            { 
                data: 'vuelo',
                render: function(data) {
                    return `Vuelo ${data.id_vuelo}`;
                }
            },
            { 
                data: 'fecha_de_reserva',
                render: function(data) {
                    return new Date(data).toLocaleString();
                }
            },
            { data: 'clase' },
            { data: 'estado_de_la_reserva' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-warning me-1" onclick="editReserva(${data.id_reserva})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteReserva(${data.id_reserva})">
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
        
        const pasajeros = await response.json();
        const select = document.getElementById('id_pasajero');
        select.innerHTML = pasajeros.map(pasajero => 
            `<option value="${pasajero.id_pasajero}">${pasajero.nombre} ${pasajero.apellido}</option>`
        ).join('');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los pasajeros');
    }
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
            `<option value="${vuelo.id_vuelo}">Vuelo ${vuelo.id_vuelo} - ${new Date(vuelo.fecha_hora_salida).toLocaleString()}</option>`
        ).join('');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los vuelos');
    }
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
        
        const data = await response.json();
        table.clear();
        table.rows.add(data).draw();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar las reservas');
    }
}

async function validateFechaReserva(vueloId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/vuelos/${vueloId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar información del vuelo');
        
        const vuelo = await response.json();
        const fechaInput = document.getElementById('fecha_de_reserva');
        
        // Establecer la fecha máxima como la fecha de salida del vuelo
        const fechaSalida = new Date(vuelo.fecha_hora_salida);
        fechaInput.max = fechaSalida.toISOString().slice(0, 16);
        
        // Si hay una fecha seleccionada, validarla
        if (fechaInput.value) {
            const fechaReserva = new Date(fechaInput.value);
            if (fechaReserva > fechaSalida) {
                showError('La fecha de reserva no puede ser posterior a la fecha de salida del vuelo');
                fechaInput.value = '';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al validar la fecha de reserva');
    }
}

window.editReserva = async function(id) {
    editingId = id;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/reservas/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const reserva = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Reserva';
        document.getElementById('reservaId').value = reserva.id_reserva;
        document.getElementById('id_pasajero').value = reserva.id_pasajero;
        document.getElementById('id_vuelo').value = reserva.id_vuelo;
        document.getElementById('fecha_de_reserva').value = new Date(reserva.fecha_de_reserva).toISOString().slice(0, 16);
        document.getElementById('clase').value = reserva.clase;
        document.getElementById('estado_de_la_reserva').value = reserva.estado_de_la_reserva;
        
        // Validar la fecha de reserva con el vuelo seleccionado
        await validateFechaReserva(reserva.id_vuelo);
        
        new bootstrap.Modal(document.getElementById('reservaModal')).show();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos de la reserva');
    }
};

window.deleteReserva = async function(id) {
    const confirmed = await showConfirm(
        '¿Estás seguro?',
        'La reserva será eliminada permanentemente'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/reservas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Reserva eliminada exitosamente');
                loadReservas();
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
                        text: 'Esta reserva no puede ser eliminada porque está relacionada con otros registros en el sistema.',
                        icon: 'warning',
                        confirmButtonColor: '#3085d6'
                    });
                } else {
                    showError(errorData.message || 'Error al eliminar la reserva');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar la reserva');
        }
    }
};

async function saveReserva() {
    // Validar fecha de reserva antes de enviar
    const vueloId = document.getElementById('id_vuelo').value;
    const fechaReserva = new Date(document.getElementById('fecha_de_reserva').value);
    
    try {
        const token = localStorage.getItem('token');
        const vueloResponse = await fetch(`${config.API_URL}/vuelos/${vueloId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const vuelo = await vueloResponse.json();
        const fechaSalida = new Date(vuelo.fecha_hora_salida);
        
        if (fechaReserva > fechaSalida) {
            showError('La fecha de reserva no puede ser posterior a la fecha de salida del vuelo');
            return;
        }

        const formData = {
            id_pasajero: parseInt(document.getElementById('id_pasajero').value),
            id_vuelo: parseInt(vueloId),
            fecha_de_reserva: document.getElementById('fecha_de_reserva').value,
            clase: document.getElementById('clase').value,
            estado_de_la_reserva: document.getElementById('estado_de_la_reserva').value
        };

        const url = editingId 
            ? `${config.API_URL}/reservas/${editingId}`
            : `${config.API_URL}/reservas`;
            
        const method = editingId ? 'PUT' : 'POST';

        const saveResponse = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (saveResponse.ok) {
            bootstrap.Modal.getInstance(document.getElementById('reservaModal')).hide();
            showSuccess(editingId ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente');
            loadReservas();
        } else {
            const errorData = await saveResponse.json();
            if (errorData.error && errorData.error.includes('vuelo especificado no existe')) {
                showError('El vuelo seleccionado no está disponible');
            } else if (errorData.error && errorData.error.includes('fecha de reserva')) {
                showError('La fecha de reserva no es válida para este vuelo');
            } else {
                showError(errorData.message || 'Error al guardar la reserva');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al guardar la reserva');
    }
}