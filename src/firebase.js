import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'AIzaSyCYvQW8lnowHLCRaIft8GX2hu8cFpbo01U',
  authDomain: 'familyflow-organiser-96b32.firebaseapp.com',
  projectId: 'familyflow-organiser-96b32',
  storageBucket: 'familyflow-organiser-96b32.firebasestorage.app',
  messagingSenderId: '214858658104',
  appId: '1:214858658104:web:ae57dcfb7261bd731e51cd'
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export {
  app,
  auth,
  db
};