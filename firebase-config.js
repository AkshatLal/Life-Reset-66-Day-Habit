// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace this object with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJ0LDRzZ9D2dLsbYNaag_NKgjr9JqpbOY",
  authDomain: "life-66-40152.firebaseapp.com",
  projectId: "life-66-40152",
  storageBucket: "life-66-40152.firebasestorage.app",
  messagingSenderId: "926692803067",
  appId: "1:926692803067:web:c8f9dac793a1e0cc684b5e",
  measurementId: "G-DZHYVP8N0R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Export everything so app.js can use it
export { auth, db, provider, signInWithRedirect, onAuthStateChanged, signOut, doc, setDoc, getDoc, getRedirectResult };
