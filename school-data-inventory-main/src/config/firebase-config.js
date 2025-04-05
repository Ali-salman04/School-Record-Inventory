import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_API_KEY,
//   authDomain: process.env.REACT_APP_AUTH_DOMAIN,
//   projectId: process.env.REACT_APP_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_APP_ID,
//   measurementId: process.env.REACT_APP_MEASUREMENT_ID,
// };
const firebaseConfig = {
  apiKey: "AIzaSyCGl4bGxhKLaADBNCZd1X6CMhRmcmhp1bk",
  authDomain: "deped-mis-project.firebaseapp.com",
  projectId: "deped-mis-project",
  storageBucket: "deped-mis-project.firebasestorage.app",
  messagingSenderId: "343782909035",
  appId: "1:343782909035:web:51c961cb97fe0524ab3d2e",
  measurementId: "G-WN63CKMDD2",
};

// const app = initializeApp(firebaseConfig);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
