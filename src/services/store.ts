import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface UserState {
  lunas: number;
  registrado: boolean;
  usuario: {
    nombre: string;
    nacimiento: string;
    hora: string;
    lugar: string;
  };
  historial: Consultation[];
}

export interface Consultation {
  fecha: string;
  modulo: string;
  pregunta: string;
  resultado: string;
}

const DEFAULT_STATE: UserState = {
  lunas: 10,
  registrado: false,
  usuario: {
    nombre: '',
    nacimiento: '',
    hora: '',
    lugar: ''
  },
  historial: []
};

export const getUserData = async (uid: string): Promise<UserState> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserState;
  } else {
    // Inicializar usuario nuevo
    await setDoc(userRef, DEFAULT_STATE);
    return DEFAULT_STATE;
  }
};

export const saveUserProgress = async (uid: string, updates: Partial<UserState>) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
};

export const addConsultation = async (uid: string, consultation: Consultation) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    historial: arrayUnion(consultation)
  });
};

export const updateLunas = async (uid: string, delta: number) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const current = snap.data().lunas || 0;
    await updateDoc(userRef, { lunas: current + delta });
  }
};

export const subscribeToUserData = (uid: string, callback: (data: UserState) => void) => {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, async (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserState);
    } else {
      // Si no existe, inicialo con el estado por defecto
      try {
        await setDoc(userRef, DEFAULT_STATE);
        // callback se llamará automáticamente en el siguiente snapshot
      } catch (e) {
        console.error("Error al inicializar usuario:", e);
      }
    }
  });
};
