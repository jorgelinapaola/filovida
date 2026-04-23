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
    
    const isFullyRegistered = currentUser && state.registrado;

    if (isFullyRegistered) {
        if (heroTitle) heroTitle.innerHTML = `¡Bienvenido/a ${state.usuario.nombre}<br>a FilosVida!`;
        if (btnRitualStart) (btnRitualStart as HTMLElement).style.display = 'none';
        if (btnPacksHero) (btnPacksHero as HTMLElement).style.display = 'flex';
        imGrid?.classList.remove('is-locked');
        document.querySelectorAll('.im-card').forEach(c => c.classList.add('unlocked'));
    } else {
        if (heroTitle) heroTitle.innerHTML = `¿El universo habla?<br>Quieres escucharlo`;
        if (btnRitualStart) (btnRitualStart as HTMLElement).style.display = 'flex';
        if (btnPacksHero) (btnPacksHero as HTMLElement).style.display = 'none';
        imGrid?.classList.add('is-locked');
    }

    if (btnLogout) (btnLogout as HTMLElement).style.display = currentUser ? 'block' : 'none';

    // Manejo de Pasos en el Ritual
    if (!currentUser) {
        ritualStep1?.classList.add('active');
        ritualStep2?.classList.remove('active');
    } else if (!state.registrado) {
        ritualStep1?.classList.remove('active');
        ritualStep2?.classList.add('active');
    } else {
        modalRitual?.classList.remove('active');
    }
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
    modalRitual?.classList.add('active');
});

document.getElementById('btn-close-ritual')?.addEventListener('click', () => {
    modalRitual?.classList.remove('active');
});

document.getElementById('btn-finalizar-ritual')?.addEventListener('click', async () => {
    const nombre = (document.getElementById('reg-nombre') as HTMLInputElement).value;
    const fecha = (document.getElementById('reg-fecha') as HTMLInputElement).value;
    const hora = (document.getElementById('reg-hora') as HTMLInputElement).value;
    const lugar = (document.getElementById('reg-lugar') as HTMLInputElement).value;

    if (!nombre || !fecha) return notify("Faltan datos de sintonía");

    if (currentUser) {
        try {
            await saveUserProgress(currentUser.uid, {
                registrado: true,
                usuario: { nombre, nacimiento: fecha, hora, lugar }
            });
            notify("✨ Sintonía completada");
            modalRitual?.classList.remove('active');
        } catch (e) {
            notify("Error al guardar");
        }
    }
});

/* ── EVENTOS DE NAVEGACIÓN ── */
document.getElementById('nav-inicio')?.addEventListener('click', () => goTo('inicio'));
document.getElementById('nav-packs')?.addEventListener('click', () => goTo('packs'));
document.querySelectorAll('.btn-volver-inicio').forEach(btn => {
    btn.addEventListener('click', () => goTo('inicio'));
});

// Tarjetas del home
document.getElementById('card-diario')?.addEventListener('click', () => {
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
