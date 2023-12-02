import {
  saveForm,
  getForm,
  deleteCliente,
  updatePedidos,
  getCliente,
  auth,
  getPedidos
} from "../firebase.js";

const clientesTable = document.getElementById("table");

// Botón volver
const botonVolver = document.querySelector(".button-back");
botonVolver.addEventListener("click", async (e) => {
  e.preventDefault();
  window.location.href = "../Customers/tableCustomers.html";
});

function updateTable(querySnapshot) {
  const columnNames = [
    "Producto",
    "Cantidad",    
    "Acciones"
  ];
  let html = `
    <thead>
      <tr>${columnNames.map(columnName => `<th>${columnName}</th>`).join('')}</tr>
    </thead>
    <tbody>`;

  querySnapshot.forEach((doc) => {
    const pedidoData = doc.data();

    html += `
      <tr>
        <td>${pedidoData.producto}</td>
        <td>${pedidoData.cantidad}</td>                
        <td>
          <button type="button" class="btn btn-success button-view" data-bs-toggle="modal" data-bs-target="#viewCustomer" data-id="${doc.id}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Tooltip on top">
            <i class="fas fa-sharp fa-solid fa-eye"></i>
          </button>          
          <button type="button" class="btn btn-warning button-edit" data-bs-toggle="modal" data-bs-target="#editCustomer" data-id="${doc.id}">
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