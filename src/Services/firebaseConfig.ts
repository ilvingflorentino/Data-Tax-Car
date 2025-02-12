// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgDBPm4qGbtRkspXOPOsWVQACbIE4NrJs",
  authDomain: "calculadora-de-importaci-964a2.firebaseapp.com",
  projectId: "calculadora-de-importaci-964a2",
  storageBucket: "calculadora-de-importaci-964a2.firebasestorage.app",
  messagingSenderId: "138022588697",
  appId: "1:138022588697:web:10e9e12a4b3b10fb08f588",
  measurementId: "G-M442MTGJXB",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
