import { config } from "../js/config.js";    
    
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('errorAlert');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${config.API_URL}/auth/login`, { //modificar si es necesario ya que solo esta sirviendo con http local no con un .env
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar el token en localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redireccionar según el rol
                if (data.user.id_rol === 1) { // Admin
                    window.location.href = 'pages/admin/dashboard.html';
                } else { // Usuario normal
                    window.location.href = 'pages/user/dashboard.html';
                }
            } else {
                // Mostrar error
                errorAlert.textContent = data.message || 'Error al iniciar sesión';
                errorAlert.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error:', error);
            errorAlert.textContent = 'Error de conexión';
            errorAlert.classList.remove('d-none');
        }
    });
});

// Función para verificar si el usuario está autenticado
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
    }
    return token;
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}