import { db, collection, addDoc, getDocs, getConsulta, pedidosForm, consultaForm, getHistorial, deleteConsulta, updateConsulta } from "../firebase.js";

// Función de búsqueda de productos
document.getElementById("searchButton").addEventListener("click", async () => {
  const searchInput = document.getElementById("searchInput").value.trim().toLowerCase();
  if (searchInput === "") {
      alert("Ingrese un nombre de producto para buscar.");
      return;
  }

  try {
      const productosRef = collection(db, "productos");
      const querySnapshot = await getDocs(productosRef);

      let productosEncontrados = [];

      querySnapshot.forEach(doc => {
          let producto = doc.data();
          if (producto.name.toLowerCase().includes(searchInput)) {
              productosEncontrados.push({ id: doc.id, ...producto });
          }
      });

      if (productosEncontrados.length > 0) {
          mostrarProductosEnModal(productosEncontrados);
      } else {
          alert("No se encontraron productos.");
      }
  } catch (error) {
      console.error("Error al buscar productos:", error);
  }
});

function mostrarProductosEnModal(productos) {
  let modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = "";

  productos.forEach(producto => {
      let div = document.createElement("div");
      div.classList.add("producto-item", "p-2", "border", "mb-2", "d-flex", "justify-content-between");
      div.innerHTML = `
          <span>${producto.name} - $${producto.price}</span>
          <button class="btn btn-primary btn-sm seleccionar-producto" data-nombre="${producto.name}" data-precio="${producto.price}">Seleccionar</button>
      `;
      modalBody.appendChild(div);
  });

  let modal = new bootstrap.Modal(document.getElementById("productModal"));
  modal.show();

  document.querySelectorAll(".seleccionar-producto").forEach(button => {
      button.addEventListener("click", function() {
          let nombre = this.getAttribute("data-nombre");
          let precio = this.getAttribute("data-precio");

          // Asignar valores a los campos del formulario
          document.querySelector("input[name='producto']").value = nombre;
          document.querySelector("input[name='precio']").value = precio;

          modal.hide();
      });
  });
}

// Array para almacenar los productos agregados a la tabla
let productosEnTabla = [];

// Obtiene y muestra el nombre y apellido
const urlParams = new URLSearchParams(window.location.search);
const apellidoCliente = urlParams.get("apellido");
const nombreCliente = urlParams.get("nombre");
const dniCliente = urlParams.get("dni");
const dateCliente = urlParams.get("date");
const osCliente = urlParams.get("obraSocial");


function calcularEdad(fechaNacimiento) {
  const fechaNac = new Date(fechaNacimiento);
  const fechaActual = new Date();

  let edad = fechaActual.getFullYear() - fechaNac.getFullYear();
  const mesActual = fechaActual.getMonth() + 1;
  const mesNacimiento = fechaNac.getMonth() + 1;

  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && fechaActual.getDate() < fechaNac.getDate())) {
    edad--;
  }

  return edad;
}

// Obtener la fecha de nacimiento desde clientesData.date 
const fechaNacimientoCliente = dateCliente; // Reemplaza esto con la fecha de nacimiento real

// Calcular la edad
const edadCliente = calcularEdad(fechaNacimientoCliente);

// Encuentra el elemento donde deseas mostrar el nombre y establece su contenido
const customerElement = document.getElementById("customer");
customerElement.textContent = `${apellidoCliente} ${nombreCliente} - DNI: ${dniCliente} - ${osCliente} - ${edadCliente} años`;

