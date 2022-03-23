import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore' 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4TId4p4P85qSHrMH7WiUV0sHsumif1-Q",
  authDomain: "house-marketplace-b137b.firebaseapp.com",
  projectId: "house-marketplace-b137b",
  storageBucket: "house-marketplace-b137b.appspot.com",
  messagingSenderId: "246974418543",
  appId: "1:246974418543:web:875ba15d8ec2cff726c79a"
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();