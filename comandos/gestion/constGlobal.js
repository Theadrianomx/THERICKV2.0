import { consola } from '../../utils/console.js';

/**
 * Función global para enviar mensajes de cualquier tipo con protecciones
 */
export async function enviar(sock, jid, options = {}) {
    try {
        const mensaje = {};
        const sendOptions = {};

        // 1. Configurar el objeto Quoted de forma segura
        if (options.quoted && options.quoted.key) {
            sendOptions.quoted = options.quoted;
        }

        // 2. Manejo de Medios (Imagen, Video, etc.)
        if (options.image) {
            mensaje.image = typeof options.image === 'string' ? { url: options.image } : options.image;
            if (options.caption) mensaje.caption = options.caption;
        } else if (options.video) {
            mensaje.video = typeof options.video === 'string' ? { url: options.video } : options.video;
            if (options.caption) mensaje.caption = options.caption;
        } else if (options.audio) {
            mensaje.audio = typeof options.audio === 'string' ? { url: options.audio } : options.audio;
            mensaje.mimetype = options.mimetype || 'audio/mp4';
            mensaje.ptt = options.ptt || false;
        } else if (options.sticker) {
            mensaje.sticker = typeof options.sticker === 'string' ? { url: options.sticker } : options.sticker;
        } else if (options.document) {
            mensaje.document = typeof options.document === 'string' ? { url: options.document } : options.document;
            mensaje.mimetype = options.mimetype || 'application/octet-stream';
            mensaje.fileName = options.fileName;
            if (options.caption) mensaje.caption = options.caption;
        } else if (options.text) {
            mensaje.text = options.text;
        }

        if (options.location) mensaje.location = options.location;

        // Botones y pie de página
        if (options.buttons && options.buttons.length > 0) mensaje.buttons = options.buttons;
        if (options.footer) mensaje.footer = options.footer;

        // Menciones (Mentions)
        if (options.mentions && options.mentions.length > 0) {
            mensaje.contextInfo = { mentionedJid: options.mentions };
        }

        // 3. Ejecutar el envío
        if (options.edit && options.key && options.key.remoteJid) {
            // Protección para edición
            await sock.sendMessage(jid, { text: options.text, edit: options.key }, { mentions: options.mentions });
        } else {
            await sock.sendMessage(jid, mensaje, sendOptions);
        }

        consola.log(`[ENVIAR] Mensaje enviado a: ${jid}`);
    } catch (err) {
        consola.error(`[ENVIAR] Error al enviar mensaje a ${jid}: ${err.message || err}`);
    }
}

// --- FUNCIONES RÁPIDAS ---

export const enviarTexto = (sock, jid, text, quoted = null, mentions = []) => 
    enviar(sock, jid, { text, quoted, mentions });

export const enviarImagen = (sock, jid, url, caption = '', footer = '', mentions = [], quoted = null) => 
    enviar(sock, jid, { image: url, caption, footer, mentions, quoted });

export const enviarVideo = (sock, jid, url, caption = '', footer = '', mentions = [], quoted = null) => 
    enviar(sock, jid, { video: url, caption, footer, mentions, quoted });

// Actualizado para soportar quoted y ptt (útil para el comando gay)
export const enviarAudio = (sock, jid, url, ptt = false, quoted = null) => 
    enviar(sock, jid, { audio: url, ptt, quoted });

export const enviarSticker = (sock, jid, url, quoted = null) => 
    enviar(sock, jid, { sticker: url, quoted });

export const enviarDocumento = (sock, jid, url, fileName, mimetype, caption = '') => 
    enviar(sock, jid, { document: url, fileName, mimetype, caption });

export const enviarUbicacion = (sock, jid, lat, long, name, address) => 
    enviar(sock, jid, { location: { degreesLatitude: lat, degreesLongitude: long, name, address } });

// Reacción a mensajes
export const reaccionar = async (sock, jid, msgKey, emoji) => {
    try {
        if (!msgKey || !msgKey.remoteJid) throw new Error("Key de mensaje inválida");
        await sock.sendMessage(jid, { react: { text: emoji, key: msgKey } });
        consola.log(`[REACCION] Emoji ${emoji} enviado a: ${jid}`);
    } catch (err) {
        consola.error(`[REACCION] Error al reaccionar en ${jid}: ${err.message || err}`);
    }
};
