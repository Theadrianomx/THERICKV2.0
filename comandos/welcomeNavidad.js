import { withHeader } from '../utils/globalHeader.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ✅ Importación correcta para Jimp 0.22.12
const Jimp = require('jimp');

const URL_GORRO = 'https://i.postimg.cc/m2hkMgFB/Picsart-25-12-23-22-44-42-663.png'; 
const RUTA_AUDIO = path.join(process.cwd(), 'comandos', 'grupo', 'Archivos', 'navidad.mp3');
const DEFAULT_USER_IMG = 'https://cdn-icons-png.flaticon.com/512/666/666201.png';

function cleanJid(jid) {
    return jid ? jid.split('@')[0].split(':')[0] : '';
}

export function sendWelcomeNavidad(sock) {
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;
            if (action !== 'add') return;

            const metadata = await sock.groupMetadata(id);

            for (const user of participants) {
                const userClean = cleanJid(user);
                let bufferImg = null;

                try {
                    let userPP;
                    try {
                        userPP = await sock.profilePictureUrl(user, 'image');
                    } catch {
                        userPP = DEFAULT_USER_IMG;
                    }

                    // ✅ En esta versión se usa Jimp.read directamente
                    const avatar = await Jimp.read(userPP);
                    const gorro = await Jimp.read(URL_GORRO);

                    // ✅ Sintaxis clásica: resize(ancho, alto)
                    avatar.resize(600, 600);
                    gorro.resize(360, Jimp.AUTO);

                    // ✅ Superponer
                    avatar.composite(gorro, 120, -15);

                    // ✅ Regresamos a getBufferAsync (clásico)
                    bufferImg = await avatar.getBufferAsync(Jimp.MIME_JPEG);

                } catch (imgErr) {
                    console.error('❌ Error en Jimp:', imgErr.message);
                }

                const textoNavideno = withHeader(
                    `🎁 ¡𝗨𝗡 𝗥𝗘𝗚𝗔𝗟𝗢 𝗡𝗔𝗩𝗜𝗗𝗘Ñ𝗢!🎄 \n\n` +
                    `🎅 ¡Bienvenido/a @${userClean}!\n` +
                    `🎄 Grupo: *${metadata.subject}*\n\n` +
                    `🌟 ¡Mira tu gorrito navideño! ¡Felices Fiestas! 🥂`
                );

                if (bufferImg) {
                    await sock.sendMessage(id, { image: bufferImg, caption: textoNavideno, mentions: [user] });
                } else {
                    await sock.sendMessage(id, { text: textoNavideno, mentions: [user] });
                }

                if (fs.existsSync(RUTA_AUDIO)) {
                    await new Promise(r => setTimeout(r, 1000));
                    await sock.sendMessage(id, {
                        audio: fs.readFileSync(RUTA_AUDIO),
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: null });
                }
            }
        } catch (err) {
            console.error('[WelcomeNavidad] Error general:', err.message);
        }
    });
}
