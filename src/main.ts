import './style.css'
import { subscribeToAuthChanges, loginWithEmail, signUpWithEmail, loginWithGoogle, logout } from './services/auth'
import { subscribeToUserData, saveUserProgress, updateLunas, addConsultation } from './services/store'
import type { UserState } from './services/store'

/* ── ESTADO GLOBAL ── */
let currentUser: any = null;
let state: UserState = {
    lunas: 10,
    registrado: false,
    usuario: { nombre: '', nacimiento: '', hora: '', lugar: '' },
    historial: []
};

// Cargar estado local inicial (opcional, para persistencia entre sesiones si no hay login)
const savedLocal = localStorage.getItem('filosvida_local_user');
if (savedLocal) {
    try {
        const localData = JSON.parse(savedLocal);
        state = { ...state, ...localData };
    } catch (e) {
        console.error("Error al cargar estado local");
    }
}

/* ── SELECTORES UI ── */
const pages = document.querySelectorAll('.page');
const moonVal = document.getElementById('moon-val');
const lunaLabel = document.getElementById('luna-label');
const heroTitle = document.getElementById('hero-title');
const btnRitualStart = document.getElementById('btn-ritual-start');
const btnPacksHero = document.getElementById('btn-packs-hero');
const btnLogout = document.getElementById('btn-logout');
const imGrid = document.querySelector('.im-grid');
const modalRitual = document.getElementById('modal-ritual');
const ritualStep1 = document.getElementById('ritual-step-1');
const ritualStep2 = document.getElementById('ritual-step-2');

/* ── NAVEGACIÓN ── */
function goTo(id: string) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + id);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function notify(text: string) {
    const el = document.getElementById('notif');
    if (el) {
        el.innerText = text;
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 3000);
    }
}

function translateError(code: string): string {
    switch (code) {
        case 'auth/invalid-email': return "El formato del correo electrónico no es válido.";
        case 'auth/user-disabled': return "Esta cuenta de usuario ha sido inhabilitada.";
        case 'auth/user-not-found': return "No existe ningún usuario con este correo electrónico.";
        case 'auth/wrong-password': return "La contraseña es incorrecta.";
        case 'auth/invalid-credential': return "Credenciales inválidas. Verifica tu correo y contraseña.";
        case 'auth/email-already-in-use': return "Este correo electrónico ya está en uso.";
        case 'auth/weak-password': return "La contraseña debe tener al menos 6 caracteres.";
        case 'auth/popup-closed-by-user': return "Se cerró la ventana de Google antes de completar.";
        default: return "Ocurrió un error inesperado. Inténtalo de nuevo.";
    }
}

/* ── SINCRONIZACIÓN DE UI ── */
function updateUI() {
    if (moonVal) moonVal.innerText = state.lunas.toString();
    if (lunaLabel) lunaLabel.innerText = state.lunas > 0 ? (state.registrado ? 'TOCA PARA RECARGAR' : 'GRATIS') : '¡RECARGA!';
    
    const isLoggedIn = currentUser !== null;

    if (isLoggedIn) {
        const displayName = state.usuario.nombre || (currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'viajero/a');
        if (heroTitle) heroTitle.innerHTML = `¡Bienvenido/a ${displayName}<br>a FilosVida!`;
        if (btnRitualStart) (btnRitualStart as HTMLElement).style.display = 'none';
        if (btnPacksHero) (btnPacksHero as HTMLElement).style.display = 'flex';
        imGrid?.classList.remove('is-locked');
        document.querySelectorAll('.im-card').forEach(c => c.classList.add('unlocked'));
        modalRitual?.classList.remove('active');
    } else {
        if (heroTitle) heroTitle.innerHTML = `¿El universo habla?<br>Quieres escucharlo`;
        if (btnRitualStart) (btnRitualStart as HTMLElement).style.display = 'flex';
        if (btnPacksHero) (btnPacksHero as HTMLElement).style.display = 'none';
        imGrid?.classList.add('is-locked');
        document.querySelectorAll('.im-card').forEach(c => c.classList.remove('unlocked'));
    }

    if (btnLogout) (btnLogout as HTMLElement).style.display = isLoggedIn ? 'block' : 'none';
}

/* ── AUTENTICACIÓN ── */
subscribeToAuthChanges(async (user) => {
    const wasLoggedOut = !currentUser;
    currentUser = user;

    if (user) {
        subscribeToUserData(user.uid, (data) => {
            state = data;
            updateUI();
            
            if (wasLoggedOut && state.registrado) {
                notify(`✨ ¡Bienvenido/a de nuevo, ${state.usuario.nombre}!`);
            }
        });
    } else {
        updateUI();
        modalRitual?.classList.add('active');
    }
});

// Eventos de Auth (dentro del Ritual)
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = (document.getElementById('auth-email') as HTMLInputElement).value;
    const pass = (document.getElementById('auth-pass') as HTMLInputElement).value;
    if (!email || !pass) return notify("Completa los datos");
    try {
        await loginWithEmail(email, pass);
    } catch (e: any) {
        notify(translateError(e.code));
    }
});

document.getElementById('btn-signup')?.addEventListener('click', async () => {
    const email = (document.getElementById('auth-email') as HTMLInputElement).value;
    const pass = (document.getElementById('auth-pass') as HTMLInputElement).value;
    if (!email || !pass) return notify("Completa los datos");
    try {
        await signUpWithEmail(email, pass);
    } catch (e: any) {
        notify(translateError(e.code));
    }
});

