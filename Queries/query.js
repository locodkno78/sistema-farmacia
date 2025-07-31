import {
  db,
  collection,
  addDoc,
  getDocs,
  getConsulta,
  pedidosForm,
  consultaForm,
  getHistorial,
  deleteConsulta,
  updateConsulta,
  updateProductStock
} from "../firebase.js";

const urlParams = new URLSearchParams(window.location.search);
const clienteId = urlParams.get("clienteId");
const apellidoCliente = urlParams.get("apellido");
const nombreCliente = urlParams.get("nombre");
const dniCliente = urlParams.get("dni");
const dateCliente = urlParams.get("date");
const osCliente = urlParams.get("obraSocial");

function calcularEdad(fechaNacimiento) {
  const fechaNac = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
  return edad;
}

// Mostrar datos del cliente
const customerElement = document.getElementById("customer");
customerElement.textContent = `${apellidoCliente} ${nombreCliente} - DNI: ${dniCliente} - ${osCliente} - ${calcularEdad(dateCliente)} años`;

// Botón volver
const botonVolver = document.querySelector(".buttom-back");
botonVolver.addEventListener("click", () => {
  window.location.href = "../Customers/tableCustomers.html";
});

// Buscar productos
const searchButton = document.getElementById("searchButton");
searchButton.addEventListener("click", async () => {
  const searchInput = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!searchInput) return alert("Ingrese un nombre de producto para buscar.");

  try {
    const productosSnapshot = await getDocs(collection(db, "productos"));
    const productosEncontrados = productosSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.name.toLowerCase().includes(searchInput));

    productosEncontrados.length > 0
      ? mostrarProductosEnModal(productosEncontrados)
      : alert("No se encontraron productos.");
  } catch (err) {
    console.error("Error al buscar productos:", err);
  }
});

function mostrarProductosEnModal(productos) {
  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = productos.map(producto => `
    <div class="producto-item p-2 border mb-2 d-flex justify-content-between">
      <span>${producto.name} - $${producto.price}</span>
      <button class="btn btn-primary btn-sm seleccionar-producto" data-nombre="${producto.name}" data-precio="${producto.price}">Seleccionar</button>
    </div>`
  ).join("");

  const modal = new bootstrap.Modal(document.getElementById("productModal"));
  modal.show();

  document.querySelectorAll(".seleccionar-producto").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelector("input[name='producto']").value = button.dataset.nombre;
      document.querySelector("input[name='precio']").value = button.dataset.precio;
      modal.hide();
    });
  });
}

// Envío del formulario de consulta (compra)
const form = document.getElementById("form-control");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fechaCompra = form.querySelector("input[type='date']").value;
  const cantidad = parseInt(form.querySelector("input[name='cantidad']").value, 10);
  const producto = form.querySelector("input[name='producto']").value;
  const precio = parseFloat(form.querySelector("input[name='precio']").value);
  const detalles = form.querySelector("textarea[name='detalles']").value;
  const precioT = cantidad * precio;

  if (!fechaCompra || !producto || !cantidad || !precio) {
    return console.error("Todos los campos son obligatorios");
  }

  if (!clienteId) {
    return console.error("ID del cliente no encontrado");
  }

  try {
    // Guardar consulta
    await consultaForm(clienteId, fechaCompra, producto, precio, cantidad, precioT, detalles);

    // Guardar pedido
    await pedidosForm(producto, cantidad);

    // Actualizar stock del producto vendido
    await updateProductStock(producto, cantidad);

    mostrarNotificacion("Compra registrada y stock actualizado correctamente");
    form.reset();
    cargarConsultas(); // Actualizar tabla para reflejar la compra
  } catch (error) {
    console.error("Error al registrar compra:", error);
    alert("Error al registrar compra: " + error.message);
  }
});

function mostrarNotificacion(message) {
  const notificationElement = document.getElementById("notification");
  notificationElement.textContent = message;
  notificationElement.style.backgroundColor = "#08C706";
  notificationElement.style.color = "white";
  notificationElement.style.fontSize = "30px";

  setTimeout(() => {
    notificationElement.textContent = "";
  }, 3000);
}

