import { withHeader, RG, MG, FG, AG } from '../../utils/globalHeader.js';

export default async function(sock, m, args) {
    const chat = m.key.remoteJid;
    const isGroup = chat.endsWith('@g.us');
    
    try {
        if (!isGroup) return sock.sendMessage(chat, { text: withHeader(MG + "❌ Este comando solo se puede usar en grupos.") }, { quoted: m });

        // 1. OBTENER METADATA Y PERMISOS EN TIEMPO REAL
        const groupMetadata = await sock.groupMetadata(chat);
        const participants = groupMetadata.participants || [];
        
        // Limpieza de IDs para comparación (evitar el error del multidispositivo :1)
        const botId = (sock.user.id.split(':')[0] || sock.user.id.split('@')[0]) + '@s.whatsapp.net';
        const sender = (m.key.participant || m.key.remoteJid).split(':')[0] + '@s.whatsapp.net';
        
        const isBotAdmins = participants.find(p => p.id === botId)?.admin !== null;
        const isAdmins = participants.find(p => p.id === sender)?.admin !== null;

        if (!isAdmins) return sock.sendMessage(chat, { text: withHeader(MG + "❌ ¡Alto ahí! Solo los administradores pueden usar este comando.") }, { quoted: m });
        if (!isBotAdmins) return sock.sendMessage(chat, { text: withHeader(AG + "❌ ¡Advertencia! Necesito ser administrador para ejecutar esto.") }, { quoted: m });

        // 2. DETECCIÓN DEL USUARIO (Aquí estaba el fallo)
        let userId = null;

        if (m.mentionedJid && m.mentionedJid.length > 0) {
            // Si hay una mención (@user)
            userId = m.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            // Si se está respondiendo a un mensaje (Forma estándar de Baileys)
            userId = m.message.extendedTextMessage.contextInfo.participant;
        } else if (m.quoted?.sender) {
            // Forma alternativa de respuesta
            userId = m.quoted.sender;
        } else if (args[0]) {
            // Si escribió el número manualmente
            let num = args[0].replace(/[^0-9]/g, '');
            if (num.length >= 10) userId = num + '@s.whatsapp.net';
        }
        
        // Limpiamos el userId detectado por si trae el ":1"
        if (userId) userId = userId.split(':')[0] + '@s.whatsapp.net';

        if (!userId) {
            return sock.sendMessage(chat, { 
                text: withHeader(MG + "❌ No detecté al usuario.\n\nEscribe: `.demote @usuario` o responde a su mensaje.") 
            }, { quoted: m });
        }

        // 3. VERIFICAR SI EL OBJETIVO ES ADMIN
        const target = participants.find(p => p.id === userId);
        if (!target || !target.admin) {
            return sock.sendMessage(chat, { text: withHeader(MG + "❌ El usuario no es administrador o no está en el grupo.") }, { quoted: m });
        }

        // 4. EJECUTAR DEGRADACIÓN
        await sock.groupParticipantsUpdate(chat, [userId], 'demote');
        
        const degradadoNum = userId.split('@')[0];
        await sock.sendMessage(chat, { 
            text: withHeader(RG + `✅ @${degradadoNum} ha sido degradado satisfactoriamente.`),
            mentions: [userId] 
        }, { quoted: m });

    } catch (e) {
        console.error("❌ Error en demote:", e);
        sock.sendMessage(chat, { text: withHeader(FG + "❌ Error técnico al degradar. Intente de nuevo.") }, { quoted: m });
    }
}
