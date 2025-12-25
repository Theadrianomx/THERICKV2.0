import { getAuthState } from './connection/auth.js';
import { createSocket } from './connection/socket.js';
import { handleCommands } from './comandos/handler.js';
// import { sendWelcome } from './comandos/sendwelcome.js'; // Comentado
import { sendWelcomeNavidad } from './comandos/welcomeNavidad.js'; // Importación Navideña

import { autoImagen } from './comandos/autoImagen.js';
import { autoReaccion } from './comandos/autoReaccion.js';
import { consola } from './utils/console.js';
import { iniciarLimpiador } from './utils/limpiadorRAM.js';
import readline from 'readline';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startProo() {
    try {
        consola.inicio('Iniciando THE RICK V2...');

        const { state, saveCreds } = await getAuthState();
        const sock = await createSocket(state, saveCreds);

        // ====================== MANTENIMIENTO RAM ======================
        iniciarLimpiador(sock);

        // ====================== LÓGICA DE PAIRING CODE ======================
        if (!sock.authState.creds.registered) {
            consola.log("⚠️ No se detectó sesión activa.");
            await delay(3000); 

            let phoneNumber = await question('📱 Introduce tu número de WhatsApp (ej: 5219998887766): ');
            phoneNumber = phoneNumber.replace(/\D/g, ''); 

            if (!phoneNumber) {
                consola.error("❌ Número inválido. Reiniciando...");
                process.exit(1);
            }

            try {
                await delay(1500);
                const code = await sock.requestPairingCode(phoneNumber);
                console.log('\n' + '─'.repeat(40));
                console.log(`🔗 TU CÓDIGO DE VINCULACIÓN: ` + `\x1b[1;32m${code}\x1b[0m`);
                console.log('─'.repeat(40) + '\n');
            } catch (pairingError) {
                consola.error("❌ Error al solicitar el código: " + pairingError.message);
                process.exit(1); 
            }
        }

        // ====================== EVENTO DE CONEXIÓN ======================
        sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
            if (connection === "open") {
                consola.ok("✅ THE RICK V2 conectado correctamente.");
                // ✅ AQUÍ ESTABA EL ERROR: Se borró la llamada a sendWelcome(sock)
            }
            if (connection === "close") {
                const code = lastDisconnect?.error?.output?.statusCode;
                consola.error(`🔴 Conexión cerrada (Código: ${code}). Reintentando...`);
                
                if (code !== 401) {
                    setTimeout(() => startProo(), 5000);
                } else {
                    consola.error("🔴 Sesión inválida. Borra la carpeta de sesión.");
                    process.exit(1);
                }
            }
        });

        // ====================== ACTIVACIÓN DE FUNCIONES ======================
        // Se ejecuta fuera del connection.update para que los eventos se registren una sola vez
        sendWelcomeNavidad(sock); 
        autoImagen(sock);
        autoReaccion(sock);

        // ====================== MANEJADOR DE MENSAJES ======================
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const m of messages) {
                if (!m.message || m.key.fromMe) continue;
                const jid = m.key.remoteJid;
                const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
                
                if (body.startsWith('.')) {
                    await sock.readMessages([m.key]);
                    await sock.sendPresenceUpdate('composing', jid);
                    await delay(500);
                }
                
                await handleCommands(sock, m).catch(err => consola.error("Error en comando: " + err.message));
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        consola.error("❌ Error crítico: " + err.message);
        setTimeout(() => startProo(), 10000);
    }
}

// Silenciar errores de conexión común para evitar spam en consola
process.on('uncaughtException', (err) => {
    if (!err.message.includes('Connection Closed') && !err.message.includes('Stream error')) {
        consola.error('Capturado error no manejado: ' + err.message);
    }
});

startProo();