// Botón volver
const botonVolver = document.querySelector(".buttom-back");
botonVolver.addEventListener("click", function () {
  window.location.href = "../Customers/tableCustomers.html";
});
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const form = document.getElementById("form-control");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evitar el envío automático del formulario

    const fechaCompra = form.querySelector('input[type="date"]').value;
    const cantidad = form.querySelector('input[name="cantidad"]').value;
    const producto = form.querySelector('input[name="producto"]').value;
    const precio = form.querySelector('input[name="precio"]').value;
    const precioT = cantidad * precio;
    const detalles = form.querySelector('textarea[name="detalles"]').value;

    if (!fechaCompra || !producto || !cantidad || !precio) {
      // Muestra un mensaje de error o realiza alguna acción adecuada si falta información
      console.error("Todos los campos son obligatorios");
      return;
    }

    const clienteId = urlParams.get("clienteId");

    if (clienteId) {
      // Utiliza la función consultaForm para agregar una consulta
      await consultaForm(clienteId, fechaCompra, producto, precio, cantidad, precioT, detalles);
      
      // Utiliza la función pedidosForm para agregar un pedido
      await pedidosForm(producto, cantidad);
      
      showNotification("Compra agregada correctamente");
      form.reset();
      window.location.reload();
    } else {
      console.error("ID del cliente no encontrado");
    }
    function showNotification(message) {
      const notificationElement = document.getElementById("notification");
      notificationElement.textContent = message;
  
      // Agrega estilos de diseño o clases 
      notificationElement.style.backgroundColor = "#08C706"; // Fondo verde
      notificationElement.style.color = "white"; // Texto blanco
      notificationElement.style.fontSize = "30px";
  
      // Muestra la notificación por 3 segundos
      setTimeout(() => {
        notificationElement.textContent = "";
      }, 3000);
    }
  });
});


// Obtiene la URL actual
const url = new URL(window.location.href);

// Obtiene el valor del parámetro "clienteId" de la URL
const clienteId = url.searchParams.get("clienteId");

