// sendwelcome.js
import { withHeader, CANAL_BOT_BUTTON } from '../utils/globalHeader.js';
import { enviarImagen } from './gestion/constGlobal.js';

const motivos = ["No seguía las reglas", "Incumplimiento", "Spam", "Salida"];
const DEFAULT_IMAGE = 'https://i.imgur.com/6v69m9v.png'; 

function cleanJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

export function sendWelcome(sock) {
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action, author } = update;
            if (!id.endsWith('@g.us')) return;

            // Esperar 2 segundos para que WhatsApp procese al nuevo usuario
            await new Promise(resolve => setTimeout(resolve, 2000));

            const metadata = await sock.groupMetadata(id);

            for (const user of participants) {
                const userClean = cleanJid(user);
                
                let image;
                try {
                    // Intentamos obtener la foto del NUEVO USUARIO
                    console.log(`[Welcome] Intentando obtener foto de: ${userClean}`);
                    image = await sock.profilePictureUrl(user, 'image');
                } catch (e) {
                    console.log(`[Welcome] Falló foto de usuario, usando foto de grupo.`);
                    try {
                        image = await sock.profilePictureUrl(id, 'image');
                    } catch {
                        image = DEFAULT_IMAGE;
                    }
                }

                let mentions = [user];
                if (author) mentions.push(author);

                if (action === 'add') {
                    const texto = withHeader(
                        ` 🧑🏼‍🎄🎅🏼¡𝗕𝗜𝗘𝗡𝗩𝗘𝗡𝗜𝗗𝗢/𝗔!\n\n` +
                        `👋 Hola @${userClean}\n` +
                        `🏰 Grupo: *${metadata.subject}*\n\n` +
                        `¡Disfruta tu estadía!`
                    );
                    await enviarImagen(sock, id, image, texto, CANAL_BOT_BUTTON, mentions);
                } 
                else if (action === 'remove') {
                    const kicker = author ? `@${cleanJid(author)}` : `*El sistema*`;
                    const texto = withHeader(
                        `👋 ¡𝗔𝗗𝗜Ó𝗦!\n\n` +
                        `👤 Usuario: @${userClean}\n` +
                        `👮 Responsable: ${kicker}\n` +
                        `📄 Motivo: ${motivos[Math.floor(Math.random() * motivos.length)]}`
                    );
                    await enviarImagen(sock, id, image, texto, CANAL_BOT_BUTTON, mentions);
                }
            }
        } catch (err) {
            console.error('[sendWelcome] Error:', err);
        }
    });
}
