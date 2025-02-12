// src/services/visitService.ts
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Importación de la configuración de Firebase

const visitDocRef = doc(db, "visits", "counter"); // Documento en Firestore

// Incrementa el contador de visitas
export const incrementVisitCount = async () => {
  const docSnap = await getDoc(visitDocRef);

  if (docSnap.exists()) {
    await updateDoc(visitDocRef, { count: increment(1) });
  } else {
    await setDoc(visitDocRef, { count: 1 }); // Si no existe, lo crea con 1 visita
  }
};

// Obtiene el número actual de visitas
export const getVisitCount = async () => {
  const docSnap = await getDoc(visitDocRef);
  return docSnap.exists() ? docSnap.data().count : 0;
};
