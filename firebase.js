import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc, query,
  where
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDXtCFAY0NaZxQLuBlwI2Ob1wDU9ajpFYY",
  authDomain: "farmacia-bb1a5.firebaseapp.com",
  projectId: "farmacia-bb1a5",
  storageBucket: "farmacia-bb1a5.appspot.com",
  messagingSenderId: "617354015651",
  appId: "1:617354015651:web:7e39b7ad5cfcf2c6e7a016"
};

const app = initializeApp(firebaseConfig);
// Inicializar Firebase Firestore
const db = getFirestore(app);
const auth = getAuth(app);

export const saveForm = (dni, name, surname, date, address, phone, email, obraSocial, description) => {
  return addDoc(collection(db, 'clientes'), { dni, name, surname, date, address, phone, email, obraSocial, description }
  )
}

export const saveFormProd = (name, quantity, price, stock, drug) => {
  return addDoc(collection(db, 'productos'), { name, quantity, price, stock, drug }
  )
}

export const consultaForm = (clienteId, fechaCompra, producto, precio, cantidad, precioT, detalles) => {
  return addDoc(collection(db, 'clientes', clienteId, 'consultas'), { fechaCompra, producto, precio, cantidad, precioT, detalles }
  )
}

export const pedidosForm = (producto, cantidad) => {
  return addDoc(collection(db, 'pedidos'), { producto, cantidad }
  )
}

export const getForm = async () => {
  const querySnapshot = await getDocs(collection(db, 'clientes'));
  return querySnapshot;
};

export const getFormProd = async () => {
  const querySnapshot = await getDocs(collection(db, 'productos'));
  return querySnapshot;
};

export const getConsulta = async (clienteId) => {
  const querySnapshot = await getDocs(collection(db, 'clientes', clienteId, 'consultas'));
  return querySnapshot;
};

export const getPedidos = async () => {
  const querySnapshot = await getDocs(collection(db, 'pedidos'));
  return querySnapshot;
};


export const deleteCliente = async (clienteId) => {
  try {
    const clienteRef = doc(db, "clientes", clienteId);
    await deleteDoc(clienteRef);
    console.log("Cliente eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
  }
};

export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, "productos", productId);
    await deleteDoc(productRef);
    console.log("Producto eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
  }
};

export const deleteConsulta = async (clienteId, consultasId) => {
  try {
    const clienteRef = doc(db, "clientes", clienteId, 'consultas', consultasId);
    await deleteDoc(clienteRef);
    console.log("Consulta eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar la consulta:", error);
  }
};
export const deletePedido = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    await deleteDoc(pedidoRef);
    console.log("Producto eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
  }
};


export const updateCliente = async (clienteId, newData) => {
  const clienteRef = doc(db, "clientes", clienteId);

  try {
    await updateDoc(clienteRef, newData);
    console.log("Cliente actualizado con éxito");
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
  }
};


export const updateConsulta = async (clienteId, consultasId, newData) => {
  const clienteRef = doc(db, "clientes", clienteId, 'consultas', consultasId);

  try {
    const consultaDoc = await getDoc(clienteRef);

    if (consultaDoc.exists()) {
      console.log("Nuevo precio:", newData.precio);
      await updateDoc(clienteRef, newData);
      console.log("Consulta actualizada con éxito");
    } else {
      console.error("Documento no encontrado para actualizar");
    }
  } catch (error) {
    console.error("Error al actualizar la consulta:", error);
    throw error; // Asegúrate de propagar el error para manejarlo en el lugar correspondiente
  }
};

export const updatePedidos = async (pedidoId, newData) => {
  const pedidoRef = doc(db, "pedidos", pedidoId);

  try {
    await updateDoc(pedidoRef, newData);
    console.log("Producto actualizado con éxito");
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
  }
};

export const updateProduct = async (productoId, newData) => {
  const productoRef = doc(db, "productos", productoId);

  try {
    await updateDoc(productoRef, newData);
    console.log("Producto actualizado con éxito");
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
  }
};

export const getCliente = async (clienteId) => {
  const clienteRef = doc(db, "clientes", clienteId);
  const clienteSnapshot = await getDoc(clienteRef);

  if (clienteSnapshot.exists()) {
    return clienteSnapshot.data();
  } else {
    console.error("Cliente no encontrado");
    return null;
  }
};

export const getProduct = async (productId) => {
  const productRef = doc(db, "productos", productId);
  const productSnapshot = await getDoc(productRef);

  if (productSnapshot.exists()) {
    return productSnapshot.data();
  } else {
    console.error("Producto no encontrado");
    return null;
  }
};



export const getHistorial = async (clienteId, consultasId) => {
  if (clienteId && consultasId) { // Comprueba que ambos valores no sean undefined
    const consultaRef = doc(db, 'clientes', clienteId, 'consultas', consultasId);
    const consultaSnapshot = await getDoc(consultaRef);
    console.log(consultasId)
    if (consultaSnapshot.exists()) {
      return consultaSnapshot.data();
    } else {
      console.error("Consulta no encontrada");
      return null; // Retorna null para indicar que la consulta no se encontró
    }
  } else {
    console.error("Valores de clienteId o consultasId indefinidos");
    return null; // Retorna null en caso de valores indefinidos
  }
};

