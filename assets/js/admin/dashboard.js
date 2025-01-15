import { config } from '../../js/config.js';
import { checkAuth, logout } from '../../js/auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuth();
    
    // Configurar evento de logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Cargar datos del usuario
    loadUserInfo();
    
    // Cargar estadísticas
    loadDashboardStats();
});

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.nombre;
    }
}

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateDashboardUI(stats);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function updateDashboardUI(stats) {
    document.getElementById('totalEmpleados').textContent = stats.totalEmpleados || 0;
    document.getElementById('vuelosActivos').textContent = stats.vuelosActivos || 0;
    document.getElementById('reservasHoy').textContent = stats.reservasHoy || 0;
}