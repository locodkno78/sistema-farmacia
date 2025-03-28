import { db, collection, addDoc, getDocs } from "../firebase.js";

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
            <button class="btn btn-primary btn-sm seleccionar-producto" data-nombre="${producto.name}" data-precio="${producto.price}">Seleccionar</button>
        `;
        modalBody.appendChild(div);
    });

    let modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();

    document.querySelectorAll(".seleccionar-producto").forEach(button => {
        button.addEventListener("click", function() {
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
window.agregarATabla = function(nombre, precio) {
    let table = document.getElementById("table");
    let tbody = table.querySelector("tbody");

    let row = tbody.insertRow();
    
    // Nombre
    row.insertCell(0).textContent = nombre;

    // Precio
    row.insertCell(1).textContent = `$${precio.toFixed(2)}`;

    // Cantidad (editable)
    let cantidadCell = row.insertCell(2);
    let cantidadInput = document.createElement("input");
    cantidadInput.type = "number";
    cantidadInput.value = 1;
    cantidadInput.min = 1;
    cantidadInput.classList.add("form-control", "cantidad");
    cantidadInput.addEventListener("input", actualizarTotal);
    cantidadCell.appendChild(cantidadInput);

    // Descuento (editable, %)
    let descuentoCell = row.insertCell(3);
    let descuentoInput = document.createElement("input");
    descuentoInput.type = "number";
    descuentoInput.value = 0;
    descuentoInput.min = 0;
    descuentoInput.max = 100;
    descuentoInput.classList.add("form-control", "descuento");
    descuentoInput.addEventListener("input", actualizarTotal);
    descuentoCell.appendChild(descuentoInput);

    // Total (calculado automáticamente)
    let totalCell = row.insertCell(4);
    totalCell.textContent = `$${precio.toFixed(2)}`;
    totalCell.classList.add("total");

    // Guardar el producto y cantidad para luego enviarlo al pedido
    productosEnTabla.push({ nombre, cantidad: 1, row });

    // Actualizar el total general
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

    // Buscar el producto en el array y actualizar la cantidad
    let producto = productosEnTabla.find(p => p.row === row);
    if (producto) {
        producto.cantidad = cantidad;
    }

    // Actualizar el total general
    actualizarTotalGeneral();
}

// Función para calcular el total de toda la tabla
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

    // Mostrar el monto total en el modal
    totalToPay.textContent = `Monto Total a Pagar: $${totalGeneral.toFixed(2)}`;

    // Calcular monto con tarjeta de crédito (3 cuotas)
    let totalConInteres = totalGeneral * 1.25;

    // Mostrar las opciones de pago
    payCash.textContent = `Efectivo, Débito, Crédito (1 pago): $${totalGeneral.toFixed(2)}`;
    payCard.textContent = `Tarjeta de Crédito (3 cuotas): $${totalConInteres.toFixed(2)}`;

    // Mostrar el modal
    let modal = new bootstrap.Modal(document.getElementById("payModal"));
    modal.show();
});

// Función para realizar el pago y guardar los productos en la colección 'pedidos'
document.getElementById("finalizarPagoButton").addEventListener("click", async () => {
    try {
        // Creamos el array de productos para la colección 'pedidos'
        const pedidoData = productosEnTabla.map(producto => ({
            producto: producto.nombre, // nombre del producto
            cantidad: producto.cantidad // cantidad del producto
        }));

        // Enviar los productos a Firebase (colección "pedidos")
        const pedidosRef = collection(db, "pedidos");
        await addDoc(pedidosRef, {
            productos: pedidoData,  // Guardamos los productos y cantidades
            total: parseFloat(document.getElementById("totalGeneral").textContent.replace("$", ""))  // Total a pagar
        });

        // Mostrar notificación o mensaje de éxito
        alert("Pago realizado.");

        // Limpiar la tabla
        document.getElementById("table").querySelector("tbody").innerHTML = ''

        // Limpiar los productos en la tabla y en el array
        productosEnTabla = [];
        
        // Reiniciar total general
        document.getElementById("totalGeneral").textContent = "$0.00";

        // Opcional: Recargar la página para asegurar que todo se reinicie bien
        location.reload();

    } catch (error) {
        console.error("Error al realizar el pago:", error);
        alert("Hubo un error al procesar el pago.");
    }
});
