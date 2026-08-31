// Inicializa Firebase y expone las referencias compartidas.
// Debe ir después de firebase-config.js y antes del resto de scripts.
const firebaseListo = firebase !== undefined &&
  typeof firebaseConfig.apiKey === "string" &&
  !firebaseConfig.apiKey.startsWith("TU_");

let db = null;
let authApp = null;

if (firebaseListo) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  authApp = firebase.auth();
}