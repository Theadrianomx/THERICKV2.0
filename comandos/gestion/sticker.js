// comandos/gestion/sticker.js

import { withHeader, FG, RG } from '../../utils/globalHeader.js';
import { enviarTexto } from './constGlobal.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys'; 

/**
 * Convierte una imagen o video en un sticker.
 */
export async function crearSticker(sock, msg, args) {
    const from = msg.key.remoteJid;
    
    // 1. DETERMINAR EL ORIGEN DEL MEDIO
    
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    
    // Objeto que pasaremos a downloadMediaMessage (debe ser ImageMessage o VideoMessage)
    let messageToDownload = null; 
    let mediaType = null;

    if (contextInfo?.quotedMessage) {
        // Caso A: El usuario CITÓ un mensaje
        messageToDownload = contextInfo.quotedMessage.imageMessage || contextInfo.quotedMessage.videoMessage;
        
    } else if (msg.message?.imageMessage || msg.message?.videoMessage) {
        // Caso B: El usuario envió el comando en el PIE DE FOTO de un medio
        messageToDownload = msg.message.imageMessage || msg.message.videoMessage;
    }

    // 2. VALIDACIÓN Y TIPO
    if (!messageToDownload) {
        return enviarTexto(sock, from, 
            withHeader(FG + "❌ Uso incorrecto.\n\n" + 
                       "Debes **citar** una imagen/video o enviar el comando en el **pie de foto**."), 
            { quoted: msg }
        );
    }
    
    mediaType = messageToDownload.mimetype?.startsWith('video') ? 'video' : 'image'; 
    
    // Validación de duración para videos
    if (mediaType === 'video' && messageToDownload.seconds > 10) {
        return enviarTexto(sock, from, 
            withHeader(RG + "❌ El video es muy largo. Los stickers animados deben durar menos de 10 segundos."), 
            { quoted: msg }
        );
    }

    // 3. Obtener metadatos opcionales
    let packname = 'THE RICK V2';
    let author = 'Bot';
    
    if (args.length > 0) {
        const fullArgs = args.join(' ');
        const parts = fullArgs.split('|').map(s => s.trim());
        packname = parts[0] || packname;
        author = parts[1] || author;
    }

    // 4. Descargar el medio
    let buffer;
    try {
        await enviarTexto(sock, from, withHeader("⏳ Procesando sticker..."), { quoted: msg });
        
        // PASAMOS el objeto ImageMessage/VideoMessage directamente.
        buffer = await downloadMediaMessage(
            messageToDownload, // <--- Aquí pasamos el objeto de medio anidado
            'buffer', 
            { },
            {
                logger: undefined,
                reuploadRequest: sock.updateMediaMessage
            }
        );
    } catch (error) {
        console.error("❌ ERROR CRÍTICO DE DESCARGA (Baileys):", error.stack || error.message || error);
        return enviarTexto(sock, from, withHeader(RG + "❌ Error al descargar el medio. Intenta de nuevo. (Asegúrate de citar un archivo reciente)."), { quoted: msg });
    }

    // 5. Configurar y enviar el sticker
    try {
        const stickerOptions = {
            pack: packname,  
            author: author,  
            keepScale: true, 
            isAnimated: mediaType === 'video' 
        };

        await sock.sendMessage(from, { 
            sticker: buffer, 
            ...stickerOptions 
        }, { quoted: msg });
        
    } catch (e) {
        console.error("Error al crear sticker:", e);
        return enviarTexto(sock, from, withHeader(RG + "❌ Error al crear el sticker. ¿El medio es muy grande o está dañado?"), { quoted: msg });
    }
}
