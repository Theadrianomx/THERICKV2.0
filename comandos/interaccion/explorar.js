import { getUsuario, agregarXP, addItem } from '../data/usuarios.js';
import { withHeader, RG } from '../../utils/globalHeader.js';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Solo una declaración "export async function"
export async function explorar(sock, m) {
    const from = m.key.remoteJid;
    const userId = m.key.participant || from;
    
    try {
        const user = getUsuario(userId);

        // 1. Validación de energía
        if (user.experiencia < 5) {
            return sock.sendMessage(from, { 
                text: withHeader(RG + "❌ Estás demasiado agotado para explorar. (Mínimo 5 XP)") 
            }, { quoted: m });
        }

        // --- ANTI-BAN: Simular Humano ---
        await sock.sendPresenceUpdate('composing', from);
        const { key } = await sock.sendMessage(from, { text: "🏃‍♂️ *Buscando tesoros en zonas peligrosas...*" });
        
        await delay(3000); // Simulación de tiempo de caminata

        // 2. Eventos Dinámicos
        const eventos = [
            { msg: "🎁 ¡Encontraste un alijo secreto de suministros!", xp: 30, item: "hierro", cant: 2 },
            { msg: "💎 ¡Viste un destello en una grieta! Es un diamante.", xp: 15, item: "diamante", cant: 1 },
            { msg: "🦂 Una criatura te atacó mientras dormías.", xp: -20, item: null, cant: 0 },
            { msg: "🏺 Descubriste una reliquia antigua muy valiosa.", xp: 60, item: "oro", cant: 1 },
            { msg: "🌪️ Una tormenta de arena te hizo perder suministros.", xp: -40, item: null, cant: 0 },
            { msg: "🍎 Encontraste frutas silvestres que te dieron energía.", xp: 10, item: null, cant: 0 }
        ];

        const azar = eventos[Math.floor(Math.random() * eventos.length)];
        
        // 3. Aplicar cambios a la DB
        agregarXP(userId, azar.xp - 5); // El -5 es el costo fijo por el viaje
        if (azar.item) addItem(userId, azar.item, azar.cant);

        const statusEmoji = azar.xp > 0 ? "✅" : "⚠️";
        const textoResultado = withHeader(RG + 
            `${statusEmoji} *BITÁCORA DE EXPLORACIÓN*\n\n` +
            `💬 *Suceso:* ${azar.msg}\n` +
            `✨ *Experiencia:* ${azar.xp > 0 ? '+' : ''}${azar.xp} XP\n` +
            `${azar.item ? `📦 *Botín:* ${azar.cant}x ${azar.item.toUpperCase()}` : "📦 *Botín:* Nada encontrado"}\n\n` +
            `_Costo de expedición: -5 XP_`
        );

        // 4. Editar mensaje para efecto dinámico
        await sock.sendMessage(from, { text: textoResultado, edit: key, mentions: [userId] });
        await sock.sendPresenceUpdate('paused', from);

    } catch (err) {
        console.error("Error en explorar:", err);
    }
}
