import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion,
    delay,
    Browsers
} from '@whiskeysockets/baileys';
import { consola } from '../../utils/console.js';
import { handleCommands } from '../handler.js';
import { withHeader, RG } from '../../utils/globalHeader.js';
import fs from 'fs';
import pino from 'pino';

export let subBotsActivos = {}; 

export async function iniciarSubBot(sock, m, phoneNumber) {
    const from = m.key.remoteJid;
    const userId = (m.key.participant || m.key.remoteJid).split('@')[0].split(':')[0];
    const sessionPath = `./jadibots/${userId}`;

    // 1. LIMPIEZA TOTAL
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionPath, { recursive: true });

    // 2. INICIALIZAR ESTADO
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    const numeroLimpio = phoneNumber.replace(/\D/g, '');

    // 3. CONFIGURACIÓN DEL SOCKET (MODO ESCRITORIO)
    const subSock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // ✅ USAR ESTE BROWSER EXACTO PARA NÚMEROS +1
        browser: ["Mac OS", "Chrome", "110.0.5481.178"], 
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    // 4. LÓGICA MAESTRA PARA VINCULAR EL CÓDIGO
    if (!subSock.authState.creds.registered) {
        
        // --- FIX CRÍTICO ---
        // Esperamos a que el socket se conecte al servidor de señal de WhatsApp
        await delay(5000); 

        try {
            // Solicitamos el código. 
            // Para números +1, es vital que el socket no se cierre aquí.
            const code = await subSock.requestPairingCode(numeroLimpio);
            const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

            const txt = withHeader(RG + 
                `📌 *VINCULACIÓN EXITOSA (+1)*\n\n` +
                `Introduce este código en tu WhatsApp:\n\n` +
                `👉 *${formattedCode}*\n\n` +
                `*Instrucciones:*\n` +
                `1. Ve a Dispositivos vinculados.\n` +
                `2. Vincular con número de teléfono.\n` +
                `3. Escribe el código arriba.\n\n` +
                `_Si falla, espera 60 segundos y usa el comando de nuevo._`
            );

            await sock.sendMessage(from, { text: txt }, { quoted: m });
            consola.ok(`[JADIBOT] Código generado para USA (+1): ${code}`);

        } catch (err) {
            consola.error("Error al generar Pairing Code: " + err.message);
            await sock.sendMessage(from, { text: "❌ Error: Intenta de nuevo, el servidor de WhatsApp rechazó la petición." });
        }
    }

    // --- MANEJO DE EVENTOS ---
    subSock.ev.on('creds.update', saveCreds);

    subSock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            subBotsActivos[userId] = {
                jid: `${userId}@s.whatsapp.net`,
                socket: subSock,
                uptime: Date.now()
            };
            await sock.sendMessage(from, { text: withHeader(RG + `✅ @${userId} Sub-Bot conectado y activo.`) });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                // Si la conexión se pierde por red, reintenta
                setTimeout(() => iniciarSubBot(sock, m, phoneNumber), 10000);
            } else {
                delete subBotsActivos[userId];
                if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
            }
        }
    });

    subSock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            await handleCommands(subSock, msg);
        }
    });
}
