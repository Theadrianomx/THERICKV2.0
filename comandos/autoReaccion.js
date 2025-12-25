// autoReaccion.js 

import { consola } from '../utils/console.js';
// import { isBotActive } from './grupo/groupConfi.js'; // REMOVIDO: Ya no verifica el estado del bot
import { isBlacklisted } from './grupo/groupConfi.js'; // Mantener el bloqueo de blacklist
// import { isCreator } from '../comandos/handler.js'; // REMOVIDO: No es necesario para reacciones

const EMOJIS = [
    "😎", "🔥", "😂", "👍", "👏",
    "😮", "🤔", "🥳", "💯"
];

const COMMAND_PREFIXES = new RegExp('^[\\.\\!\\+\\/]', 'i'); // Regex: Empieza con ., !, +, o /

export function autoReaccion(sock) {

    const processed = new Set();

    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            for (const m of messages) {

                if (!m.message) continue;
                if (m.key.fromMe) continue;

                const chat = m.key.remoteJid;
                const msgId = m.key.id;

                if (!msgId || processed.has(msgId)) continue;
                processed.add(msgId);
                setTimeout(() => processed.delete(msgId), 3000); // Reduce el tiempo de espera a 3s

                const text =
                    m.message.conversation ||
                    m.message.extendedTextMessage?.text;

                // Si es un chat de grupo
                if (chat.endsWith('@g.us')) {
                    // ───── BLOQUEOS ─────
                    if (isBlacklisted(chat)) continue; // Solo bloqueo por Blacklist
                }
                
                // No reaccionar a mensajes sin texto o a comandos
                if (!text || COMMAND_PREFIXES.test(text)) continue;

                const emoji =
                    EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

                await sock.sendMessage(chat, {
                    react: { text: emoji, key: m.key }
                });
            }
        } catch (e) {
            consola.error('[autoReaccion]', e.message || e);
        }
    });
}
