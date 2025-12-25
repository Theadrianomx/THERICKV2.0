// comandos/interaccion/registro.js
import { withHeader, RG, MG, BOT_LOGO } from '../../utils/globalHeader.js';
import fs from 'fs';
import path from 'path';

// Ruta del archivo donde se guardarán los usuarios
const DATABASE_PATH = path.join(process.cwd(), 'database', 'usuarios.json');

// Asegurar que la carpeta database exista
if (!fs.existsSync(path.join(process.cwd(), 'database'))) {
    fs.mkdirSync(path.join(process.cwd(), 'database'));
}

/**
 * Carga los usuarios desde el archivo JSON
 */
function loadUsers() {
    try {
        if (!fs.existsSync(DATABASE_PATH)) return new Set();
        const data = fs.readFileSync(DATABASE_PATH, 'utf-8');
        return new Set(JSON.parse(data));
    } catch (e) {
        console.error("Error cargando base de datos de usuarios:", e);
        return new Set();
    }
}

/**
 * Guarda los usuarios en el archivo JSON
 */
function saveUsers(usersSet) {
    try {
        const data = JSON.stringify(Array.from(usersSet));
        fs.writeFileSync(DATABASE_PATH, data, 'utf-8');
    } catch (e) {
        console.error("Error guardando base de datos de usuarios:", e);
    }
}

// Inicializar la lista de usuarios cargando el archivo
const registeredUsers = loadUsers();

const INVITE_LINK = 'https://whatsapp.com/channel/0029VatdMm48V0tjRSCnft2n';

export function isUserRegistered(senderNumber) {
    return registeredUsers.has(senderNumber);
}

const MENU_CORE = 
    '🤖 *LISTA DE COMANDOS DISPONIBLES*\n\n' +
    '—— [ 👤 JUEGOS Y ECONOMÍA ] ———\n' +
    '*.minar <cant>*: Extrae materiales (Cuesta XP).\n' +
    '*.vender <mat>*: Cambia minerales por XP.\n' +
    '*.perfil* / *.stats*: Tu nivel, XP e inventario.\n' +
    '*.top*: Ranking global de mejores mineros.\n' +
    '*.robar <@tag>*: Intenta quitarle XP a otro.\n' +
    '*.explorar*: Busca recompensas aleatorias.\n\n' +
    '—— [ 👥 GRUPO Y DIVERSIÓN ] ———\n' +
    '*.sticker*: Crea stickers de fotos o videos.\n' +
    '*.gay <@tag>*: Mide el nivel de gay de alguien.\n' +
    '*.admins*: Lista de administradores actuales.\n' +
    '*.notify <msg>*: Etiqueta a todos (Admin).\n' +
    '*.demote <@tag>*: Quita el admin (Admin).\n' +
    '*.bot [on/off]*: Controla el bot en el grupo.\n\n' +
    '—— [ ⚙️ UTILIDADES ] ———\n' +
    '*.ping*: Latencia y estado del servidor.\n' +
    '*.hola*: Saludo inicial del bot.\n' +
    '*.isregistered*: Verifica tu estado en la DB.\n\n' +
    '—— [ 🔑 USO PRIVADO ] ———\n' +
    '*.getkey*: Genera una clave de acceso temporal.\n' +
    '_Uso: Se usa para validar tu identidad en sistemas externos o comandos que requieren autorización especial. Es una medida de seguridad para evitar spam._\n';


export function getFullMenu() {
    return RG + BOT_LOGO + '\n\n' + `🔗 Únete a nuestro canal oficial: ${INVITE_LINK}\n\n` + MENU_CORE;
}

export async function registrar(sock, m, args, senderNumber) {
    const chat = m.key.remoteJid;
    const isGroup = chat.endsWith('@g.us');
    const senderJid = senderNumber + '@s.whatsapp.net';
    
    if (isUserRegistered(senderNumber)) {
        return sock.sendMessage(chat, { text: getFullMenu() }, { quoted: m });
    }

    if (args.length < 3) {
        return sock.sendMessage(chat, { text: withHeader(MG + '❌ Uso incorrecto del comando.\n\n' +
            '*Usa:* .registrar <nombre>, <edad>, <foto_confirmación>\n' + 
            '*Ejemplo:* .registrar Rick, 45, ok') }, { quoted: m });
    }

    const parts = args.join(' ').split(',');
    if (parts.length < 3) {
        return sock.sendMessage(chat, { text: withHeader(MG + '❌ Error de sintaxis. Usa comas para separar los campos.') }, { quoted: m });
    }

    const [nombre, edadRaw] = parts.map(s => s.trim());
    const edad = parseInt(edadRaw);

    if (isNaN(edad) || edad < 1 || edad > 150 || !nombre) {
        return sock.sendMessage(chat, { text: withHeader(MG + '❌ Datos inválidos. Revisa el nombre y la edad.') }, { quoted: m });
    }

    // --- GUARDADO PERMANENTE ---
    registeredUsers.add(senderNumber);
    saveUsers(registeredUsers); // Guardamos en el archivo JSON
    
    let profilePicUrl = null;
    try {
        profilePicUrl = await sock.profilePictureUrl(senderJid, 'image');
    } catch (e) {
        if (isGroup) {
            try { profilePicUrl = await sock.profilePictureUrl(chat, 'image'); } catch (e) {}
        }
    }

    const confirmationBody = `🎉 ¡Registro Exitoso! Bienvenido, *${nombre}*.\n\n*Nombre:* ${nombre}\n*Edad:* ${edad}\n\nYa puedes usar los comandos.`;
    const confirmationText = RG + BOT_LOGO + '\n\n' + confirmationBody;

    if (profilePicUrl) {
        await sock.sendMessage(chat, { image: { url: profilePicUrl }, caption: confirmationText }, { quoted: m });
        await sock.sendMessage(chat, { text: getFullMenu() });
    } else {
        await sock.sendMessage(chat, { text: confirmationText + '\n\n' + getFullMenu() }, { quoted: m });
    }
}
