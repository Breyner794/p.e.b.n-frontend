import { config } from '../js/config.js';
import { checkAuth, logout } from '../js/auth.js';

let table;
let editingId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDataTable();
    loadEmpleados();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('saveEmpleado').addEventListener('click', saveEmpleado);
    
    // Resetear el formulario cuando se cierra el modal
    const empleadoModal = document.getElementById('empleadoModal');
    empleadoModal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('empleadoForm').reset();
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Nuevo Empleado';
    });
}

function initializeDataTable() {
    table = new DataTable('#empleadosTable', {
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        }
    });
}

async function loadEmpleados() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/empleados`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        table.clear();
        data.forEach(empleado => {
            table.row.add([
                empleado.id_usuario,
                empleado.nombre_de_usuario,
                empleado.email,
                empleado.id_rol === 1 ? 'Administrador' : 'Empleado',
                empleado.activo ? 'Activo' : 'Inactivo',
                createActionButtons(empleado)
            ]).draw(false);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar empleados');
    }
}

function createActionButtons(empleado) {
    return `
        <button class="btn btn-sm btn-warning me-1" onclick="editEmpleado(${empleado.id_usuario})">
            Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteEmpleado(${empleado.id_usuario})">
            Eliminar
        </button>
    `;
}

// Hacer las funciones de edición y eliminación globales
window.editEmpleado = async function(id) {
    editingId = id;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/empleados/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const empleado = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Editar Empleado';
        document.getElementById('empleadoId').value = empleado.id_usuario;
        document.getElementById('nombre').value = empleado.nombre_de_usuario;
        document.getElementById('email').value = empleado.email;
        document.getElementById('rol').value = empleado.id_rol;
        document.getElementById('activo').value = empleado.activo;
        
        // Mostrar el modal
        new bootstrap.Modal(document.getElementById('empleadoModal')).show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar datos del empleado');
    }
};

window.deleteEmpleado = async function(id) {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/empleados/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                loadEmpleados();
                alert('Empleado eliminado exitosamente');
            } else {
                alert('Error al eliminar empleado');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar empleado');
        }
    }
};

async function saveEmpleado() {
    const formData = {
        nombre_de_usuario: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        id_rol: document.getElementById('rol').value,
        activo: document.getElementById('activo').value === 'true'
    };

    const token = localStorage.getItem('token');
    try {
        const url = editingId 
            ? `${config.API_URL}/empleados/${editingId}`
            : `${config.API_URL}/empleados`;
            
        const method = editingId ? 'PUT' : 'POST';
        
        // Si estamos editando y no se proporcionó contraseña, la eliminamos del objeto
        if (editingId && !formData.password) {
            delete formData.password;
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('empleadoModal')).hide();
            loadEmpleados();
            alert(editingId ? 'Empleado actualizado exitosamente' : 'Empleado creado exitosamente');
        } else {
            const error = await response.json();
            alert(error.message || 'Error al guardar empleado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar empleado');
    }
}