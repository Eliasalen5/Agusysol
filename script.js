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