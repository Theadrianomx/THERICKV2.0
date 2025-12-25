// autoImagen.js
import { IMAGENES } from "./gestion/imagenesGlobales.js";
import { isBlacklisted } from './grupo/groupConfi.js';
import { enviarImagen } from './gestion/constGlobal.js';

/**
 * Diccionario de respuestas inteligentes con COINCIDENCIA EXACTA
 * Usamos ^ al inicio y $ al final para que no acepte palabras extra ni prefijos como "."
 */
const RESPUESTAS_INTELIGENTES = [
    {
        // Solo responderá si el mensaje es exactamente "hola", "buenas", etc.
        pattern: /^(hola|buenos dias|buenas noches|buenas|hey|oe|holi)$/i,
        captions: [
            "¡Hola! ¿Cómo va tu día? 😊",
            "¡Buenas! Espero que estés excelente. ✨",
            "¡Hey! Aquí reportándome. ¿En qué andamos?"
        ]
    },
    {
        pattern: /^(como estas|cómo estás|que tal|qué tal)$/i,
        captions: [
            "¡Estoy de maravilla! Gracias por preguntar. ¿Y tú? 🤖",
            "Funcionando al 100%, listo para la acción. 😎",
            "Todo bien por aquí, procesando bits y mucha buena onda."
        ]
    },
    {
        pattern: /^(like x like|like por like|pasen links|links)$/i,
        captions: [
            "¡Eso! Pasen los links y nos apoyamos todos. 🚀",
            "¡Dale! Dejen sus enlaces aquí abajo para el apoyo masivo. 🔥"
        ]
    },
    {
        pattern: /^(bot|rick|the rick)$/i,
        captions: [
            "¿Me llamaste? Aquí estoy. 🫡",
            "Dime, ¿en qué puedo ayudarte hoy? 🛠️"
        ]
    },
    {
        pattern: /^(gracias|grx|thank|ty)$/i,
        captions: [
            "¡De nada! Siempre a la orden. 🫡",
            "No hay de qué, ¡disfrútalo! ✨"
        ]
    },
    {
        pattern: /^(adiós|adios|chao|bye)$/i,
        captions: [
            "¡Cuídate mucho! Nos vemos luego. 👋",
            "¡Vuelve pronto! ✨"
        ]
    },
    {
        pattern: /^(jajaja|jejeje|xd|lmao)$/i,
        captions: [
            "¡Jajaja, qué buena esa! 😂",
            "¡Está potente el humor hoy! xd"
        ]
    }
];


export async function autoImagen(sock) {
    const processedMsgIds = new Set();

    sock.ev.on("messages.upsert", async ({ messages }) => {
        if (!messages || messages.length === 0) return;
        const m = messages[0];
        
        // Ignorar mensajes vacíos, de protocolos o del propio bot
        if (!m?.message || m.key.fromMe) return;

        const chat = m.key.remoteJid;
        const msgId = m.key.id;
        
        if (chat.endsWith('@g.us') && isBlacklisted(chat)) return;

        if (processedMsgIds.has(msgId)) return;
        processedMsgIds.add(msgId);
        setTimeout(() => processedMsgIds.delete(msgId), 30000); 

        // Obtener texto y LIMPIAR espacios en blanco al inicio y final
        const text = (m.message.conversation || m.message?.extendedTextMessage?.text || "").trim().toLowerCase();
        
        // Si el texto está vacío o empieza con un punto (comando), ignorar
        if (!text || text.startsWith('.')) return;

        // --- LÓGICA DE RESPUESTA INTELIGENTE ---
        let responseFound = null;

        for (const item of RESPUESTAS_INTELIGENTES) {
            // .test(text) ahora solo dará true si el texto es IDÉNTICO al patrón
            if (item.pattern.test(text)) {
                responseFound = item.captions[Math.floor(Math.random() * item.captions.length)];
                break; 
            }
        }

        if (!responseFound) return;

        try {
            const todasImagenes = [...IMAGENES.original, ...IMAGENES.vip, ...IMAGENES.general];
            const imagenURL = todasImagenes[Math.floor(Math.random() * todasImagenes.length)];

            await enviarImagen(
                sock, 
                chat, 
                imagenURL, 
                responseFound, 
                "🤖 THE RICK V2", 
                [], 
                m 
            );

        } catch (err) {
            console.error("❌ Error en autoImagen:", err.message);
        }
    });
}
