// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyBIru1vXppQdukhsQKdnCjFL0ODpuCIeTI",
  authDomain: "intervue-7cf6d.firebaseapp.com",
  projectId: "intervue-7cf6d",
  storageBucket: "intervue-7cf6d.firebasestorage.app",
  messagingSenderId: "684084498966",
  appId: "1:684084498966:web:834bc281f3ad71eb689b37",
  measurementId: "G-GJ8FV72WTG"
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
