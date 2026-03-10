import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCI7G9NeylLhmuXDQlbOJWlYt5gOcApvaE",
  authDomain: "my-web-highlights-5e3c3.firebaseapp.com",
  projectId: "my-web-highlights-5e3c3",
  storageBucket: "my-web-highlights-5e3c3.firebasestorage.app",
  messagingSenderId: "180317033557",
  appId: "1:180317033557:web:8bc5f63a1b3aa8be3b70dc",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
