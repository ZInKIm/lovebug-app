import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBDgZgVUNdDh9RKVLjgl4hwSyCG6SWtBZI",
  authDomain: "lovebug-app-341d9.firebaseapp.com",
  projectId: "lovebug-app-341d9",
  storageBucket: "lovebug-app-341d9.firebasestorage.app",
  messagingSenderId: "403940476633",
  appId: "1:403940476633:web:e39cc740a9b6688ec320c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);