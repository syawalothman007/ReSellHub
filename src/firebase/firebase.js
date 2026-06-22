// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCajKi57Asoj9SaX6f4zpNDsqhUEHq1y0Q",
  authDomain: "smart-marketplace-e45b2.firebaseapp.com",
  projectId: "smart-marketplace-e45b2",
  storageBucket: "smart-marketplace-e45b2.firebasestorage.app",
  messagingSenderId: "722321313810",
  appId: "1:722321313810:web:0d9f81f26a700d1ca248cb",
  measurementId: "G-GX4TFBMD9Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app); 
export const storage = getStorage(app);
export default app;
