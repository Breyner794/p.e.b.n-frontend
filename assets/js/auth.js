
export function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = '../../index.html';
        return null;
    }

    // Verificar si estamos en la ruta correcta según el rol
    const currentPath = window.location.pathname;
    
    if (user.rol === 1) { // Admin
        if (!currentPath.includes('/admin/')) {
            window.location.href = '../../pages/admin/dashboard.html';
        }
    } else { // Usuario normal
        if (!currentPath.includes('/user/')) {
            window.location.href = '../../pages/user/dashboard.html';
        }
    }

    return token;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../index.html';
}