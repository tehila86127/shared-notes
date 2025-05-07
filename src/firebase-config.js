import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
    apiKey: "AIzaSyCSKN5yIVW6E4_CpWl2LVByFubzjkNClcg",
    authDomain: "shared-notes-49da3.firebaseapp.com",
    projectId: "shared-notes-49da3",
    storageBucket: "shared-notes-49da3.firebasestorage.app",
    messagingSenderId: "287839198158",
    appId: "1:287839198158:web:b090684e74c505e2be299f",
    measurementId: "G-GYKCWM2XGQ"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);