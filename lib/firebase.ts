import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdCW6CjiQgaWGkAigYlHl0ecDPcqgnmEg",
  authDomain: "mydurian-e9974.firebaseapp.com",
  projectId: "mydurian-e9974",
  storageBucket: "mydurian-e9974.firebasestorage.app",
  messagingSenderId: "786340942412",
  appId: "1:786340942412:web:e7738f6728f871d9585ae9",
  measurementId: "G-TQBDM3FHPN"
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
