// ============================================================
//  CARRUSEL DE FOTOS (autoplay con fundido)
// ============================================================
const intervaloMs = 4000;

function iniciarCarrusel() {
  const imagenes = document.querySelectorAll(".pista img");
  if (!imagenes.length) return;

  let actual = 0;
  imagenes[0].classList.add("activa");

  setInterval(() => {
    imagenes[actual].classList.remove("activa");
    actual = (actual + 1) % imagenes.length;
    imagenes[actual].classList.add("activa");
  }, intervaloMs);
}

iniciarCarrusel();

// ============================================================
//  CONTADOR REGRESIVO hasta la boda
//  (año, mes-1, día, hora, min, seg — Noviembre = 10)
// ============================================================
const fechaBoda = new Date(2026, 10, 21, 17, 0, 0);
const cdDias = document.getElementById("cdDias");
const cdHoras = document.getElementById("cdHoras");
const cdMin = document.getElementById("cdMin");
const cdSeg = document.getElementById("cdSeg");

function pad(n) {
  return String(n).padStart(2, "0");
}

function actualizarContador() {
  if (!cdDias || !cdHoras || !cdMin || !cdSeg) return;

  const dif = fechaBoda - new Date();

  if (dif <= 0) {
    cdDias.textContent = "00";
    cdHoras.textContent = "00";
    cdMin.textContent = "00";
    cdSeg.textContent = "00";
    return;
  }

  const segundos = Math.floor(dif / 1000);
  cdDias.textContent = pad(Math.floor(segundos / 86400));
  cdHoras.textContent = pad(Math.floor((segundos % 86400) / 3600));
  cdMin.textContent = pad(Math.floor((segundos % 3600) / 60));
  cdSeg.textContent = pad(segundos % 60);
}

actualizarContador();
setInterval(actualizarContador, 1000);

// ============================================================
//  FORMULARIO DE CONFIRMACIÓN (RSVP -> Firestore)
// ============================================================
const form = document.getElementById("formularioRsvp");
const feedback = document.getElementById("feedback");
const btnEnviar = document.getElementById("btnEnviar");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    feedback.textContent = "";
    feedback.className = "feedback";

    if (!firebaseListo) {
      feedback.textContent = "Firebase aún no está configurado. Revisá firebase-config.js.";
      feedback.classList.add("error");
      return;
    }

    const nombre = form.nombre.value.trim();
    const acompanantes = parseInt(form.acompanantes.value, 10);
    const asiste = form.querySelector('input[name="asiste"]:checked');
    const mensaje = form.mensaje.value.trim();

    if (!nombre) {
      marcarInvalido(form.nombre);
      feedback.textContent = "Contanos tu nombre, por favor.";
      feedback.classList.add("error");
      return;
    }
    if (!asiste) {
      feedback.textContent = "Decinos si podés venir para preparar todo.";
      feedback.classList.add("error");
      return;
    }
    if (Number.isNaN(acompanantes) || acompanantes < 0) {
      marcarInvalido(form.acompanantes);
      feedback.textContent = "Indicá una cantidad válida de acompañantes.";
      feedback.classList.add("error");
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando…";

    try {
      await db.collection("confirmaciones").add({
        nombre,
        acompanantes,
        asiste: asiste.value === "si",
        mensaje,
        creadoEn: firebase.firestore.FieldValue.serverTimestamp()
      });

      feedback.textContent = "¡Gracias! Tu confirmación fue recibida. 💛";
      feedback.classList.add("ok");
      form.reset();
      form.acompanantes.value = "0";
    } catch (error) {
      console.error("Error al guardar la confirmación:", error);
      feedback.textContent = "Hubo un problema al enviar. Intentá de nuevo.";
      feedback.classList.add("error");
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Confirmar asistencia";
    }
  });
}

function marcarInvalido(campo) {
  campo.classList.add("input-invalido");
  campo.addEventListener("input", () => campo.classList.remove("input-invalido"), { once: true });
}