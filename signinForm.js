import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { showMessage } from "./showMessage.js";

// Prevenir volver atrás desde la página de login
window.addEventListener('load', function() {
  // Reemplazar el estado actual para que no pueda volver atrás
  window.history.pushState(null, null, window.location.href);
});

window.addEventListener('popstate', function() {
  // Si intenta volver atrás, lo redirige al login
  window.history.pushState(null, null, window.location.href);
});

const signInForm = document.querySelector("#login-form");

signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  // Obtener los valores de los campos
  const username = signInForm["login-username"].value;
  const email = signInForm["login-email"].value;
  const password = signInForm["login-password"].value;

  // Verifica que los campos no estén vacíos
  if (!username || !email || !password) {
    showMessage("Por favor, complete todos los campos.", "error");
    return; // Detén la ejecución si falta algún campo
  }

  try {
    // Iniciar sesión con correo electrónico y contraseña
    const userCredentials = await signInWithEmailAndPassword(auth, email, password);

    // Verificar si el nombre de usuario coincide
    if (userCredentials.user.displayName === username) {
      console.log("Inicio de sesión exitoso");
      window.location.href = "./Customers/tableCustomers.html";
    } else {
      showMessage("El nombre de usuario es incorrecto", "error");
    }
  } catch (error) {
    if (error.code === "auth/wrong-password") {
      showMessage("Contraseña incorrecta", "error");
    } else if (error.code === "auth/user-not-found") {
      showMessage("El correo electrónico es inválido", "error");
    } else {
      showMessage("Algo salió mal. Inténtelo de nuevo.", "error");
    }
  }
});
