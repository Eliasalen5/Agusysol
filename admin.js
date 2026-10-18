// ============================================================
//  PANEL DEL OWNER — login + gestionar confirmaciones
// ============================================================
const vistaLogin = document.getElementById("vista-login");
const vistaDenegado = document.getElementById("vista-denegado");
const vistaPanel = document.getElementById("vista-panel");
const formLogin = document.getElementById("formLogin");
const loginFeedback = document.getElementById("loginFeedback");
const btnLogin = document.getElementById("btnLogin");
const btnSalir = document.getElementById("btnSalir");
const btnCambiarPass = document.getElementById("btnCambiarPass");
const btnCancelarPass = document.getElementById("btnCancelarPass");
const btnGuardarPass = document.getElementById("btnGuardarPass");
const modalPass = document.getElementById("modalPass");
const formPass = document.getElementById("formPass");
const passFeedback = document.getElementById("passFeedback");
const lista = document.getElementById("lista");
const estadoLista = document.getElementById("estadoLista");
const btnAgregar = document.getElementById("btnAgregar");
const modalConfirmacion = document.getElementById("modalConfirmacion");
const formConfirmacion = document.getElementById("formConfirmacion");
const modalConfirmacionTitulo = document.getElementById("modalConfirmacionTitulo");
const btnCancelarConfirmacion = document.getElementById("btnCancelarConfirmacion");
const btnGuardarConfirmacion = document.getElementById("btnGuardarConfirmacion");
const confirmacionFeedback = document.getElementById("confirmacionFeedback");

let desuscribir = null;
let editandoId = null;
let editandoCreadoEn = null;
const docsCache = new Map();

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

// ---------- Cambio de contraseña ----------
function abrirModalPass() {
  passFeedback.textContent = "";
  passFeedback.className = "feedback";
  formPass.reset();
  modalPass.hidden = false;
  formPass.passActual.focus();
}

function cerrarModalPass() {
  modalPass.hidden = true;
  passFeedback.textContent = "";
  passFeedback.className = "feedback";
}

if (btnCambiarPass) {
  btnCambiarPass.addEventListener("click", abrirModalPass);
}

if (btnCancelarPass) {
  btnCancelarPass.addEventListener("click", cerrarModalPass);
}

if (modalPass) {
  modalPass.addEventListener("click", (e) => {
    if (e.target === modalPass) cerrarModalPass();
  });
}