function mostrarModalConsulta(data) {
  document.getElementById("fechaCompra").textContent = data.fechaCompra;
  document.getElementById("producto").textContent = data.producto;
  document.getElementById("precio").textContent = data.precio;
  document.getElementById("cantidad").textContent = data.cantidad;
  document.getElementById("precioT").textContent = data.precioT.toFixed(2);
  document.getElementById("detalles").textContent = data.detalles;

  document.getElementById("viewConsulta").classList.add("is-active");
}

async function cargarConsultas() {
  try {
    const querySnapshot = await getConsulta(clienteId);
    const consultas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    consultas.sort((a, b) => new Date(b.fechaCompra) - new Date(a.fechaCompra));
    renderizarTabla(consultas);
  } catch (err) {
    console.error("Error al obtener datos de las consultas:", err);
  }
}

function renderizarTabla(data) {
  const tabla = document.getElementById("tableCliente");
  let html = `
    <thead><tr>
      <th>Fecha</th><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Precio Total</th><th>Detalles</th><th>Acciones</th>
    </tr></thead><tbody>`;

  data.forEach(c => {
    const fecha = new Date(c.fechaCompra).toLocaleDateString("es-ES", { timeZone: "UTC" });
    const detalles = c.detalles.length > 20 ? c.detalles.substring(0, 20) + "..." : c.detalles;
    html += `
      <tr>
        <td>${fecha}</td><td>${c.producto}</td><td>${c.precio}</td><td>${c.cantidad}</td>
        <td>${(c.precio * c.cantidad).toFixed(2)}</td><td>${detalles}</td>
        <td>
          <button class="btn btn-success button-view" data-id="${c.id}" data-bs-toggle="modal" data-bs-target="#viewConsulta"><i class="fas fa-eye"></i></button>
          <button class="btn btn-warning button-edit" data-id="${c.id}" data-bs-toggle="modal" data-bs-target="#editConsulta"><i class="fas fa-pencil-alt"></i></button>
          <button class="btn btn-danger button-delete" data-id="${c.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
  });
  html += "</tbody>";
  tabla.innerHTML = html;

  const total = data.reduce((acc, c) => acc + (c.precio * c.cantidad), 0);
  document.getElementById("tableTotal").innerHTML = `
    <thead><tr><th>Total Cuenta</th></tr></thead><tbody>
    <tr><td>$${total.toFixed(2)}</td></tr></tbody>`;

  agregarEventosTabla();
}

function agregarEventosTabla() {
  document.querySelectorAll(".button-view").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const data = await getHistorial(clienteId, id);
      if (data) mostrarModalConsulta(data);
    });
  });

  document.querySelectorAll(".button-edit").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const data = await getHistorial(clienteId, id);
      if (data) llenarFormularioEdicion(data, id);
    });
  });

  document.querySelectorAll(".button-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteConsulta(clienteId, id);
      cargarConsultas();
      mostrarNotificacion("Compra eliminada correctamente");
    });
  });

  document.getElementById("delete").addEventListener("click", async () => {
    if (confirm("¿Estás seguro que deseas eliminar toda la cuenta?")) {
      const snapshot = await getConsulta(clienteId);
      await Promise.all(snapshot.docs.map(doc => deleteConsulta(clienteId, doc.id)));
      cargarConsultas();
      mostrarNotificacion("La cuenta se eliminó correctamente");
    }
  });
}

function llenarFormularioEdicion(data, id) {
  const form = document.getElementById("edit-consulta");
  form.fechaCompra.value = data.fechaCompra;
  form.producto.value = data.producto;
  form.precio.value = data.precio;
  form.cantidad.value = data.cantidad;
  form.detalles.value = data.detalles;
  form.setAttribute("data-id", id);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const newData = {
      fechaCompra: form.fechaCompra.value,
      producto: form.producto.value,
      precio: parseFloat(form.precio.value),
      cantidad: parseFloat(form.cantidad.value),
      detalles: form.detalles.value,
      precioT: parseFloat(form.precio.value) * parseFloat(form.cantidad.value)
    };

    await updateConsulta(clienteId, id, newData);
    document.getElementById("editConsulta").classList.remove("is-active");
    cargarConsultas();
    mostrarNotificacion("Compra actualizada correctamente");
  };
}

// Imprimir
const buttonImprimir = document.getElementById("print");
buttonImprimir.addEventListener("click", () => window.print());

window.addEventListener("DOMContentLoaded", cargarConsultas);
