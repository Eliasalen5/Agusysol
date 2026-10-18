// ============================================================
//  UTILIDADES COMPARTIDAS (sitio público y panel admin)
//  Clave única de confirmación: nombre normalizado + teléfono
// ============================================================
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizarDigitos(texto) {
  return texto.replace(/\D/g, "");
}

function claveConfirmacion(nombre, telefono) {
  return `${normalizarTexto(nombre)}__${normalizarDigitos(telefono)}`;
}
