import {
  saveForm,
  getForm,
  deletePedido,
  updatePedidos,
  getProducto,
  auth,
  getPedidos
} from "../firebase.js";
import { showMessage } from "../Logueo/showMessage.js";

const clientesTable = document.getElementById("table");

// Botón volver
const botonVolver = document.querySelector(".button-back");
botonVolver.addEventListener("click", async (e) => {
  e.preventDefault();
  window.location.href = "../Customers/tableCustomers.html";
});

function updateTable(querySnapshot) {
  let html = "<thead><tr>";
  const columnNames = [
    "Producto",
    "Cantidad",
    "Acciones"
  ];

  columnNames.forEach((columnName) => {
    const columnClass = columnName === 'Acciones' ? 'hidden' : '';
    html += `<th class="${columnClass}">${columnName}</th>`;

  });
  html += "</tr></thead><tbody>";

  querySnapshot.forEach((doc) => {
    const pedidoData = doc.data();


    html += `
      <tr>
        <td>${pedidoData.producto}</td>
        <td>${pedidoData.cantidad}</td>                
        <td>
          <button type="button" class="btn btn-success button-view" data-bs-toggle="modal" data-bs-target="#viewProducto" data-id="${doc.id}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Tooltip on top">
            <i class="fas fa-sharp fa-solid fa-eye"></i>
          </button>          
          <button type="button" class="btn btn-warning button-edit" data-bs-toggle="modal" data-bs-target="#editProducto" data-id="${doc.id}">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button type="button" class="btn btn-danger button-delete" data-id=${doc.id}>
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  });

  html += '</tbody>';
  clientesTable.innerHTML = html;

  const buttonView = clientesTable.querySelectorAll(".button-view");
  buttonView.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productoId = e.currentTarget.getAttribute("data-id");
      const productoData = await getProducto(productoId);
      if (productoData !== null) {
        showProductoModal(productoData);
      } else {
        console.log("Producto no encontrado");
      }
    });
  });
  function showProductoModal(productoData) {
    const nameElement = document.getElementById("name");
    const cantidadElement = document.getElementById("cantidad");

    nameElement.textContent = productoData.producto;
    cantidadElement.textContent = productoData.cantidad;


    const productoModal = document.getElementById("viewProducto");
    productoModal.classList.add("is-active");
  }

  const closeProductoModalButton = document.getElementById("closeViewModal");
  closeProductoModalButton.addEventListener("click", () => {
    const productoModal = document.getElementById("viewProducto");
    productoModal.classList.remove("is-active");
  })
  const buttonDelete = clientesTable.querySelectorAll(".button-delete");
  buttonDelete.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const pedidosId = e.currentTarget.getAttribute("data-id");
      await deletePedido(pedidosId);
      const newQuerySnapshot = await getPedidos();
      updateTable(newQuerySnapshot);
      showNotification("Producto Eliminado");
    });
  });

  const buttonUpDate = clientesTable.querySelectorAll(".button-edit");
  const editForm = document.getElementById("edit-form");

  buttonUpDate.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const pedidoId = e.currentTarget.getAttribute("data-id");
      const pedidoData = await getProducto(pedidoId);

      if (pedidoData !== null) {
        // Llenar el formulario con los datos existentes
        const editForm = document.getElementById("edit-form");
        editForm.elements["name"].value = pedidoData.producto;
        editForm.elements["cantidad"].value = pedidoData.cantidad;

        // Mostrar el formulario de edición
        const editModal = document.getElementById("editProducto");
        editModal.classList.add("is-active");

        // También puedes añadir el clienteId al formulario si lo necesitas después
        editForm.setAttribute("data-id", pedidoId);

        // Asegúrate de quitar el listener antes de agregarlo nuevamente
        // para evitar múltiples listeners en form.submit
        editForm.removeEventListener("submit", handleEditSubmit);

        // Agregar el evento submit al formulario
        editForm.addEventListener("submit", handleEditSubmit);
      } else {
        console.log("Producto no encontrado");
      }
    });
  });
  // Función que maneja el envío del formulario
  const handleEditSubmit = async (event) => {
    event.preventDefault();

    // Obtener el clienteId del formulario
    const pedidoId = event.currentTarget.getAttribute("data-id");

    // Obtener los nuevos datos del formulario
    const newData = {
      name: editForm.elements["name"].value,
      cantidad: editForm.elements["cantidad"].value
    };

    // Actualizar el cliente
    await updatePedidos(pedidoId, newData);

    // Cerrar el modal después de la edición 
    const editModal = document.getElementById("editProducto");
    editModal.classList.remove("is-active");

    // Actualizar la tabla después de la edición 
    const updatedQuerySnapshot = await getPedidos();
    updateTable(updatedQuerySnapshot);
    showNotification("Edición Correcta");
  };

  const deleteAll = document.getElementById("delete");

  deleteAll.addEventListener("click", async () => {
    const confirmacion = confirm("¿Estás seguro que deseas eliminar todo el pedido?");

    if (confirmacion) {
      try {
        // Obtén todas las consultas del cliente
        const querySnapshot = await getPedidos();
       

        // Elimina cada consulta
        await Promise.all(querySnapshot.docs.map(async (doc) => {
          await deletePedido(doc.id);;
        }));

        // Actualiza la tabla después de eliminar todas las consultas
        const updatedQuerySnapshot = await getPedidos();
        const pedidoDataList = updatedQuerySnapshot.docs.map((doc) => {
          const pedidoData = doc.data();
          return { ...pedidoData, id: doc.id };
        });


        updateTable(pedidoDataList);
        showNotification("El pedido se eliminó correctamente");
      } catch (error) {
        console.error("Error al eliminar el pedido:", error);
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

}

window.addEventListener("DOMContentLoaded", async (e) => {
  const querySnapshot = await getPedidos();
  updateTable(querySnapshot);
  const user = auth.currentUser;
  if (user) {
    const userName = user.displayName;
    const nameElement = document.getElementById("user-name");
    nameElement.textContent = userName;
  }
});

const searchButton = document.getElementById("searchButton");
searchButton.addEventListener("click", () => {
  const searchTerm = document.getElementById("searchInput").value;
  performSearch(searchTerm);
});

function performSearch(searchTerm) {
  const rows = document.querySelectorAll("#table tbody tr");
  searchTerm = searchTerm.toLowerCase();

  rows.forEach((row) => {
    const rowData = row.textContent.toLowerCase();
    if (rowData.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value;
  if (searchTerm === "") {
    resetTable();
  }
});

function resetTable() {
  const rows = document.querySelectorAll("#table tbody tr");
  rows.forEach((row) => {
    row.style.display = "";
  });
}

const buttonImprimir = document.getElementById("print");;

buttonImprimir.addEventListener("click", () => {
  // Abre la ventana de impresión
  window.print();
});