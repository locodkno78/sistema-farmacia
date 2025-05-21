import { db, collection, getDocs, updateProductStock, saveOrUpdatePedido, getFormProd } from "../firebase.js";

// ✅ Función para actualizar completamente la vista
async function actualizarVistaCompleta() {
    try {
        console.log("✅ actualizando vista...");
        const productosSnapshot = await getFormProd();

        document.getElementById("searchInput").value = "";
        console.log("Vista completamente actualizada");
    } catch (error) {
        console.error("Error al actualizar la vista:", error);
    }
}

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

// Función para mostrar productos en un modal
function mostrarProductosEnModal(productos) {
    let modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = "";

    productos.forEach(producto => {
        let div = document.createElement("div");
        div.classList.add("producto-item", "p-2", "border", "mb-2", "d-flex", "justify-content-between");
        div.innerHTML = `
            <span>${producto.name} - $${producto.price}</span>
            <button class="btn btn-success btn-sm seleccionar-producto" data-nombre="${producto.name}" data-precio="${producto.price}">Seleccionar</button>
        `;
        modalBody.appendChild(div);
    });

    let modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();

    document.querySelectorAll(".seleccionar-producto").forEach(button => {
        button.addEventListener("click", function () {
            let nombre = this.getAttribute("data-nombre");
            let precio = parseFloat(this.getAttribute("data-precio"));
            agregarATabla(nombre, precio);

            modal.hide();
        });
    });
}

// Array para almacenar los productos agregados a la tabla
let productosEnTabla = [];

// Función para agregar un producto a la tabla
window.agregarATabla = function (nombre, precio) {
    let table = document.getElementById("table");
    let tbody = table.querySelector("tbody");

    let row = tbody.insertRow();

    row.insertCell(0).textContent = nombre;
    row.insertCell(1).textContent = `$${precio.toFixed(2)}`;

    let cantidadCell = row.insertCell(2);
    let cantidadInput = document.createElement("input");
    cantidadInput.type = "number";
    cantidadInput.value = 1;
    cantidadInput.min = 1;
    cantidadInput.classList.add("form-control", "cantidad");
    cantidadInput.addEventListener("input", actualizarTotal);
    cantidadCell.appendChild(cantidadInput);

    let descuentoCell = row.insertCell(3);
    let descuentoInput = document.createElement("input");
    descuentoInput.type = "number";
    descuentoInput.value = 0;
    descuentoInput.min = 0;
    descuentoInput.max = 100;
    descuentoInput.classList.add("form-control", "descuento");
    descuentoInput.addEventListener("input", actualizarTotal);
    descuentoCell.appendChild(descuentoInput);

    let totalCell = row.insertCell(4);
    totalCell.textContent = `$${precio.toFixed(2)}`;
    totalCell.classList.add("total");

    let actionCell = row.insertCell(5);
    actionCell.classList.add("text-center");
    let deleteButton = document.createElement("button");
    deleteButton.classList.add("btn", "btn-danger", "btn-sm");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener("click", function () {
        row.remove();
        productosEnTabla = productosEnTabla.filter(p => p.row !== row);
        actualizarTotalGeneral();
    });
    actionCell.appendChild(deleteButton);

    productosEnTabla.push({ nombre, cantidad: 1, row });

    actualizarTotalGeneral();
};

// Función para actualizar el total de cada fila
function actualizarTotal() {
    let row = this.closest("tr");
    let cantidad = parseFloat(row.querySelector(".cantidad").value) || 1;
    let descuento = parseFloat(row.querySelector(".descuento").value) || 0;
    let precio = parseFloat(row.cells[1].textContent.replace("$", ""));

    let total = (precio * cantidad) * (1 - descuento / 100);
    row.querySelector(".total").textContent = `$${total.toFixed(2)}`;

    let producto = productosEnTabla.find(p => p.row === row);
    if (producto) {
        producto.cantidad = cantidad;
    }

    actualizarTotalGeneral();
}

// Función para calcular el total general
function actualizarTotalGeneral() {
    let totalGeneral = 0;
    document.querySelectorAll(".total").forEach(cell => {
        totalGeneral += parseFloat(cell.textContent.replace("$", "")) || 0;
    });

    document.getElementById("totalGeneral").textContent = `$${totalGeneral.toFixed(2)}`;
}

// Función para mostrar el modal de pago
document.getElementById("payButton").addEventListener("click", () => {
    let totalGeneral = parseFloat(document.getElementById("totalGeneral").textContent.replace("$", ""));
    let totalToPay = document.getElementById("totalToPay");
    let payCash = document.getElementById("payCash");
    let payCard = document.getElementById("payCard");

    totalToPay.textContent = `Monto Total a Pagar: $${totalGeneral.toFixed(2)}`;
    let totalConInteres = totalGeneral * 1.25;

    payCash.textContent = `Efectivo, Débito, Crédito (1 pago): $${totalGeneral.toFixed(2)}`;
    payCard.textContent = `Tarjeta de Crédito (3 cuotas): $${totalConInteres.toFixed(2)}`;

    let modal = new bootstrap.Modal(document.getElementById("payModal"));
    modal.show();
});

// Función para realizar el pago y actualizar la vista
document.getElementById("finalizarPagoButton").addEventListener("click", async () => {
    try {
        for (const producto of productosEnTabla) {
            await updateProductStock(producto.nombre, producto.cantidad);
        }

        const pedidoData = productosEnTabla.map(producto => ({
            producto: producto.nombre,
            cantidad: producto.cantidad
        }));

        await saveOrUpdatePedido(pedidoData);

        Swal.fire({
            title: '¡Éxito!',
            text: 'Venta realizada correctamente',
            icon: 'success',
            showConfirmButton: false,
            timer: 2000
        });


        const payModalElement = document.getElementById("payModal");
        const payModalInstance = bootstrap.Modal.getInstance(payModalElement);
        if (payModalInstance) {
            payModalInstance.hide();
        }

        document.getElementById("table").querySelector("tbody").innerHTML = '';
        productosEnTabla = [];
        document.getElementById("totalGeneral").textContent = "$0.00";

        await actualizarVistaCompleta();

    } catch (error) {
        console.error("Error en el proceso completo:", error);
        alert(`Error al procesar la venta: ${error.message}`);
    }
});
