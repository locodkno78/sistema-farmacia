import {
  deletePedido,
  updatePedidos,
  getProducto,
  auth,
  getPedidos
} from "../firebase.js";

const clientesTable = document.getElementById("table");

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

    let producto = "Desconocido"; // Valor por defecto
    let cantidad = "0"; // Valor por defecto

    // Verificar si existe el array de productos y si tiene elementos
    if (pedidoData.productos && Array.isArray(pedidoData.productos) && pedidoData.productos.length > 0) {
      // Caso con array de productos
      producto = pedidoData.productos.map(p => p.producto).join(", "); // Concatenar todos los productos
      cantidad = pedidoData.productos.map(p => p.cantidad).join(", "); // Concatenar todas las cantidades
    } else if (pedidoData.producto && pedidoData.cantidad) {
      // Caso con campos directos
      producto = pedidoData.producto;
      cantidad = pedidoData.cantidad;
    }

    html += `
      <tr>
        <td>${producto}</td>
        <td>${cantidad}</td>                
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

  // Listeners para los botones de ver y editar
  const buttonView = clientesTable.querySelectorAll(".button-view");
  buttonView.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const pedidoId = e.currentTarget.getAttribute("data-id");
      const pedidoData = await getProducto(pedidoId);
      if (pedidoData !== null) {
        showProductoModal(pedidoData);
      } else {
        console.log("Producto no encontrado");
      }
    });
  });

  function showProductoModal(pedidoData) {
    const nameElement = document.getElementById("name");
    const cantidadElement = document.getElementById("cantidad");

    if (pedidoData.productos && Array.isArray(pedidoData.productos)) {
      // Si el pedido tiene múltiples productos
      nameElement.textContent = pedidoData.productos.map(p => p.producto).join(", ");
      cantidadElement.textContent = pedidoData.productos.map(p => p.cantidad).join(", ");
    } else {
      // Si es un solo producto
      nameElement.textContent = pedidoData.producto || "Desconocido";
      cantidadElement.textContent = pedidoData.cantidad || "0";
    }

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

  let currentPedidoId = null; // Variable global para almacenar el ID del pedido en edición

const buttonUpDate = clientesTable.querySelectorAll(".button-edit");
const editForm = document.getElementById("edit-form");

buttonUpDate.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    currentPedidoId = e.currentTarget.getAttribute("data-id"); // Guardar el ID del pedido actual
    const pedidoData = await getProducto(currentPedidoId);

    if (pedidoData.productos && Array.isArray(pedidoData.productos) && pedidoData.productos.length > 0) {
      // Si hay múltiples productos, usa el primero como referencia
      editForm.elements["name"].value = pedidoData.productos[0].producto || "";
      editForm.elements["cantidad"].value = pedidoData.productos[0].cantidad || "0";
    } else {
      editForm.elements["name"].value = pedidoData.producto || "";
      editForm.elements["cantidad"].value = pedidoData.cantidad || "0";
    }
  });
});

// Función para manejar el envío del formulario de edición
const handleEditSubmit = async (event) => {
  event.preventDefault(); // Evita la recarga de la página

  if (!currentPedidoId) {
    alert("Error: No se ha seleccionado ningún pedido para editar.");
    return;
  }

  // Obtener los nuevos datos del formulario
  const newProducto = {
    producto: editForm.elements["name"].value,
    cantidad: parseInt(editForm.elements["cantidad"].value, 10),
  };

  try {
    const pedidoData = await getProducto(currentPedidoId); // Obtener datos actuales del pedido

    // Si el pedido tiene productos (array de productos), actualizamos el primero
    if (pedidoData.productos && Array.isArray(pedidoData.productos)) {
      pedidoData.productos[0] = newProducto; // Actualizamos el primer producto en el array
    } else {
      pedidoData.producto = newProducto.producto;
      pedidoData.cantidad = newProducto.cantidad;
    }

    // Actualizar el pedido con los nuevos datos
    await updatePedidos(currentPedidoId, pedidoData);

    // Cerrar el modal después de la edición 
    const editModal = document.getElementById("editProducto");
    editModal.classList.remove("is-active");

    // Actualizar la tabla después de la edición 
    const updatedQuerySnapshot = await getPedidos();
    updateTable(updatedQuerySnapshot);
    showNotification("Edición Correcta");
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    alert("Error al actualizar el pedido");
  }
};

// Agregar el evento submit al formulario de edición
editForm.addEventListener("submit", handleEditSubmit);


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