import { initializeApp } from "firebase/app";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

// 🔹 Configuración de tu Firebase (Cambia esto con tus credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyAgDBPm4qGbtRkspXOPOsWVQACbIE4NrJs",
  authDomain: "calculadora-de-importaci-964a2.firebaseapp.com",
  projectId: "calculadora-de-importaci-964a2",
  storageBucket: "calculadora-de-importaci-964a2.firebasestorage.app",
  messagingSenderId: "G-M442MTGJXB",
  appId: "1:138022588697:web:10e9e12a4b3b10fb08f588",
};

// 🔹 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export { db, doc, getDoc, setDoc };
