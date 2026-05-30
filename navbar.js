import { auth } from './firebase.js';
import { 
  signOut, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Función principal que se ejecuta al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
  loadNavbar().catch(error => {
    console.error('Error inicial:', error);
    showFallbackNavbar();
  });
});

// Carga el navbar y configura los listeners
async function loadNavbar() {
  try {
    const navbarUrl = new URL('./navbar.html', import.meta.url).href;
    const response = await fetch(navbarUrl);
    if (!response.ok) throw new Error('No se pudo cargar el navbar');
    
    const data = await response.text();
    const navbarContainer = document.getElementById('navbar-placeholder');
    
    if (!navbarContainer) {
      throw new Error('Contenedor del navbar no encontrado');
    }
    
    navbarContainer.innerHTML = data;
    
    // Configuración inicial
    setupNavbarListeners();
    setupRegistrationForm();
    updateUserInfo();
    
  } catch (error) {
    console.error('Error cargando navbar:', error);
    throw error; // Re-lanzamos el error para manejarlo en el catch principal
  }
}

// Actualiza la información del usuario en el navbar
function updateUserInfo() {
  const user = auth.currentUser;
  const nameElement = document.getElementById('user-name');
  const pharmacyElement = document.getElementById('pharmacy-name');
  
  if (!nameElement) return;

  if (user) {
    nameElement.textContent = user.displayName || user.email || 'Usuario';
    if (pharmacyElement) {
      pharmacyElement.style.display = 'inline-block';
    }
  } else if (pharmacyElement) {
    pharmacyElement.style.marginLeft = '0';
  }
}

// Configura los listeners del navbar
function setupNavbarListeners() {
  // Configuración de navegación
  const navButtons = {
    '.button-sales': '/Sales/sales.html',
    '.button-customers': '/Customers/tableCustomers.html',
    '.button-order': '/Orders/orders.html',
    '.button-products': '/Products/products.html'
  };

  Object.entries(navButtons).forEach(([selector, path]) => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = path;
      });
    } else {
      console.warn(`Botón no encontrado: ${selector}`);
    }
  });

  // Configuración de logout
  const logoutBtn = document.querySelector('#logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Maneja el cierre de sesión
async function handleLogout(e) {
  e.preventDefault();
  try {
    await signOut(auth);
    window.location.href = "/Logueo/login.html";
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    showNotification('Error al cerrar sesión', 'error');
  }
}

// Configura el formulario de registro de usuarios
function setupRegistrationForm() {
  const signupForm = document.getElementById('signup-form');
  
  if (!signupForm) return;
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    if (!username || !email || !password) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    try {
      // Crear usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar perfil
      await updateProfile(userCredential.user, {
        displayName: username
      });
      
      // Actualizar UI
      updateUserInfo();
      
      // Cerrar modal y limpiar formulario
      const modal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
      if (modal) modal.hide();
      signupForm.reset();
      
      showNotification('Usuario registrado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error en registro:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  });
}

// Muestra notificaciones al usuario
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
  notification.style.zIndex = '1100';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

// Navbar de respaldo si falla la carga
function showFallbackNavbar() {
  const navbarContainer = document.getElementById('navbar-placeholder') || document.body;
  navbarContainer.innerHTML = `
    <nav class="navbar navbar-expand-lg bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand text-white" href="/">Sistema</a>
        <div class="d-flex">
          <a href="/Customers/tableCustomers.html" class="btn btn-secondary mx-1">Clientes</a>
          <a href="/Sales/sales.html" class="btn btn-primary mx-1">Ventas</a>
          <a href="/Logueo/login.html" class="btn btn-light mx-1">Login</a>
        </div>
      </div>
    </nav>
  `;
}