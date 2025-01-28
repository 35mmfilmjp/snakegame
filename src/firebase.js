// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRfIByQgXOBpn9RMgToj8QJel3Pu1MeIQ",
  authDomain: "snake-game-t18j013.firebaseapp.com",
  projectId: "snake-game-t18j013",
  storageBucket: "snake-game-t18j013.firebasestorage.app",
  messagingSenderId: "948676929021",
  appId: "1:948676929021:web:a4cdaacc41a347e1ba6594",
  measurementId: "G-LMFFSLNK50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

export default app; 