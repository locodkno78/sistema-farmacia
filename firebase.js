import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
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

export const consultaForm = (clienteId, fechaCompra, producto, precio, cantidad, precioT, detalles) => {
  return addDoc(collection(db, 'clientes', clienteId, 'consultas'), { fechaCompra, producto, precio, cantidad, precioT, detalles }
  )
}

export const pedidosForm = (producto, cantidad) => {
  return addDoc(collection(db, 'pedidos'), { producto, cantidad}
  )
}

export const getForm = async () => {
  const querySnapshot = await getDocs(collection(db, 'clientes'));
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

export const deleteConsulta = async (clienteId, consultasId) => {
  try {
    const clienteRef = doc(db, "clientes", clienteId, 'consultas', consultasId);
    await deleteDoc(clienteRef);
    console.log("Consulta eliminado correctamente");
  } catch (error) {
    console.error("Error al eliminar la consulta:", error);
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
    console.log("Cliente actualizado con éxito");
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
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






export { app, db, doc, auth, setDoc }