import { withHeader } from '../utils/globalHeader.js';
import { consola } from '../utils/console.js';
import { enviarTexto } from './gestion/constGlobal.js';

// --- IMPORTACIONES DE INTERACCIÓN Y ECONOMÍA ---
import { minar } from './interaccion/minar.js';
import { robar } from './interaccion/robar.js';
import { explorar } from './interaccion/explorar.js'; 
import { vender } from './interaccion/vender.js'; 
import { comandoTop } from './interaccion/top.js'; 
import { registrar, isUserRegistered, getFullMenu } from './interaccion/registro.js'; 

// --- IMPORTACIONES DE GESTIÓN Y SISTEMA ---
import { generarClaveYGuardar } from './gestion/claveTemporal.js'; 
import { crearSticker } from './gestion/sticker.js';
import { consultarEstado } from './gestion/estado.js';
import { iniciarSubBot, subBotsActivos } from './gestion/jadibot.js';
import { listarSubBots } from './gestion/listbots.js';

// --- IMPORTACIONES DE GRUPO ---
import spamearlink from './grupo/spamearlink.js'; 
import { botOn, botOff, isBotActive } from './grupo/groupConfi.js';
import { comandoGay } from './grupo/gay.js';

// =========================
// SISTEMA DE CREADORES/OWNERS
// =========================
export let BOT_CREATORS = ['19016500693', '17132626945', '19019611930']; 

export function isCreator(number) {
    if (!number) return false;
    const inputClean = String(number).replace(/\D/g, '');
    return BOT_CREATORS.some(owner => String(owner).replace(/\D/g, '') === inputClean);
}

// Función de respuesta estándar
async function reply(sock, m, text) {
    return enviarTexto(sock, m.key.remoteJid, text, m.key);
}

export async function handleCommands(sock, m) {
    try {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
        if (!body) return;

        const prefix = '.';
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const rawJid = m.key.participant || m.key.remoteJid;
        const senderNumber = rawJid ? String(rawJid).split('@')[0].split(':')[0].replace(/\D/g, '') : '';

        // ===== METADATA DE GRUPO =====
        let isAdmins = false;
        let isBotAdmins = false;
        if (isGroup) {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];
            const botNumber = sock.user.id.split('@')[0].split(':')[0].replace(/\D/g, '');
            
            const userAdmin = participants.find(p => p.id === rawJid);
            const botAdmin = participants.find(p => p.id.includes(botNumber));

            isAdmins = userAdmin?.admin !== null && userAdmin?.admin !== undefined;
            isBotAdmins = botAdmin?.admin !== null && botAdmin?.admin !== undefined;
        }

        const mess = {
            group: withHeader('❌ Este comando solo funciona en grupos.'),
            admin: withHeader('❌ Solo administradores pueden usar este comando.'),
            botAdmin: withHeader('❌ Necesito ser administrador para ejecutar esto.')
        };

        consola.log(`[${command.toUpperCase()}] de ${senderNumber} en ${isGroup ? 'Grupo' : 'Privado'}`);

        // ============================
        // 1. COMANDOS DE ACCESO LIBRE
        // ============================
        switch (command) {
            case 'ping': return reply(sock, m, 'Pong 🟢');
            case 'hola': return reply(sock, m, '¡Hola! Soy THE RICK V2');
            case 'registrar': return registrar(sock, m, args, senderNumber);
            case 'getkey': return generarClaveYGuardar(sock, m, senderNumber);
            case 'estado': return consultarEstado(sock, m);
            case 'menu':
            case 'help': return sock.sendMessage(from, { text: getFullMenu() }, { quoted: m });
        }

        // ============================
        // BLOQUEO POR REGISTRO
        // ============================
        if (!isUserRegistered(senderNumber)) {
            return reply(sock, m, withHeader('🛑 ¡Necesitas registrarte primero!\n\nUsa: *.registrar nombre, edad, (foto) ok*'));
        }

        // ============================
        // 2. COMANDOS JADIBOT / SERBOT
        // ============================
        switch (command) {
            case 'jadibot':
            case 'serbot': 
                return iniciarSubBot(sock, m, senderNumber);
            case 'bots':
            case 'listbots':
                return listarSubBots(sock, m);
            case 'stopbot':
                if (subBotsActivos[senderNumber]) {
                    subBotsActivos[senderNumber].socket.logout();
                    delete subBotsActivos[senderNumber];
                    return reply(sock, m, "✅ Tu Sub-Bot ha sido desconectado exitosamente.");
                }
                return reply(sock, m, "❌ No tienes un Sub-Bot activo en este momento.");
        }

        // ============================
        // 3. COMANDO BOT ON/OFF
        // ============================
        if (command === 'bot') {
            if (!isGroup) return reply(sock, m, mess.group);
            const accion = args[0]?.toLowerCase();
            if (!isAdmins && !isCreator(senderNumber)) return reply(sock, m, mess.admin);

            if (accion === 'on') { botOn(from); return reply(sock, m, withHeader('✅ Bot activado.')); }
            if (accion === 'off') { botOff(from); return reply(sock, m, withHeader('⛔ Bot desactivado.')); }
            return reply(sock, m, withHeader(`Estado: ${isBotActive(from) ? '🟢 ON' : '🔴 OFF'}`));
        }

        // Bloqueo si el bot está apagado en el grupo (excepto para owners)
        if (isGroup && !isBotActive(from) && !isCreator(senderNumber)) return;

        // ============================
        // 4. COMANDOS DE INTERACCIÓN
        // ============================
        switch (command) {
            case 'gay': return comandoGay(sock, m, args);
            case 'minar': return minar(sock, m, args);
            case 'vender': return vender(sock, m, args);
            case 'top': return comandoTop(sock, m);
            case 'robar': return robar(sock, m, args);
            case 'explorar': return explorar(sock, m, args);
            case 'sticker':
            case 's': return crearSticker(sock, m, args);

            case 'perfil':
            case 'stats':
                return import('./interaccion/perfil.js').then(mod => mod.perfil(sock, m));

            // ============================
            // 5. COMANDOS DE ADMINISTRACIÓN / OWNER
            // ============================
            case 'spamearlink': 
    return import('./grupo/spamearlink.js').then(mod => mod.default.run(sock, m, args));


    
    
            case 'notify':
                if (!isAdmins) return reply(sock, m, mess.admin);
                return import('./grupo/notify.js').then(mod => mod.default(sock, m, args));

            case 'admins':
            case 'admin':
                return import('./grupo/admins.js').then(mod => mod.default(sock, m, args));

            case 'demote':
case 'ban':
    // Quitamos los 'if (!isAdmins)' de aquí y dejamos que el archivo demote.js lo maneje internamente
    return import('./grupo/demote.js').then(mod => mod.default(sock, m, args));


            case 'blacklist':
                if (!isCreator(senderNumber)) return reply(sock, m, '❌ Comando solo para Owners.');
                return import('./grupo/blacklist.js').then(mod => mod.default(sock, m, args));
            
            case 'addowner':
                if (!isCreator(senderNumber)) return;
                const nuevo = args[0]?.replace(/\D/g, '');
                if (nuevo) {
                    BOT_CREATORS.push(nuevo);
                    return reply(sock, m, `✅ El número @${nuevo} ha sido añadido como Owner.`);
                }
                return reply(sock, m, "⚠️ Por favor escribe el número para añadir como Owner.");
        }

    } catch (err) {
        consola.error('❌ Error en el Handler Principal:', err);
    }
}
