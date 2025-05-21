import {
    saveFormProd,
    getFormProd,
    deleteProduct,
    getProduct,
    updateProduct,
    auth,
} from "../firebase.js";
//import { signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const clientesTable = document.getElementById("table");
const openModal = document.getElementById("openRegisterModal");
const modal = document.getElementById("newCustomer");
const closeModal = document.getElementById("closeRegisterModal");
const registerForm = document.getElementById("register-form");

// Carga la tabla con datos
function updateTable(querySnapshot) {
    const columnNames = [
        "Nombre",
        "Cantidad",
        "Precio",
        "Stock",
        "Componentes",
        "Acciones"
    ];

    let html = `
      <thead>
        <tr>${columnNames.map(columnName => `<th>${columnName}</th>`).join('')}</tr>
      </thead>
      <tbody>`;

    querySnapshot.forEach((doc) => {
        const productosData = doc.data();

        html += `
            <tr>          
                <td>${productosData.name}</td>          
                <td>${productosData.quantity}</td>
                <td>${productosData.price}</td>
                <td>${productosData.stock}</td>          
                <td>${productosData.drug}</td>
                <td>
                    <button type="button" class="btn btn-success button-view" data-bs-toggle="modal" 
                        data-bs-target="#viewProduct" data-id="${doc.id}">
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
            const productId = e.currentTarget.getAttribute("data-id");
            const productData = await getProduct(productId);
            if (productData !== null) {
                showProductModal(productData);
            } else {
                console.log("Producto no encontrado");
            }
        });
    });

    const buttonUpDate = clientesTable.querySelectorAll(".button-edit");
    const editForm = document.getElementById("edit-form");

    buttonUpDate.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const productId = e.currentTarget.getAttribute("data-id");
            const productData = await getProduct(productId);

            if (productData !== null) {
                // Llenar el formulario con los datos existentes
                const editForm = document.getElementById("edit-form");
                editForm.elements["name"].value = productData.name;
                editForm.elements["quantity"].value = productData.quantity;
                editForm.elements["price"].value = productData.price;
                editForm.elements["stock"].value = productData.stock;
                editForm.elements["drug"].value = productData.drug;

                // Mostrar el formulario de edición
                const editModal = document.getElementById("editProducto");
                editModal.classList.add("is-active");

                // También puedes añadir el clienteId al formulario si lo necesitas después
                editForm.setAttribute("data-id", productId);

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
        const productId = event.currentTarget.getAttribute("data-id");

        // Obtener los nuevos datos del formulario
        const newData = {
            name: editForm.elements["name"].value,
            quantity: editForm.elements["quantity"].value,
            price: editForm.elements["price"].value,
            stock: editForm.elements["stock"].value,
            drug: editForm.elements["drug"].value,
        };

        // Actualizar el cliente
        await updateProduct(productId, newData);

        // Cerrar el modal después de la edición 
        const editModal = document.getElementById("editProducto");
        editModal.classList.remove("is-active");

        // Actualizar la tabla después de la edición 
        const updatedQuerySnapshot = await getFormProd();
        updateTable(updatedQuerySnapshot);
        showNotification("Edición Correcta");
    };
    const buttonDelete = clientesTable.querySelectorAll(".button-delete");
    buttonDelete.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const productoId = e.currentTarget.getAttribute("data-id");
            await deleteProduct(productoId);
            const updatedQuerySnapshot = await getFormProd();
            updateTable(updatedQuerySnapshot);

            showNotification("Producto eliminado correctamente");
        });
    });


    function showProductModal(productData) {
        try {
            // Elementos del DOM
            const elements = {
                name: document.getElementById("name"),
                quantity: document.getElementById("quantity"),
                price: document.getElementById("price"),
                stock: document.getElementById("stock"),
                drug: document.getElementById("drug")
            };

            // Actualizar contenido
            for (const [key, element] of Object.entries(elements)) {
                if (element) {
                    element.textContent = productData[key] || "No disponible";
                }
            }

            // Mostrar modal con Bootstrap
            const modalElement = document.getElementById('viewProduct');
            if (modalElement) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        } catch (error) {
            console.error("Error al mostrar el modal:", error);
        }
    }

    const closeProductModalButton = document.getElementById("closeViewModal");
    closeProductModalButton.addEventListener("click", () => {
        const productModal = document.getElementById("viewProduct");
        productModal.classList.remove("is-active");
    })
}

window.addEventListener("DOMContentLoaded", async (e) => {
    const querySnapshot = await getFormProd();
    updateTable(querySnapshot);
    const user = auth.currentUser;
    if (user) {
        const userName = user.displayName;
        const nameElement = document.getElementById("user-name");
        nameElement.textContent = userName;
    }
});

const showRegisterModal = () => {
    modal.classList.toggle("is-active");
};

openModal.addEventListener("click", showRegisterModal);
closeModal.addEventListener("click", showRegisterModal);

const closeRegisterModal = () => {
    modal.classList.remove("is-active");
};

closeModal.addEventListener("click", closeRegisterModal);

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = registerForm["name"].value;
    const quantity = registerForm["quantity"].value;
    const price = registerForm["price"].value;
    const stock = registerForm["stock"].value;
    const drug = registerForm["drug"].value;

    await saveFormProd(name, quantity, price, stock, drug);
    registerForm.reset();
    closeRegisterModal();
    const updatedQuerySnapshot = await getFormProd();
    updateTable(updatedQuerySnapshot);
    showNotification("Producto creado correctamente");
});

const closeEditModalButton = document.getElementById("closeEditModal");
closeEditModalButton.addEventListener("click", () => {
    const editModal = document.getElementById("edit-form");
    editModal.classList.remove("is-active");
});

clientesTable.addEventListener("click", async (e) => {
    if (e.target.classList.contains("button-edit")) {
        const productId = e.target.getAttribute("data-id");
        const productData = await getProduct(productId);

        const editForm = document.getElementById("edit-form");
        editForm.elements["name"].value = productData.name;
        editForm.elements["quantity"].value = productData.quantity;
        editForm.elements["price"].value = productData.price;
        editForm.elements["stock"].value = productData.stock;
        editForm.elements["drug"].value = productData.drug;

        const editModal = document.getElementById("edit-form");
        editModal.classList.add("is-active");
        editForm.setAttribute("data-id", productId);
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

function resetTable() {
    const rows = document.querySelectorAll("#table tbody tr");
    rows.forEach((row) => {
        row.style.display = "";
    });
}
const logout = document.querySelector("#logout");

//logout.addEventListener("click", async (e) => {
//    e.preventDefault();
//    try {
//        await signOut(auth)
//        window.location.href = "../Logueo/login.html";
//    } catch (error) {
//        console.log(error)
//    }
//});