document.getElementById('btn-google')?.addEventListener('click', async () => {
    try {
        await loginWithGoogle();
    } catch (e: any) {
        notify("Error con Google");
    }
});

btnLogout?.addEventListener('click', () => {
    logout();
    location.reload(); // Recargar para limpiar estado
});

/* ── PERFIL / RITUAL ── */
btnRitualStart?.addEventListener('click', () => {
    if (!currentUser) {
        modalRitual?.classList.add('active');
    } else {
        // Si ya está logeado, desplazar a la cuadrícula de módulos
        imGrid?.scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('btn-close-ritual')?.addEventListener('click', () => {
    modalRitual?.classList.remove('active');
});

    // Eliminar el listener antiguo de finalizar ritual global si existe o dejarlo vacío

/* ── NAVEGACIÓN ENTRE PASOS DEL MODAL (LIMPIEZA) ── */
// Ya no son necesarios los botones de navegación interna del modal de sintonía global

/* ── EVENTOS DE NAVEGACIÓN ── */
document.getElementById('nav-inicio')?.addEventListener('click', () => goTo('inicio'));
document.getElementById('nav-packs')?.addEventListener('click', () => goTo('packs'));
document.querySelectorAll('.btn-volver-inicio').forEach(btn => {
    btn.addEventListener('click', () => goTo('inicio'));
});

// Tarjetas del home
document.getElementById('card-tarot')?.addEventListener('click', () => {
    if (!state.registrado) return;
    notify("🔮 Módulo Tarot IA próximamente...");
    // renderTarot();
    // goTo('tarot');
});

document.getElementById('card-iching')?.addEventListener('click', () => {
    if (!state.registrado) return;
    notify("☯️ Módulo I Ching próximamente...");
});

document.getElementById('card-astral')?.addEventListener('click', () => {
    if (!currentUser) return modalRitual?.classList.add('active');
    renderAstral();
    goTo('astral');
});

function renderAstral() {
    const form = document.getElementById('astral-sintonia-form');
    const result = document.getElementById('astral-result');
    const nameDisplay = document.getElementById('astral-user-name');
    const interp = document.getElementById('astral-interpretation');

    if (!state.registrado) {
        if (form) form.style.display = 'block';
        if (result) result.style.display = 'none';
    } else {
        if (form) form.style.display = 'none';
        if (result) result.style.display = 'block';
        if (nameDisplay) nameDisplay.innerText = `Carta Astral de ${state.usuario.nombre}`;
        if (interp) interp.innerHTML = `
            Basado en tu nacimiento el <b>${state.usuario.nacimiento}</b> en <b>${state.usuario.lugar}</b>, 
            el cielo revela una fuerte influencia de la energía actual sobre tu camino personal... 
            <br><br>
            Tu Sol en equilibrio con el momento presente sugiere una etapa de claridad y nuevos comienzos.
        `;
    }
}

document.getElementById('btn-save-astral-sintonia')?.addEventListener('click', async () => {
    const nombre = (document.getElementById('astral-nombre') as HTMLInputElement).value;
    const fecha = (document.getElementById('astral-fecha') as HTMLInputElement).value;
    const hora = (document.getElementById('astral-hora') as HTMLInputElement).value;
    const lugar = (document.getElementById('astral-lugar') as HTMLInputElement).value;

    if (!nombre || !fecha) return notify("Faltan datos de sintonía");

    const updates = {
        registrado: true,
        usuario: { nombre, nacimiento: fecha, hora, lugar }
    };

    if (currentUser) {
        try {
            await saveUserProgress(currentUser.uid, updates);
            notify("✨ Sintonía guardada y Carta Astral generada");
            renderAstral();
        } catch (e) {
            notify("Error al guardar en la nube");
        }
    }
});

document.getElementById('card-suenos')?.addEventListener('click', () => {
    if (!state.registrado) return;
    notify("🌌 Módulo Sueños próximamente...");
});

document.getElementById('card-filosofia')?.addEventListener('click', () => {
    if (!state.registrado) return;
    notify("🦉 Módulo Filosofía próximamente...");
});

document.getElementById('card-diario')?.addEventListener('click', () => {
    if (!state.registrado) return;
    renderDiario();
    goTo('diario');
});

function renderDiario() {
    const list = document.getElementById('diario-lista');
    if (!list) return;
    if (state.historial.length === 0) {
        list.innerHTML = '<p style="text-align:center; opacity:0.5; padding: 40px 0;">Aún no has realizado consultas.</p>';
        return;
    }
    list.innerHTML = state.historial.map(item => `
        <div style="background: white; border-radius: 15px; padding: 18px; margin-bottom: 15px; border-left: 5px solid var(--lila); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="font-size: 11px; opacity: 0.5; font-weight: 800; margin-bottom: 5px;">${item.fecha} • ${item.modulo.toUpperCase()}</div>
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 8px;">"${item.pregunta}"</div>
            <div style="font-size: 13px; opacity: 0.8; font-style: italic; line-height: 1.5;">${item.resultado}</div>
        </div>
    `).join('');
}

console.log("FilosVida: Flujo Unificado Activo");
