import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza estos valores con tus credenciales de la consola de Firebase
// Configuración de tu aplicación web de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCt0ynAEH_Lyujek6ZylFFRxoQCEyTBBlw",
  authDomain: "filosvida-9c378.firebaseapp.com",
  projectId: "filosvida-9c378",
  storageBucket: "filosvida-9c378.firebasestorage.app",
  messagingSenderId: "945552170520",
  appId: "1:945552170520:web:fee4fd270c1164dd072d6d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
