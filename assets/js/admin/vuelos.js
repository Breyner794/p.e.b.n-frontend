import { config } from '../config.js';
import { checkAuth, logout } from '../auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
   checkAuth();
   initializeDataTable(); 
   loadVuelos();
   loadAeropuertos();
   loadAviones();
   setupEventListeners();
   setupValidation();
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
   document.getElementById('saveVuelo').addEventListener('click', saveVuelo);
   
   const modal = document.getElementById('vueloModal');
   modal.addEventListener('hidden.bs.modal', function () {
       document.getElementById('vueloForm').reset();
       editingId = null;
       document.getElementById('modalTitle').textContent = 'Nuevo Vuelo';
   });
}

function setupValidation() {
   // Validar que fecha de llegada sea posterior a la de salida
   document.getElementById('fecha_hora_llegada').addEventListener('change', function() {
       const salida = new Date(document.getElementById('fecha_hora_salida').value);
       const llegada = new Date(this.value);
       
       if (llegada <= salida) {
           showError('La fecha de llegada debe ser posterior a la de salida');
           this.value = '';
       }
   });
}

function formatDateTime(date) {
   return new Date(date).toLocaleString();
}

function initializeDataTable() {
   table = new DataTable('#vuelosTable', {
       language: {
           url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
       },
       columns: [
           { data: 'numero_de_vuelo' },
           { 
               data: 'aeropuertoOrigen',
               render: function(data) {
                   return data ? data.nombre : 'No disponible';
               }
           },
           { 
               data: 'aeropuertoDestino',
               render: function(data) {
                   return data ? data.nombre : 'No disponible';
               }
           },
           { 
               data: 'fecha_hora_salida',
               render: function(data) {
                   return formatDateTime(data);
               }
           },
           { 
               data: 'fecha_hora_llegada',
               render: function(data) {
                   return formatDateTime(data);
               }
           },
           { data: 'estado_vuelo' },
           { 
               data: 'avion',
               render: function(data) {
                   return data ? `${data.modelo}` : 'No disponible';
               }
           },
           {
               data: null,
               render: function(data) {
                   return `
                       <button class="btn btn-sm btn-warning me-1" onclick="editVuelo(${data.id_vuelo})">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button class="btn btn-sm btn-danger" onclick="deleteVuelo(${data.id_vuelo})">
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
       const token = localStorage.getItem('token');
       const response = await fetch(`${config.API_URL}/aeropuertos`, {
           headers: { 'Authorization': `Bearer ${token}` }
       });
       
       if (!response.ok) throw new Error('Error al cargar aeropuertos');
       
       const aeropuertos = await response.json();
       const origenSelect = document.getElementById('origen');
       const destinoSelect = document.getElementById('destino');
       
       const options = aeropuertos.map(aeropuerto => 
           `<option value="${aeropuerto.id_aeropuerto}">${aeropuerto.nombre} (${aeropuerto.codigo_iata})</option>`
       ).join('');
       
       origenSelect.innerHTML = options;
       destinoSelect.innerHTML = options;
   } catch (error) {
       console.error('Error:', error);
       showError('Error al cargar los aeropuertos');
   }
}

async function loadAviones() {
   try {
       const token = localStorage.getItem('token');
       const response = await fetch(`${config.API_URL}/aviones`, {
           headers: { 'Authorization': `Bearer ${token}` }
       });
       
       if (!response.ok) throw new Error('Error al cargar aviones');
       
       const aviones = await response.json();
       const select = document.getElementById('id_avion');
       select.innerHTML = aviones.map(avion => 
           `<option value="${avion.id_avion}">${avion.modelo}</option>`
       ).join('');
   } catch (error) {
       console.error('Error:', error);
       showError('Error al cargar los aviones');
   }
}

async function loadVuelos() {
   try {
       const token = localStorage.getItem('token');
       const response = await fetch(`${config.API_URL}/vuelos`, {
           headers: { 'Authorization': `Bearer ${token}` }
       });
       
       if (!response.ok) throw new Error('Error al cargar vuelos');
       
       const data = await response.json();
       table.clear();
       table.rows.add(data).draw();
   } catch (error) {
       console.error('Error:', error);
       showError('Error al cargar los vuelos');
   }
}

window.editVuelo = async function(id) {
   editingId = id;
   try {
       const token = localStorage.getItem('token');
       const response = await fetch(`${config.API_URL}/vuelos/${id}`, {
           headers: { 'Authorization': `Bearer ${token}` }
       });
       
       const vuelo = await response.json();
       
       document.getElementById('modalTitle').textContent = 'Editar Vuelo';
       document.getElementById('vueloId').value = vuelo.id_vuelo;
       document.getElementById('numero_de_vuelo').value = vuelo.numero_de_vuelo;
       document.getElementById('origen').value = vuelo.origen;
       document.getElementById('destino').value = vuelo.destino;
       document.getElementById('fecha_hora_salida').value = vuelo.fecha_hora_salida.slice(0, 16);
       document.getElementById('fecha_hora_llegada').value = vuelo.fecha_hora_llegada.slice(0, 16);
       document.getElementById('estado_vuelo').value = vuelo.estado_vuelo;
       document.getElementById('id_avion').value = vuelo.id_avion;
       
       new bootstrap.Modal(document.getElementById('vueloModal')).show();
   } catch (error) {
       console.error('Error:', error);
       showError('Error al cargar los datos del vuelo');
   }
};

window.deleteVuelo = async function(id) {
    const confirmed = await showConfirm(
        '¿Estás seguro?',
        'El Vuelo será eliminado permanentemente'
    );

    if (confirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/vuelos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showSuccess('Avión eliminado exitosamente');
                loadAviones();
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
                        text: 'Este vuelo no puede ser eliminado porque está asociado a uno o más reservas. Debe eliminar primero todos las reservas asociados a este vuelo antes de poder eliminarlo.',
                        icon: 'warning',
                        confirmButtonColor: '#3085d6'
                    });
                } else {
                    showError(errorData.message || 'Error al eliminar el avión');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar el avión');
        }
    }
};

async function saveVuelo() {
   const formData = {
       numero_de_vuelo: document.getElementById('numero_de_vuelo').value,
       origen: parseInt(document.getElementById('origen').value),
       destino: parseInt(document.getElementById('destino').value),
       fecha_hora_salida: document.getElementById('fecha_hora_salida').value,
       fecha_hora_llegada: document.getElementById('fecha_hora_llegada').value,
       estado_vuelo: document.getElementById('estado_vuelo').value,
       id_avion: parseInt(document.getElementById('id_avion').value)
   };

   const token = localStorage.getItem('token');
   try {
       const url = editingId 
           ? `${config.API_URL}/vuelos/${editingId}`
           : `${config.API_URL}/vuelos`;
           
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
           bootstrap.Modal.getInstance(document.getElementById('vueloModal')).hide();
           showSuccess(editingId ? 'Vuelo actualizado exitosamente' : 'Vuelo creado exitosamente');
           loadVuelos();
       } else {
           const error = await response.json();
           showError(error.message || 'Error al guardar el vuelo');
       }
   } catch (error) {
       console.error('Error:', error);
       showError('Error al guardar el vuelo');
   }
}