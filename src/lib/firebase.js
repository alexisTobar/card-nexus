import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2UyFs_gieI8pON33RYhhWdPHW1Ovm7sI",
  authDomain: "nexus-db1cb.firebaseapp.com",
  projectId: "nexus-db1cb",
  storageBucket: "nexus-db1cb.firebasestorage.app",
  messagingSenderId: "874425157026",
  appId: "1:874425157026:web:8d00b3db2b70c599a79efb",
  measurementId: "G-7E6YQL4FS3"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

/**
 * SOLUCIÓN AL ERROR ERR_BLOCKED_BY_CLIENT:
 * Usamos initializeFirestore con 'experimentalForceLongPolling' para que las 
 * peticiones no sean bloqueadas por AdBlockers o Antivirus.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configuración opcional para facilitar el login con Google
googleProvider.setCustomParameters({ prompt: 'select_account' });