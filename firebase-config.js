// ============================================================
//  CONFIGURACIÓN DE FIREBASE
//  Pega aquí los datos de tu app web.
//  Consola Firebase > Ajustes del proyecto > Tus apps > Web
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCWIcETLQFL-wS1RMkF0vRWvues2AhaiJ4",
  authDomain: "agusysol.firebaseapp.com",
  projectId: "agusysol",
  storageBucket: "agusysol.firebasestorage.app",
  messagingSenderId: "768522054365",
  appId: "1:768522054365:web:80b74ea31d946176574934"
};

// ============================================================
//  EMAILS DE LOS OWNERS (únicas cuentas que verán las confirmaciones)
//  Agregá o sacá cuentas en este array.
// ============================================================
const OWNER_EMAILS = [
  "agucate95@gmail.com",
  "scampiutti@gmail.com"
];