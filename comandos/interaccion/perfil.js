import { getUsuario } from '../data/usuarios.js';
import { enviarImagen } from '../gestion/constGlobal.js';
import { withHeader, RG, MG } from '../../utils/globalHeader.js';

const XP_POR_NIVEL = 500;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function perfil(sock, m) {
    const from = m.key.remoteJid;
    
    // 1. Identificar al usuario (Prioridad: Mención > Respuesta > El que escribe)
    const userId = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message?.extendedTextMessage?.contextInfo?.participant || 
                   m.key.participant || 
                   m.key.remoteJid;

    // Simulación de escritura para protección
    await sock.sendPresenceUpdate('composing', from);

    try {
        // Obtenemos los datos (getUsuario ya maneja el registro automático)
        const user = getUsuario(userId); 

        // 2. Obtener Foto de Perfil con bloque Try/Catch robusto
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(userId, 'image');
        } catch {
            // Imagen por defecto si no tiene foto pública o hay error de carga
            ppUrl = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        }

        // 3. Cálculos de Nivel y Barra
        const nivel = Math.floor((user.experiencia || 0) / XP_POR_NIVEL) + 1;
        const xpActual = (user.experiencia || 0) % XP_POR_NIVEL;
        const barraTotal = 10;
        const llenas = Math.floor((xpActual / XP_POR_NIVEL) * barraTotal);
        const barra = '🟦'.repeat(llenas) + '⬜'.repeat(barraTotal - llenas);

        // 4. Formatear Inventario con Iconos
        let inv = "";
        if (user.inventario) {
            const items = Object.entries(user.inventario).filter(([_, cant]) => cant > 0);
            inv = items.map(([name, cant]) => {
                const icon = name === 'hierro' ? '⛓️' : name === 'oro' ? '✨' : name === 'diamante' ? '💎' : '💚';
                return `   ${icon} ${name.toUpperCase()}: ${cant}`;
            }).join('\n');
        }
        if (!inv) inv = "   _Inventario vacío_";

        // 5. Construcción del Mensaje Visual
        const perfilTexto = withHeader(RG + 
            `👤 *STATUS DE EXPLORADOR*\n\n` +
            `📝 *Nombre:* ${m.pushName || 'Usuario'}\n` +
            `🎖️ *Rango:* ${nivel >= 5 ? '⚔️ Veterano' : '🌱 Recluta'}\n` +
            `🎖️ *Nivel:* ${nivel}\n` +
            `✨ *Experiencia:* ${user.experiencia || 0} XP\n\n` +
            `📈 *Progreso de Nivel:*\n` +
            `   [${barra}] ${xpActual}/${XP_POR_NIVEL}\n\n` +
            `⛏️ *Mina:*\n` +
            `   • Diarios: ${user.minarDiario || 0}/20\n` +
            `   • Racha: ${user.minarSeguido || 0}\n\n` +
            `📦 *INVENTARIO REAL:*\n${inv}\n\n` +
            `💰 *Tip:* ¡Usa .vender para obtener XP!`
        );

        // 6. Enviar con retraso pequeño para parecer humano
        await delay(500);
        await enviarImagen(
            sock, 
            from, 
            ppUrl, 
            perfilTexto, 
            "SISTEMA DE PROGRESO - THE RICK V2", 
            [userId], 
            m
        );

    } catch (err) {
        console.error("❌ Error en perfil:", err);
        sock.sendMessage(from, { text: MG + "❌ Error al generar el perfil visual." }, { quoted: m });
    }
}
