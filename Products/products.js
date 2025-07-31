import {
    saveFormProd,
    getFormProd,
    deleteProduct,
    getProduct,
    updateProduct,
    auth,
  } from "../firebase.js";
  
  const clientesTable = document.getElementById("table");
  const openModal = document.getElementById("openRegisterModal");
  const modal = document.getElementById("newCustomer");
  const closeModal = document.getElementById("closeRegisterModal");
  const registerForm = document.getElementById("register-form");
  const editForm = document.getElementById("edit-form");
  
  const showNotification = (message) => {
    const notificationElement = document.getElementById("notification");
    notificationElement.textContent = message;
    notificationElement.style.backgroundColor = "#08C706";
    notificationElement.style.color = "white";
    notificationElement.style.fontSize = "30px";
    setTimeout(() => (notificationElement.textContent = ""), 3000);
  };
  
  const resetTable = () => {
    document.querySelectorAll("#table tbody tr").forEach((row) => (row.style.display = ""));
  };
  
  const performSearch = (searchTerm) => {
    const rows = document.querySelectorAll("#table tbody tr");
    searchTerm = searchTerm.toLowerCase();
    rows.forEach((row) => {
      const rowData = row.textContent.toLowerCase();
      row.style.display = rowData.includes(searchTerm) ? "" : "none";
    });
  };
  
  const showProductModal = (productData) => {
    const fields = ["name", "quantity", "price", "stock", "drug"];
    fields.forEach((field) => {
      const el = document.getElementById(field);
      if (el) el.textContent = productData[field] || "No disponible";
    });
    const modalElement = document.getElementById("viewProduct");
    if (modalElement) bootstrap.Modal.getOrCreateInstance(modalElement).show();
  };
  
  const fillEditForm = (productData, productId) => {
    Object.keys(productData).forEach((key) => {
      if (editForm.elements[key]) editForm.elements[key].value = productData[key];
    });
    editForm.setAttribute("data-id", productId);
    document.getElementById("editProducto").classList.add("is-active");
  };
  
  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const productId = editForm.getAttribute("data-id");
    const newData = Object.fromEntries(
      ["name", "quantity", "price", "stock", "drug"].map((field) => [field, editForm.elements[field].value])
    );
    await updateProduct(productId, newData);
    document.getElementById("editProducto").classList.remove("is-active");
    updateTable(await getFormProd());
    showNotification("Edición Correcta");
  };
  
  const updateTable = (querySnapshot) => {
    const columns = ["Nombre", "Cantidad", "Precio", "Stock", "Componentes", "Acciones"];
    let html = `<thead><tr>${columns.map((col) => `<th>${col}</th>`).join("")}</tr></thead><tbody>`;
  
    querySnapshot.forEach((doc) => {
      const p = doc.data();
      html += `
        <tr>
          <td>${p.name}</td>
          <td>${p.quantity}</td>
          <td>${p.price}</td>
          <td>${p.stock}</td>
          <td>${p.drug}</td>
          <td>
            <button class="btn btn-success button-view" data-id="${doc.id}" data-bs-toggle="modal" data-bs-target="#viewProduct">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-warning button-edit" data-id="${doc.id}" data-bs-toggle="modal" data-bs-target="#editProducto">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="btn btn-danger button-delete" data-id="${doc.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
    });
    html += "</tbody>";
    clientesTable.innerHTML = html;
  
    clientesTable.querySelectorAll(".button-view").forEach((btn) => {
      btn.addEventListener("click", async (e) => showProductModal(await getProduct(e.currentTarget.getAttribute("data-id"))));
    });
  
    clientesTable.querySelectorAll(".button-edit").forEach((btn) => {
      btn.addEventListener("click", async (e) => fillEditForm(await getProduct(e.currentTarget.getAttribute("data-id")), e.currentTarget.getAttribute("data-id")));
    });
  
    clientesTable.querySelectorAll(".button-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        await deleteProduct(e.currentTarget.getAttribute("data-id"));
        updateTable(await getFormProd());
        showNotification("Producto eliminado correctamente");
      });
    });
  };
  
  editForm.addEventListener("submit", handleEditSubmit);
  
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(
      ["name", "quantity", "price", "stock", "drug"].map((field) => [field, registerForm[field].value])
    );
    await saveFormProd(...Object.values(data));
    registerForm.reset();
    modal.classList.remove("is-active");
    updateTable(await getFormProd());
    showNotification("Producto creado correctamente");
  });
  
  openModal.addEventListener("click", () => modal.classList.toggle("is-active"));
  closeModal.addEventListener("click", () => modal.classList.remove("is-active"));
  document.getElementById("closeEditModal").addEventListener("click", () => document.getElementById("editProducto").classList.remove("is-active"));
  document.getElementById("closeViewModal").addEventListener("click", () => document.getElementById("viewProduct").classList.remove("is-active"));
  
  document.getElementById("searchButton").addEventListener("click", () => performSearch(document.getElementById("searchInput").value));
  document.getElementById("searchInput").addEventListener("input", (e) => {
    if (e.target.value === "") resetTable();
  });
  
  window.addEventListener("DOMContentLoaded", async () => {
    updateTable(await getFormProd());
    const user = auth.currentUser;
    if (user) document.getElementById("user-name").textContent = user.displayName;
  });
  