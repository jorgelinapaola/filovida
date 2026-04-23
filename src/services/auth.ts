import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  type User
} from "firebase/auth";
import { auth } from "../lib/firebase";

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const signUpWithEmail = (email: string, pass: string) => 
  createUserWithEmailAndPassword(auth, email, pass);

export const loginWithGoogle = () => 
  signInWithPopup(auth, googleProvider);

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
