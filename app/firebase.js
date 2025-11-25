// src/app/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Tus datos puestos directamente (Hardcoded) para evitar errores de Vercel
const firebaseConfig = {
  apiKey: "AIzaSyAtP3YyNsE7o07xEneOXCvJKW8gSrs_ak8",
  authDomain: "carta-reyes.firebaseapp.com",
  projectId: "carta-reyes",
  storageBucket: "carta-reyes.firebasestorage.app",
  messagingSenderId: "824252199928",
  appId: "1:824252199928:web:b16db60d7df7566e6c5c0d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);