// ============================================================
//  PANEL DEL OWNER — login + lectura de confirmaciones
// ============================================================
const vistaLogin = document.getElementById("vista-login");
const vistaDenegado = document.getElementById("vista-denegado");
const vistaPanel = document.getElementById("vista-panel");
const formLogin = document.getElementById("formLogin");
const loginFeedback = document.getElementById("loginFeedback");
const btnLogin = document.getElementById("btnLogin");
const btnSalir = document.getElementById("btnSalir");
const lista = document.getElementById("lista");
const estadoLista = document.getElementById("estadoLista");

let desuscribir = null;

const ownersSet = new Set(
  Array.isArray(OWNER_EMAILS)
    ? OWNER_EMAILS.map((e) => String(e).toLowerCase())
    : []
);

function mostrarSolo(vista) {
  vistaLogin.hidden = vista !== vistaLogin;
  vistaDenegado.hidden = vista !== vistaDenegado;
  vistaPanel.hidden = vista !== vistaPanel;
}

function verificarListo() {
  if (!firebaseListo) {
    mostrarSolo(vistaDenegado);
    vistaDenegado.querySelector(".error-panel").textContent =
      "Firebase aún no está configurado. Completá firebase-config.js.";
  }
}

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginFeedback.textContent = "";
    loginFeedback.className = "feedback";

    const email = formLogin.email.value.trim();
    const password = formLogin.password.value;

    if (!email || !password) {
      loginFeedback.textContent = "Ingresá email y contraseña.";
      loginFeedback.classList.add("error");
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando…";

    try {
      await authApp.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Error de login:", error);
      loginFeedback.textContent = error.code === "auth/invalid-login-credentials"
        ? "Email o contraseña incorrectos."
        : "No se pudo iniciar sesión. Revisá la conexión.";
      loginFeedback.classList.add("error");
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
    }
  });
}

if (btnSalir) {
  btnSalir.addEventListener("click", () => authApp.signOut());
}

authApp.onAuthStateChanged((user) => {
  if (desuscribir) {
    desuscribir();
    desuscribir = null;
  }

  if (!user) {
    mostrarSolo(vistaLogin);
    return;
  }

  if (user.email && ownersSet.has(user.email.toLowerCase())) {
    mostrarSolo(vistaPanel);
    suscribirConfirmaciones();
  } else {
    authApp.signOut();
    mostrarSolo(vistaDenegado);
  }
});

function suscribirConfirmaciones() {
  lista.innerHTML = "";
  estadoLista.hidden = false;
  estadoLista.className = "cargando";
  estadoLista.textContent = "Cargando confirmaciones…";

  desuscribir = db
    .collection("confirmaciones")
    .orderBy("creadoEn", "desc")
    .onSnapshot(
      (snapshot) => dibujarConfirmaciones(snapshot),
      (error) => {
        console.error("Error al leer confirmaciones:", error);
        estadoLista.hidden = false;
        estadoLista.className = "error-panel";
        estadoLista.textContent =
          "No se pudo leer Firestore. Revisá que las reglas de seguridad y la colección existan.";
      }
    );
}

function dibujarConfirmaciones(snapshot) {
  estadoLista.hidden = true;

  let total = 0;
  let asisten = 0;
  let noAsisten = 0;

  const docs = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    docs.push({ id: doc.id, ...d });
    total++;
    if (d.asiste) {
      asisten++;
    } else {
      noAsisten++;
    }
  });

  document.getElementById("cTotal").textContent = total;
  document.getElementById("cAsisten").textContent = asisten;
  document.getElementById("cNoAsisten").textContent = noAsisten;

  if (!docs.length) {
    lista.innerHTML = '<p class="vacio">Todavía no hay confirmaciones.</p>';
    return;
  }

  lista.innerHTML = docs
    .map((d) => {
      const fecha = d.creadoEn && d.creadoEn.toDate
        ? d.creadoEn.toDate().toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short"
          })
        : "—";
      const telefono = d.telefono ? `<div class="detalle">📞 ${escapar(d.telefono)}</div>` : "";
      const restricciones = d.restricciones ? `<div class="detalle">🍽 ${escapar(d.restricciones)}</div>` : "";
      const musica = d.musica ? `<div class="detalle">🎵 ${escapar(d.musica)}</div>` : "";
      const mensaje = d.mensaje ? `<div class="mensaje">"${escapar(d.mensaje)}"</div>` : "";
      return `
        <div class="confirmacion ${d.asiste ? "" : "no-asiste"}">
          <div class="nombre">${escapar(d.nombre)}</div>
          <div class="detalle">
            ${d.asiste ? "Asiste" : "No podrá asistir"}
            <span> · ${fecha}</span>
          </div>
          ${telefono}
          ${restricciones}
          ${musica}
          ${mensaje}
        </div>`;
    })
    .join("");
}

function escapar(texto) {
  return String(texto || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

verificarListo();