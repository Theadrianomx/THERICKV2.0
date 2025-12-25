// simulacion.js
import { handleCommands } from './comandos/handler.js';
import { autoReaccion } from './comandos/autoReaccion.js';
import { autoImagen } from './comandos/autoImagen.js';
import { sendWelcome } from './comandos/sendwelcome.js';

// Simulación de un "sock" mínimo para pruebas
const sock = {
    sendMessage: async (jid, content) => {
        console.log('✅ Mensaje enviado a:', jid);
        console.log(content);
        return content;
    },
    ev: {
        on: (event, callback) => {
            console.log(`⚡ Evento registrado: ${event}`);
            // Guardamos el callback para usarlo en la simulación
            sock[event] = callback;
        }
    }
};

// Función para simular mensajes
async function simularMensajes() {
    console.log('🚀 Iniciando simulación de mensajes...\n');

    // Mensajes de prueba para comandos
    const mensajes = [
        { message: { conversation: '.ping' }, key: { remoteJid: '123456789-123456@g.us' } },
        { message: { conversation: '.hola' }, key: { remoteJid: '123456789-123456@g.us' } },
        { message: { conversation: 'gracias por todo' }, key: { remoteJid: '123456789-123456@g.us' } },
        { message: { conversation: 'jaja qué risa' }, key: { remoteJid: '123456789-123456@g.us' } }
    ];

    for (let m of mensajes) {
        console.log('--- Probando comando ---');
        await handleCommands(sock, m);
        await autoReaccion(sock);
        await autoImagen(sock, m);
    }

    console.log('\n✅ Simulación de mensajes completada');
}

// Función para simular la entrada de un nuevo miembro
async function simularNuevoMiembro() {
    console.log('\n--- Probando bienvenida de nuevo miembro ---');

    const update = {
        action: 'add',
        participants: ['111222333@s.whatsapp.net'], // ID simulado del nuevo miembro
        id: '123456789-123456@g.us' // ID de tu grupo
    };

    await sendWelcome(sock, update);
}

// Ejecutar simulaciones
(async () => {
    await simularMensajes();
    await simularNuevoMiembro();
})();