import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBD1lpwftzNmjzPE7_Jw2M6wFz_edz6qX4",
  authDomain: "checklogin-67a92.firebaseapp.com",
  projectId: "checklogin-67a92",
  storageBucket: "checklogin-67a92.appspot.com",
  messagingSenderId: "246538906966",
  appId: "1:246538906966:web:2e4399caaa96210df23af7",
  measurementId: "G-X3068LRCWT",
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };

// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