if (formPass && btnGuardarPass) {
  formPass.addEventListener("submit", async (e) => {
    e.preventDefault();
    passFeedback.textContent = "";
    passFeedback.className = "feedback";

    const actual = formPass.passActual.value;
    const nueva = formPass.passNueva.value;
    const confirm = formPass.passConfirm.value;

    if (!actual || !nueva || !confirm) {
      passFeedback.textContent = "Completá todos los campos.";
      passFeedback.classList.add("error");
      return;
    }
    if (nueva.length < 6) {
      passFeedback.textContent = "La contraseña debe tener al menos 6 caracteres.";
      passFeedback.classList.add("error");
      return;
    }
    if (nueva !== confirm) {
      passFeedback.textContent = "Las contraseñas no coinciden.";
      passFeedback.classList.add("error");
      return;
    }
    if (nueva === actual) {
      passFeedback.textContent = "La nueva contraseña debe ser distinta de la actual.";
      passFeedback.classList.add("error");
      return;
    }

    btnGuardarPass.disabled = true;
    btnGuardarPass.textContent = "Guardando…";

    try {
      const usuario = authApp.currentUser;
      if (!usuario) throw { code: "auth/sesion-expirada" };

      const credencial = firebase.auth.EmailAuthProvider.credential(usuario.email, actual);
      await usuario.reauthenticateWithCredential(credencial);
      await usuario.updatePassword(nueva);

      passFeedback.classList.add("ok");
      passFeedback.textContent = "Contraseña actualizada correctamente.";
      setTimeout(cerrarModalPass, 1400);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      let mensaje = "No se pudo actualizar la contraseña.";
      if (error.code === "auth/wrong-password") {
        mensaje = "La contraseña actual no es correcta.";
      } else if (error.code === "auth/weak-password") {
        mensaje = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === "auth/too-many-requests") {
        mensaje = "Demasiados intentos. Esperá un momento y volvé a intentar.";
      }
      passFeedback.textContent = mensaje;
      passFeedback.classList.add("error");
    } finally {
      btnGuardarPass.disabled = false;
      btnGuardarPass.textContent = "Guardar";
    }
  });
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
  docsCache.clear();
  snapshot.forEach((doc) => {
    const d = doc.data();
    docs.push({ id: doc.id, ...d });
    docsCache.set(doc.id, d);
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
        <div class="confirmacion ${d.asiste ? "" : "no-asiste"}" data-id="${escapar(d.id)}">
          <div class="nombre">${escapar(d.nombre)}</div>
          <div class="detalle">
            ${d.asiste ? "Asiste" : "No podrá asistir"}
            <span> · ${fecha}</span>
          </div>
          ${telefono}
          ${restricciones}
          ${musica}
          ${mensaje}
          <div class="confirmacion-acciones">
            <button type="button" class="btn btn-mini" data-accion="editar">Editar</button>
            <button type="button" class="btn btn-mini btn-peligro" data-accion="borrar">Eliminar</button>
          </div>
        </div>`;
    })
    .join("");
}

// ---------- Borrar / editar / agregar ----------
if (lista) {
  lista.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-accion]");
    if (!btn) return;

    const tarjeta = btn.closest(".confirmacion");
    const id = tarjeta && tarjeta.dataset.id;
    if (!id) return;

    if (btn.dataset.accion === "borrar") {
      const nombre = tarjeta.querySelector(".nombre").textContent;
      if (!confirm(`¿Eliminar la confirmación de ${nombre}?`)) return;

      btn.disabled = true;
      try {
        await db.collection("confirmaciones").doc(id).delete();
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar. Revisá la consola para más detalle.");
        btn.disabled = false;
      }
    }

    if (btn.dataset.accion === "editar") {
      const datos = docsCache.get(id);
      if (!datos) {
        alert("Esta confirmación ya no existe.");
        return;
      }
      abrirModalConfirmacion("editar", { id, ...datos });
    }
  });
}

function abrirModalConfirmacion(modo, datos) {
  editandoId = modo === "editar" ? datos.id : null;
  editandoCreadoEn = modo === "editar" ? datos.creadoEn || null : null;
  modalConfirmacionTitulo.textContent = modo === "editar" ? "Editar confirmación" : "Agregar confirmación";
  confirmacionFeedback.textContent = "";
  confirmacionFeedback.className = "feedback";
  formConfirmacion.reset();

  if (modo === "editar") {
    formConfirmacion.nombre.value = datos.nombre || "";
    formConfirmacion.telefono.value = datos.telefono || "";
    const asisteRadio = formConfirmacion.querySelector(`input[name="confAsiste"][value="${datos.asiste ? "si" : "no"}"]`);
    if (asisteRadio) asisteRadio.checked = true;
    formConfirmacion.restricciones.value = datos.restricciones || "";
    formConfirmacion.musica.value = datos.musica || "";
    formConfirmacion.mensaje.value = datos.mensaje || "";
  }

  modalConfirmacion.hidden = false;
  formConfirmacion.nombre.focus();
}

function cerrarModalConfirmacion() {
  modalConfirmacion.hidden = true;
  editandoId = null;
  editandoCreadoEn = null;
}

if (btnAgregar) {
  btnAgregar.addEventListener("click", () => abrirModalConfirmacion("agregar"));
}

if (btnCancelarConfirmacion) {
  btnCancelarConfirmacion.addEventListener("click", cerrarModalConfirmacion);
}

if (modalConfirmacion) {
  modalConfirmacion.addEventListener("click", (e) => {
    if (e.target === modalConfirmacion) cerrarModalConfirmacion();
  });
}

if (formConfirmacion && btnGuardarConfirmacion) {
  formConfirmacion.addEventListener("submit", async (e) => {
    e.preventDefault();
    confirmacionFeedback.textContent = "";
    confirmacionFeedback.className = "feedback";

    const nombre = formConfirmacion.nombre.value.trim();
    const telefono = formConfirmacion.telefono.value.trim();
    const asisteInput = formConfirmacion.querySelector('input[name="confAsiste"]:checked');
    const restricciones = formConfirmacion.restricciones.value.trim();
    const musica = formConfirmacion.musica.value.trim();
    const mensaje = formConfirmacion.mensaje.value.trim();

    if (!nombre) {
      confirmacionFeedback.textContent = "Ingresá el nombre.";
      confirmacionFeedback.classList.add("error");
      return;
    }
    if (!telefono) {
      confirmacionFeedback.textContent = "Ingresá el teléfono.";
      confirmacionFeedback.classList.add("error");
      return;
    }
    if (!asisteInput) {
      confirmacionFeedback.textContent = "Elegí si asiste o no.";
      confirmacionFeedback.classList.add("error");
      return;
    }

    const clave = claveConfirmacion(nombre, telefono);
    const coleccion = db.collection("confirmaciones");

    btnGuardarConfirmacion.disabled = true;
    btnGuardarConfirmacion.textContent = "Guardando…";

    try {
      const datos = {
        nombre,
        telefono,
        asiste: asisteInput.value === "si",
        restricciones,
        musica,
        mensaje
      };

      if (!editandoId) {
        if (docsCache.has(clave)) {
          confirmacionFeedback.textContent = "Ya existe una confirmación con ese nombre y teléfono.";
          confirmacionFeedback.classList.add("error");
          btnGuardarConfirmacion.disabled = false;
          btnGuardarConfirmacion.textContent = "Guardar";
          return;
        }
        await coleccion.doc(clave).set({
          ...datos,
          creadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else if (editandoId !== clave) {
        if (docsCache.has(clave)) {
          confirmacionFeedback.textContent = "Ya existe otra confirmación con ese nombre y teléfono.";
          confirmacionFeedback.classList.add("error");
          btnGuardarConfirmacion.disabled = false;
          btnGuardarConfirmacion.textContent = "Guardar";
          return;
        }
        const lote = db.batch();
        lote.set(coleccion.doc(clave), {
          ...datos,
          creadoEn: editandoCreadoEn || firebase.firestore.FieldValue.serverTimestamp()
        });
        lote.delete(coleccion.doc(editandoId));
        await lote.commit();
      } else {
        await coleccion.doc(editandoId).update(datos);
      }

      cerrarModalConfirmacion();
    } catch (error) {
      console.error("Error al guardar la confirmación:", error);
      confirmacionFeedback.textContent = "No se pudo guardar. Revisá la consola para más detalle.";
      confirmacionFeedback.classList.add("error");
    } finally {
      btnGuardarConfirmacion.disabled = false;
      btnGuardarConfirmacion.textContent = "Guardar";
    }
  });
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