const clientesTable = document.getElementById("tableCliente");
//carga la tabla con datos
function updateTable(consultaDataList) {
  let html = "<thead><tr>";
  const columnNames = [
    "Fecha",
    "Producto",
    "Precio",
    "Cantidad",
    "Precio Total",
    "Detalles",
    "Acciones"
  ];
  columnNames.forEach((columnName) => {
    const columnClass = columnName === 'Acciones' ? 'hidden' : '';
    html += `<th class="${columnClass}">${columnName}</th>`;

  });
  html += "</tr></thead><tbody>";
  consultaDataList.forEach((consultaData) => {
    // Formatear la fecha como día/mes/año
    const fechaCompra = new Date(consultaData.fechaCompra);
    const formattedFecha = fechaCompra.toLocaleDateString('es-ES', { timeZone: 'UTC' });
    // Truncar el contenido de la columna "Detalles" a una línea
    const detalles = consultaData.detalles.length > 20 ? consultaData.detalles.substring(0, 20) + '...' : consultaData.detalles;
    const precioT = consultaData.cantidad * consultaData.precio;

    html += `        
            <tr>
                <td>${formattedFecha}</td>
                <td>${consultaData.producto}</td>
                <td>${consultaData.precio}</td>                
                <td>${consultaData.cantidad}</td>
                <td>${precioT.toFixed(2)}</td>
                <td>${detalles}</td>                
                <td>
                  <button type="button" class="btn btn-success button-view" data-id="${consultaData.id}" data-bs-toggle="modal" data-bs-target="#viewConsulta">
                    <i class="fas fa-sharp fa-solid fa-eye"></i>
                  </button>
                  <button type="button" class="btn btn-warning button-edit" data-bs-toggle="modal" data-bs-target="#editConsulta" data-id="${consultaData.id}">
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button type="button" class="btn btn-danger button-delete" data-id="${consultaData.id}">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
            </tr>
        `;
  });
  html += "</tbody>";
  clientesTable.innerHTML = html;

  const totalPrecio = consultaDataList.reduce((total, consultaData) => {
    const precioT = consultaData.cantidad * consultaData.precio;
    if (!isNaN(precioT)) {
      return total + precioT;
    } else {
      return total;
    }
  }, 0);

  // Ahora, actualiza la tabla total
  function updateTotalTable(totalPrecio) {
    const totalTable = document.getElementById("tableTotal");

    // Crear una fila en la tabla total con la suma
    let html = "<thead><tr><th>Total Cuenta</th></tr></thead><tbody>";
    html += `<tr><td>$${totalPrecio.toFixed(2)}</td></tr></tbody>`;

    totalTable.innerHTML = html;
  }
  updateTotalTable(totalPrecio);

  const buttonView = clientesTable.querySelectorAll(".button-view");

  buttonView.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const consultasId = e.currentTarget.getAttribute("data-id");
      const consultaData = await getHistorial(clienteId, consultasId);
      if (consultaData !== null) {
        // Mostrar los datos de la consulta en un modal
        showConsultaModal(consultaData);
      } else {
        console.log("Consulta no encontrada");
      }
    });
  });
  const editForm = document.getElementById("edit-consulta");
  const buttonUpDate = clientesTable.querySelectorAll(".button-edit");
  buttonUpDate.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const consultasId = e.currentTarget.getAttribute("data-id");
      const consultaData = await getHistorial(clienteId, consultasId);

      if (consultaData !== null) {
        // Llenar el formulario con los datos existentes

        editForm.elements["fechaCompra"].value = consultaData.fechaCompra;
        editForm.elements["producto"].value = consultaData.producto;
        editForm.elements["precio"].value = consultaData.precio;
        editForm.elements["cantidad"].value = consultaData.cantidad;
        editForm.elements["detalles"].value = consultaData.detalles;

        // Mostrar el formulario de edición
        const editModal = document.getElementById("editConsulta");
        editModal.classList.add("is-active");

        // También puedes añadir el clienteId al formulario si lo necesitas después
        editForm.setAttribute("data-cliente-id", clienteId);
        editForm.setAttribute("data-consultas-id", consultasId);
        
        editForm.removeEventListener("submit", handleEditSubmit);

        // Agregar el evento submit al formulario
        editForm.addEventListener("submit", handleEditSubmit);
      } else {
        console.log("Cliente no encontrado");
      }
    });
  });


  // Función que maneja el envío del formulario
  const handleEditSubmit = async (event) => {
    event.preventDefault();

    // Obtener el clienteId y consultasId del formulario
    const clienteId = editForm.getAttribute("data-cliente-id");
    const consultasId = editForm.getAttribute("data-consultas-id");

    // Obtener los nuevos datos del formulario
    const newData = {
      fechaCompra: editForm.elements["fechaCompra"].value,
      producto: editForm.elements["producto"].value,
      precio: editForm.elements["precio"].value,
      cantidad: editForm.elements["cantidad"].value,
      detalles: editForm.elements["detalles"].value,
    };
    const precio = parseFloat(newData.precio);
    const cantidad = parseFloat(newData.cantidad);
    newData.precioT = isNaN(precio) || isNaN(cantidad) ? 0 : precio * cantidad;

    newData.precio = precio;

    // Actualizar la consulta
    await updateConsulta(clienteId, consultasId, newData);
    console.log("consulta actualizada")
    // Cerrar el modal después de la edición 
    const editModal = document.getElementById("editConsulta");
    editModal.classList.remove("is-active");

    // Actualizar la tabla después de la edición 
    const updatedQuerySnapshot = await getConsulta(clienteId, consultasId);
    showNotification("Coompra actualizada correctamente");
    const consultaDataList = updatedQuerySnapshot.docs.map((doc) => {
      const consultaData = doc.data();
      return { ...consultaData, id: doc.id };
    });

    consultaDataList.sort((a, b) => {
      const fechaA = new Date(a.fechaCompra);
      const fechaB = new Date(b.fechaCompra);
      return fechaB - fechaA;
    });
    updateTable(consultaDataList);
  };


  const buttonDelete = clientesTable.querySelectorAll(".button-delete");
  buttonDelete.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const consultasId = e.currentTarget.getAttribute("data-id");
      await deleteConsulta(clienteId, consultasId);
      const updatedQuerySnapshot = await getConsulta(clienteId);
      showNotification("Compra eliminada correctamente");
      const consultaDataList = updatedQuerySnapshot.docs.map((doc) => {
        const consultaData = doc.data();
        return { ...consultaData, id: doc.id };
      });

      consultaDataList.sort((a, b) => {
        const fechaA = new Date(a.fechaCompra);
        const fechaB = new Date(b.fechaCompra);
        return fechaB - fechaA;
      });
      updateTable(consultaDataList);
    });
  });

  const deleteAll = document.getElementById("delete");

  deleteAll.addEventListener("click", async () => {
    const confirmacion = confirm("¿Estás seguro que deseas eliminar toda la cuenta?");

    if (confirmacion) {
      try {
        // Obtén todas las consultas del cliente
        const querySnapshot = await getConsulta(clienteId);
        const consultasIdList = querySnapshot.docs.map((doc) => doc.id);

        // Elimina cada consulta
        await Promise.all(consultasIdList.map(async (consultasId) => {
          await deleteConsulta(clienteId, consultasId);
        }));

        // Actualiza la tabla después de eliminar todas las consultas
        const updatedQuerySnapshot = await getConsulta(clienteId);
        const consultaDataList = updatedQuerySnapshot.docs.map((doc) => {
          const consultaData = doc.data();
          return { ...consultaData, id: doc.id };
        });

        consultaDataList.sort((a, b) => {
          const fechaA = new Date(a.fechaCompra);
          const fechaB = new Date(b.fechaCompra);
          return fechaB - fechaA;
        });

        updateTable(consultaDataList);
        showNotification("La cuenta se eliminó correctamente");
      } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
      }
    }
  });
  // Función para mostrar la notificación
  function showNotification(message) {
    const notificationElement = document.getElementById("notification");
    notificationElement.textContent = message;

    // Agrega estilos de diseño o clases 
    notificationElement.style.backgroundColor = "#08C706"; // Fondo verde
    notificationElement.style.color = "white"; // Texto blanco
    notificationElement.style.fontSize = "30px";

    // Muestra la notificación por 3 segundos
    setTimeout(() => {
      notificationElement.textContent = "";
    }, 3000);
  }
  // Esta función muestra los datos de la consulta en un modal
  function showConsultaModal(consultaData) {
    const fechaCompraElement = document.getElementById("fechaCompra");
    const productoElement = document.getElementById("producto");
    const precioElement = document.getElementById("precio");
    const cantidadElement = document.getElementById("cantidad");
    const precioTElement = document.getElementById("precioT");
    const detallesElement = document.getElementById("detalles");

    if (fechaCompraElement) {
      fechaCompraElement.textContent = consultaData.fechaCompra;
    }

    if (productoElement) {
      productoElement.textContent = consultaData.producto;
    }

    if (precioElement) {
      precioElement.textContent = consultaData.precio;
    }

    if (cantidadElement) {
      cantidadElement.textContent = consultaData.cantidad;
    }

    if (precioElement) {
      precioTElement.textContent = consultaData.precioT.toFixed(2);
    }

    if (detallesElement) {
      detallesElement.textContent = consultaData.detalles;
    }

    const consultaModal = document.getElementById("viewConsulta");
    consultaModal.classList.add("is-active");
  }
}

window.addEventListener("DOMContentLoaded", async (e) => {
  try {
    const querySnapshot = await getConsulta(clienteId); // Obtiene los datos de las consultas
    const consultaDataList = querySnapshot.docs.map((doc) => {
      const consultaData = doc.data();
      return { ...consultaData, id: doc.id };
    });
    // Ordenar los datos por fecha en orden descendente
    consultaDataList.sort((a, b) => {
      const fechaA = new Date(a.fechaCompra);
      const fechaB = new Date(b.fechaCompra);
      return fechaB - fechaA;
    });
    updateTable(consultaDataList); // Actualiza la tabla con los datos de las consultas ordenados
  } catch (error) {
    console.error("Error al obtener datos de las consultas:", error);
  }
});

const buttonImprimir = document.getElementById("print");;

buttonImprimir.addEventListener("click", () => {
  // Abre la ventana de impresión
  window.print();
});

