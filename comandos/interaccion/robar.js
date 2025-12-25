// comandos/interaccion/robar.js
import { getUsuario, agregarXP, guardarDB, cargarDB } from '../data/usuarios.js';
import { withHeader, RG } from '../../utils/globalHeader.js';
import { enviarImagen } from '../gestion/constGlobal.js';
import { IMAGENES } from '../gestion/imagenesGlobales.js';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Configuración de Seguridad y Límites
const COOLDOWN_TIME = 6000; // 6 segundos
const LIMITE_DIARIO = 50;

export async function robar(sock, m) {
    const from = m.key.remoteJid;
    const thiefId = m.key.participant || m.key.remoteJid;
    const thiefNumber = thiefId.split('@')[0];

    try {
        // 1. OBTENER VÍCTIMA
        let victimId = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                       m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!victimId || victimId === thiefId) {
            return sock.sendMessage(from, { text: withHeader(RG + "❌ ¡Error de puntería! Menciona a alguien para asaltarlo.") }, { quoted: m });
        }

        const victimNumber = victimId.split('@')[0];
        
        // --- CARGAR DB ---
        const db = cargarDB();
        const thief = getUsuario(thiefId);
        const hoy = new Date().toDateString();

        // 2. SISTEMA DE LÍMITES (Anti-Abuso)
        thief.statsRobo = thief.statsRobo || { fecha: hoy, usos: 0, lastUse: 0 };
        
        if (thief.statsRobo.fecha !== hoy) {
            thief.statsRobo.usos = 0;
            thief.statsRobo.fecha = hoy;
        }

        const tiempoTranscurrido = Date.now() - thief.statsRobo.lastUse;
        if (tiempoTranscurrido < COOLDOWN_TIME) {
            const restante = Math.ceil((COOLDOWN_TIME - tiempoTranscurrido) / 1000);
            return sock.sendMessage(from, { text: `⏳ *¡Tranquilo, manos largas!* Espera ${restante}s.` });
        }

        if (thief.statsRobo.usos >= LIMITE_DIARIO) {
            return sock.sendMessage(from, { text: `🚫 *Límite diario alcanzado:* (Max ${LIMITE_DIARIO} robos).` });
        }

        // 3. ENGAÑO ANTI-BAN (Simular Escritura)
        await sock.sendPresenceUpdate('composing', from);
        
        const victim = getUsuario(victimId);
        if (victim.experiencia < 50) {
            return sock.sendMessage(from, { text: `⚠️ @${victimNumber} está en la quiebra. No tiene sentido robarle.` }, { mentions: [victimId] });
        }

        // 4. ANIMACIÓN DE ACCIÓN
        const { key } = await sock.sendMessage(from, { 
            text: withHeader(`🕵️‍♂️ @${thiefNumber} acecha las sombras de @${victimNumber}...`) 
        }, { mentions: [thiefId, victimId] });
        
        await delay(2000);
        await sock.sendMessage(from, { text: `⚡ *Forzando cerraduras...*\n[▓▓▓▓▓░░░░░] 50%`, edit: key });
        await delay(2000);

        // 5. CÁLCULO DE ÉXITO (45% Probabilidad)
        const exito = Math.random() > 0.55;
        let mensajeFinal = "";
        const imagenBot = IMAGENES.general[0] || "https://i.imgur.com/uRovL76.png";

        if (exito) {
            const robado = Math.floor(Math.random() * (victim.experiencia * 0.20)) + 15;
            agregarXP(victimId, -robado);
            agregarXP(thiefId, robado);
            
            mensajeFinal = `✨ *¡ATRACON EXITOSO!* ✨\n\n` +
                           `👤 *Asaltante:* @${thiefNumber}\n` +
                           `📉 *Víctima:* @${victimNumber}\n` +
                           `💰 *Botín:* +${robado} XP\n\n` +
                           `_¡Escapó por los callejones!_ 🏃‍♂️💨`;
        } else {
            const multa = 40;
            agregarXP(thiefId, -multa);
            
            mensajeFinal = `🚨 *¡ALARMA ACTIVADA!* 🚨\n\n` +
                           `@${thiefNumber} fue capturado por la seguridad de @${victimNumber}.\n\n` +
                           `👮 *Pena:* -${multa} XP\n` +
                           `_¡Directo a la celda!_ ⛓️`;
        }

        // Actualizar estadísticas
        thief.statsRobo.usos += 1;
        thief.statsRobo.lastUse = Date.now();
        guardarDB(db);

        // 6. CIERRE CON IMAGEN Y ENCABEZADO
        await sock.sendMessage(from, { delete: key });
        await enviarImagen(sock, from, imagenBot, withHeader(RG + mensajeFinal), "SISTEMA DE ASALTOS - THE RICK V2", [thiefId, victimId], m);

    } catch (err) {
        console.error("Error en Robar:", err);
    }
}
