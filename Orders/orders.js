import {
  getPedidos,
  resetProductoPedidos
} from "../firebase.js";

const clientesTable = document.getElementById("table");

// Función para actualizar la tabla de pedidos acumulados
function updateTable(querySnapshot) {
  let html = "<thead><tr>";
  const columnNames = ["Producto", "Cantidad", "Acciones"];

  columnNames.forEach((columnName) => {
    html += `<th>${columnName}</th>`;
  });
  html += "</tr></thead><tbody>";

  const productosAcumulados = {};

  querySnapshot.forEach((doc) => {
    const pedidoData = doc.data();

    if (pedidoData.productos && Array.isArray(pedidoData.productos)) {
      // Formato nuevo con array de productos
      pedidoData.productos.forEach((item) => {
        const cantidad = parseInt(item.cantidad, 10);
        if (!isNaN(cantidad)) {
          if (!productosAcumulados[item.producto]) {
            productosAcumulados[item.producto] = 0;
          }
          productosAcumulados[item.producto] += cantidad;
        }
      });
    } else if (pedidoData.producto && pedidoData.cantidad) {
      // Formato antiguo con producto y cantidad directos
      const cantidad = parseInt(pedidoData.cantidad, 10);
      if (!isNaN(cantidad)) {
        if (!productosAcumulados[pedidoData.producto]) {
          productosAcumulados[pedidoData.producto] = 0;
        }
        productosAcumulados[pedidoData.producto] += cantidad;
      }
    }
  });

  Object.keys(productosAcumulados).forEach((producto) => {
    html += `
      <tr>
        <td>${producto}</td>
        <td>${productosAcumulados[producto]}</td>
        <td>
          <button type="button" class="btn btn-danger button-delete" data-producto="${producto}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  });

  html += "</tbody>";
  clientesTable.innerHTML = html;

  // Listeners para eliminar producto
  const buttonDelete = clientesTable.querySelectorAll(".button-delete");
  buttonDelete.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productoNombre = e.currentTarget.getAttribute("data-producto");
      if (confirm(`¿Estás seguro de eliminar todas las existencias de ${productoNombre}?`)) {
        await resetProductoPedidos(productoNombre);
        const updatedQuerySnapshot = await getPedidos();
        updateTable(updatedQuerySnapshot);
      }
    });
  });
}

// 🔄 Cargar la tabla al iniciar
window.addEventListener("DOMContentLoaded", async () => {
  const querySnapshot = await getPedidos();
  updateTable(querySnapshot);
});



// Notificación simple
function showNotification(message) {
  const notificationElement = document.getElementById("notification");
  if (!notificationElement) return;
  notificationElement.textContent = message;
  notificationElement.style.backgroundColor = "#08C706";
  notificationElement.style.color = "white";
  notificationElement.style.fontSize = "20px";

  setTimeout(() => {
    notificationElement.textContent = "";
  }, 3000);
}

// Carga inicial
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const querySnapshot = await getPedidos();
    console.log("Cantidad de pedidos:", querySnapshot.docs.length); // ✅ esto te dice si llegan datos

    // Mostrar el contenido por consola
    querySnapshot.forEach(doc => {
      console.log("Pedido:", doc.data());
    });

    updateTable(querySnapshot);
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
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
    row.style.display = rowData.includes(searchTerm) ? "" : "none";
  });
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  if (searchInput.value === "") {
    resetTable();
  }
});

function resetTable() {
  const rows = document.querySelectorAll("#table tbody tr");
  rows.forEach((row) => {
    row.style.display = "";
  });
}

const buttonImprimir = document.getElementById("print");
buttonImprimir.addEventListener("click", () => {
  window.print();
});