export const getProducto = async (productoId) => {
  const productoRef = doc(db, "pedidos", productoId);
  const productoSnapshot = await getDoc(productoRef);

  if (productoSnapshot.exists()) {
    return productoSnapshot.data();
  } else {
    console.error("Producto no encontrado");
    return null;
  }
};

// Función específica para obtener productos
export const getProducts = async () => {
  const querySnapshot = await getDocs(collection(db, 'productos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Agregar esta función en firebase.js
export const updateProductStock = async (productName, quantitySold) => {
  try {
    // 1. Buscar el producto por nombre
    const productosRef = collection(db, "productos");
    const q = query(productosRef, where("name", "==", productName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`Producto "${productName}" no encontrado`);
    }

    // 2. Actualizar el stock para cada documento encontrado
    const updates = [];
    querySnapshot.forEach((doc) => {
      const currentStock = doc.data().stock;
      const newStock = currentStock - quantitySold;

      if (newStock < 0) {
        throw new Error(`No hay suficiente stock para ${productName}. Stock actual: ${currentStock}`);
      }

      updates.push(updateDoc(doc.ref, { stock: newStock }));
    });

    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    throw error; // Re-lanzamos el error para manejarlo en sales.js
  }
};

export const getProductByName = async (productName) => {
  const productosRef = collection(db, "productos");
  const q = query(productosRef, where("name", "==", productName));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveOrUpdatePedido = async (productosVendidos) => {
  try {
    // 1. Buscar si ya existe un pedido para estos productos
    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef);
    const querySnapshot = await getDocs(q);

    // 2. Crear un objeto para acumular las cantidades
    const acumuladorPedidos = {};

    // Primero procesamos los productos nuevos
    productosVendidos.forEach(producto => {
      if (!acumuladorPedidos[producto.producto]) {
        acumuladorPedidos[producto.producto] = 0;
      }
      acumuladorPedidos[producto.producto] += producto.cantidad;
    });

    // Luego sumamos los pedidos existentes
    querySnapshot.forEach(doc => {
      const pedidoExistente = doc.data();
      if (pedidoExistente.productos && Array.isArray(pedidoExistente.productos)) {
        pedidoExistente.productos.forEach(item => {
          if (!acumuladorPedidos[item.producto]) {
            acumuladorPedidos[item.producto] = 0;
          }
          acumuladorPedidos[item.producto] += item.cantidad;
        });
      }
    });

    // 3. Convertir el acumulador a formato de array
    const productosAcumulados = Object.keys(acumuladorPedidos).map(producto => ({
      producto,
      cantidad: acumuladorPedidos[producto]
    }));

    // 4. Si hay pedidos existentes, actualizarlos, sino crear uno nuevo
    if (!querySnapshot.empty) {
      // Actualizar el primer documento encontrado (podrías mejorar esto para múltiples documentos)
      const primerPedido = querySnapshot.docs[0];
      await updateDoc(primerPedido.ref, {
        productos: productosAcumulados,
        fecha: new Date()
      });
    } else {
      // Crear un nuevo pedido
      await addDoc(pedidosRef, {
        productos: productosAcumulados,
        fecha: new Date(),
        estado: "activo"
      });
    }

    return true;
  } catch (error) {
    console.error("Error al guardar/actualizar pedido:", error);
    throw error;
  }
};
export const resetProductoPedidos = async (productoNombre) => {
  try {
    const pedidosRef = collection(db, "pedidos");
    const querySnapshot = await getDocs(pedidosRef);

    const acciones = [];

    querySnapshot.forEach((docSnap) => {
      const pedidoData = docSnap.data();

      if (pedidoData.productos && Array.isArray(pedidoData.productos)) {
        const nuevosProductos = pedidoData.productos.filter(item => item.producto !== productoNombre);

        if (nuevosProductos.length === 0) {
          // Si no quedan productos, eliminar el documento
          acciones.push(deleteDoc(docSnap.ref));
        } else {
          // Si quedan otros productos, actualizar el array
          acciones.push(updateDoc(docSnap.ref, { productos: nuevosProductos }));
        }
      } else if (pedidoData.producto === productoNombre) {
        // Formato viejo: producto suelto
        acciones.push(deleteDoc(docSnap.ref));
      }
    });

    await Promise.all(acciones);
    return true;
  } catch (error) {
    console.error("Error al resetear producto en pedidos:", error);
    throw error;
  }
};

export const deleteAllPedidos = async () => {
  try {
    const pedidosRef = collection(db, "pedidos");
    const snapshot = await getDocs(pedidosRef);

    const deletes = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletes);
    console.log("Todos los pedidos fueron eliminados");
  } catch (error) {
    console.error("Error al eliminar todos los pedidos:", error);
  }
};

export {
  app, db, doc, auth, setDoc, collection, getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  getDoc,
  deleteDoc
}
