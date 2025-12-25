// comandos/interaccion/minar.js
import { getImgForMaterial } from '../gestion/imagenesProgreso.js';
import { getUsuario, agregarXP, addItem, incrementMinar, resetSeguidos, resetMinadosDiariosIfNeeded } from '../data/usuarios.js';
import { enviarImagen } from '../gestion/constGlobal.js';

const COSTO_POR_MINADO = 5; 
const PROB_FALLO = 0.15;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function minar(sock, m, args) {
    const from = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;
    const userNumber = userId.split('@')[0];

    try {
        // Anti-Ban: Presencia
        await sock.sendPresenceUpdate('composing', from);

        const user = getUsuario(userId);
        resetMinadosDiariosIfNeeded(userId, new Date().toDateString());

        // Cantidad de intentos (.minar 2)
        let cantidadIntentos = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 1;
        cantidadIntentos = Math.max(1, Math.min(cantidadIntentos, 10)); // Límite 1 a 10
        
        const costoTotal = COSTO_POR_MINADO * cantidadIntentos;

        // Validación de Economía
        if (user.experiencia < costoTotal) {
            return sock.sendMessage(from, { 
                text: `❌ @${userNumber}, necesitas *${costoTotal} XP* para esta expedición.\n💰 Tienes: ${user.experiencia} XP\n\n_Tip: Usa .vender para conseguir XP._`,
                mentions: [userId]
            }, { quoted: m });
        }

        // Cobro
        agregarXP(userId, -costoTotal);

        // Animación
        const msgMineria = await sock.sendMessage(from, { text: `⚒️ @${userNumber} está preparando ${cantidadIntentos} picos...` }, { mentions: [userId] });
        
        await delay(1500);
        await sock.sendMessage(from, { text: `⛏️ *Minando capas profundas...*\n[▓▓▓▓░░░░░░] 40%`, edit: msgMineria.key });
        await delay(1500);
        await sock.sendMessage(from, { text: `⛏️ *Analizando minerales...*\n[▓▓▓▓▓▓▓▓░░] 85%`, edit: msgMineria.key });

        // Cálculo de botín
        let botinRecogido = { hierro: 0, oro: 0, diamante: 0 };
        let xpGanadaTotal = 0;

        for (let i = 0; i < cantidadIntentos; i++) {
            if (Math.random() > PROB_FALLO) {
                const r = Math.random();
                if (r < 0.1) { botinRecogido.diamante += 1; xpGanadaTotal += 50; }
                else if (r < 0.35) { botinRecogido.oro += 1; xpGanadaTotal += 20; }
                else { botinRecogido.hierro += 2; xpGanadaTotal += 10; }
            }
        }

        // Guardar resultados
        if (botinRecogido.hierro > 0) addItem(userId, 'hierro', botinRecogido.hierro);
        if (botinRecogido.oro > 0) addItem(userId, 'oro', botinRecogido.oro);
        if (botinRecogido.diamante > 0) addItem(userId, 'diamante', botinRecogido.diamante);
        
        agregarXP(userId, xpGanadaTotal);
        incrementMinar(userId);

        // Resultado Final
        const img = getImgForMaterial(botinRecogido.diamante > 0 ? 'diamante' : 'hierro');
        const resumen = `✨ *RESULTADOS DE LA MINA* ✨\n\n` +
            `👤 *Minero:* @${userNumber}\n` +
            `💸 *Inversión:* -${costoTotal} XP\n` +
            `🎖️ *XP Ganada:* +${xpGanadaTotal}\n\n` +
            `📦 *Botín Encontrado:* \n` +
            (botinRecogido.hierro ? `⛓️ Hierro: ${botinRecogido.hierro}\n` : '') +
            (botinRecogido.oro ? `✨ Oro: ${botinRecogido.oro}\n` : '') +
            (botinRecogido.diamante ? `💎 Diamante: ${botinRecogido.diamante}\n` : '') +
            `\n💰 *Balance Final:* ${user.experiencia + xpGanadaTotal} XP`;

        await sock.sendMessage(from, { delete: msgMineria.key });
        await enviarImagen(sock, from, img, resumen, "THE RICK V2 - Economía", [userId], m);

        setTimeout(() => resetSeguidos(userId), 15000);

    } catch (err) {
        console.error('Error en Minar:', err);
        sock.sendMessage(from, { text: "⚠️ Derrumbe en la mina. Intenta de nuevo." });
    }
}
