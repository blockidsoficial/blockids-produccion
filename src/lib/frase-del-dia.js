// Frases rotativas del panel (saludo de Inicio, tip del día del alumno,
// mensaje de ánimo del profesor). Cada sección tiene su propia lista, pero
// todas rotan igual: una vez por día calendario (hora local del usuario), no
// en cada carga de página ni al navegar entre vistas. Todos los que entren
// el mismo día ven la misma frase por sección, y no depende de recordar cuál
// tocó ayer ni de que el usuario haya entrado "ayer" para llevar la cuenta.

// Hash de texto tipo djb2: determinista (mismo texto -> mismo número) pero
// sin el patrón obvio de un simple "día del año % N", que repetiría las
// frases siempre en el mismo orden.
const hashTexto = (texto) => {
    let hash = 5381;
    for (let i = 0; i < texto.length; i++) {
        hash = ((hash << 5) + hash) + texto.charCodeAt(i); // hash * 33 + charCode
    }
    return Math.abs(hash);
};

// YYYY-MM-DD en hora LOCAL (no toISOString, que es UTC) — así la frase
// cambia a la medianoche del usuario, no a la medianoche de Greenwich.
const fechaLocalISO = (fecha) => {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Elige una frase de `lista` estable durante todo el día de hoy. `sal` es
// una "semilla" propia de cada sección: sin ella, dos listas de igual
// longitud caerían siempre en el mismo índice el mismo día y se verían dos
// frases distintas pero "sincronizadas" de forma rara.
const fraseEstableDelDia = (lista, sal) => {
    if (!lista || lista.length === 0) return '';
    const indice = hashTexto(fechaLocalISO(new Date()) + sal) % lista.length;
    return lista[indice];
};

// ── Saludo del header (alumno y profesor) ───────────────────────────────────
const FRASES_SALUDO = [
    '¡Listo para crear algo increíble hoy!',
    'Cada línea de código es un paso más hacia tu meta.',
    'El éxito es la suma de pequeños esfuerzos repetidos día con día.',
    '¡Qué bueno verte de nuevo por aquí, a romperla!',
    'Hoy es un gran día para aprender y enseñar algo nuevo.',
    'La constancia es la clave del verdadero éxito técnico.',
    '¡Imagina, programa y hazlo realidad!',
    'Un gran poder conlleva una gran responsabilidad... ¡y mucho código!',
    'Pasito a pasito se construyen los grandes proyectos.',
    '¡Tu esfuerzo de hoy es el futuro de mañana!',
];

// Frase estable durante todo el día de hoy. Se puede llamar directo como
// inicializador perezoso de useState: useState(fraseDelDia).
export const fraseDelDia = () => fraseEstableDelDia(FRASES_SALUDO, 'saludo');

// ── Tip del día (panel de Inicio del alumno) ────────────────────────────────
const TIPS_DEL_DIA = [
    'Usa bloques de repetición para hacer tu código más eficiente.',
    'Prueba tu proyecto seguido: así detectas errores más rápido.',
    'Ponle nombres claros a tus variables para no perderte.',
    'Los bloques condicionales te ayudan a tomar decisiones en tu código.',
    'Divide tu proyecto en partes pequeñas: es más fácil programarlo paso a paso.',
    'Guarda tu proyecto con frecuencia para no perder tu progreso.',
    'Experimenta combinando bloques distintos: ¡así se descubren cosas nuevas!',
    'Los comentarios en tu código ayudan a recordar qué hace cada parte.',
    'Si algo no funciona, revisa bloque por bloque hasta encontrar el error.',
    'Compartir tu proyecto con tus compañeros te ayuda a aprender más rápido.',
];

export const tipDelDia = () => fraseEstableDelDia(TIPS_DEL_DIA, 'tip-alumno');

// ── Mensaje de ánimo (panel de Inicio del profesor) ─────────────────────────
const FRASES_ANIMO_PROFESOR = [
    '¡Sigue así! Estás ayudando a tus estudiantes a aprender y crear.',
    'Cada clase que impartes siembra una nueva idea en tus alumnos.',
    'Tu paciencia de hoy es el aprendizaje de mañana para tus estudiantes.',
    'Gracias por inspirar a la próxima generación de creadores.',
    'Un buen profesor no solo enseña código, enseña a pensar.',
    'Tus estudiantes aprenden tanto de tus clases como de tu ejemplo.',
    '¡Excelente trabajo! Sigue guiando a tus alumnos paso a paso.',
    'Cada proyecto entregado es un logro que tú hiciste posible.',
    'La curiosidad de tus estudiantes crece gracias a tu dedicación.',
    '¡Tu esfuerzo como docente transforma vidas, un bloque a la vez!',
];

export const fraseAnimoProfesor = () => fraseEstableDelDia(FRASES_ANIMO_PROFESOR, 'animo-profesor');
