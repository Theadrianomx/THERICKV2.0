import { withHeader, RG, MG, FG } from '../../utils/globalHeader.js';

export default async function(sock, m, args) {
    const chat = m.key.remoteJid;
    
    // ✅ Reparación de la detección de grupo:
    const isGroup = chat.endsWith('@g.us');

    try {
        if (!isGroup) {
            return sock.sendMessage(chat, { 
                text: withHeader(MG + "❌ Este comando solo se puede usar en grupos.") 
            }, { quoted: m });
        }

        // Obtener metadata
        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chat);
        } catch (err) {
            return sock.sendMessage(chat, { 
                text: withHeader(FG + "❌ No se pudo obtener la información del grupo. Asegúrate de que soy admin.") 
            }, { quoted: m });
        }

        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        
        if (groupAdmins.length === 0) {
            return sock.sendMessage(chat, { text: "No encontré administradores." });
        }

        const owner = groupMetadata.owner || chat.split('-')[0] + '@s.whatsapp.net';
        const motivo = args.join(" ");

        if (!motivo) {
            return sock.sendMessage(chat, { 
                text: withHeader(MG + "❌ Ingrese un *motivo*.\n\nUso: `.admins <motivo>`") 
            }, { quoted: m });
        }

        // Obtener foto del grupo
        const pp = await sock.profilePictureUrl(chat, 'image').catch(() => 'https://qu.ax/OEgX.jpg');
        
        const listaAdmins = groupAdmins.map((v, i) => `┃ \`${i + 1}\` @${v.id.split('@')[0]}`).join('\n');
        
        const texto = withHeader(RG + 
            `📢 *LLAMADO DE STAFF*\n\n` +
            `📝 Motivo: *${motivo}*\n\n` +
            `⚠️ *ADMINS ACTIVOS:* ⚠️\n` +
            `${listaAdmins}\n\n` +
            `*Favor de atender el llamado.*`
        );

        await sock.sendMessage(chat, {
            image: { url: pp },
            caption: texto,
            mentions: [...groupAdmins.map(v => v.id), owner]
        }, { quoted: m });

    } catch (e) {
        console.error("❌ Error en admins:", e);
        sock.sendMessage(chat, { text: "❌ Error interno al ejecutar el comando." });
    }
}
