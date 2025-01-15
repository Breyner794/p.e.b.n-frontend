import { config } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) { // Verificar si estamos en la página de login
        const errorAlert = document.getElementById('errorAlert');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${config.API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Respuesta completa:', data);
                    console.log('Rol del usuario:', data.user.id_rol);
                    console.log('Datos del usuario:', data.user); // Para debugging
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Redireccionar según el rol
                    if (data.user.rol === 1) { // Admin
                        window.location.href = '/frontend/pages/admin/dashboard.html';
                    } else { // Usuario normal
                        window.location.href = '/frontend/pages/user/dashboard.html';
                    }
                } else {
                    errorAlert.textContent = data.message || 'Error al iniciar sesión';
                    errorAlert.classList.remove('d-none');
                }
            } catch (error) {
                console.error('Error:', error);
                errorAlert.textContent = 'Error de conexión';
                errorAlert.classList.remove('d-none');
            }
        });
    }
});