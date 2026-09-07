// ─────────────────────────────────────────────────────────────────────────────
// Guardia de navegación: evita perder cambios sin guardar al cambiar de vista
// dentro del dashboard (el <beforeunload> del navegador solo cubre cerrar o
// recargar la pestaña, no la navegación interna de la SPA).
//
// Uso:
//   - La vista con un formulario llama marcarCambiosSinGuardar(true/false)
//     según tenga cambios pendientes, y lo limpia al desmontarse.
//   - El layout llama puedeNavegar() antes de cambiar de vista o cerrar sesión.
// ─────────────────────────────────────────────────────────────────────────────

let hayCambiosSinGuardar = false;

export const marcarCambiosSinGuardar = (valor) => {
    hayCambiosSinGuardar = Boolean(valor);
};

export const puedeNavegar = () => {
    if (!hayCambiosSinGuardar) return true;
    const confirmado = window.confirm(
        'Tienes cambios sin guardar. Si sales ahora se perderán. ¿Deseas continuar?'
    );
    if (confirmado) hayCambiosSinGuardar = false;
    return confirmado;
};
