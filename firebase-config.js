// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMbJgOVqGvoj5vzjIguvM7qWNBFOPijnU",
  authDomain: "learnwithtaa-99225.firebaseapp.com",
  projectId: "learnwithtaa-99225",
  storageBucket: "learnwithtaa-99225.firebasestorage.app",
  messagingSenderId: "285715736445",
  appId: "1:285715736445:web:d6f8c302b51bbef76a0e14"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export so other modules can use them
export { auth, db };