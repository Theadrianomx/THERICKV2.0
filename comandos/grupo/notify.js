// comandos/grupo/notify.js
import { IMAGENES } from "../gestion/imagenesGlobales.js";

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export default async function notify(sock, m, args) {
    const chat = m.key.remoteJid;

    try {
        // 1. VALIDACIÓN Y SEGURIDAD INICIAL
        if (!chat.endsWith("@g.us")) {
            return await sock.sendMessage(chat, { text: "⚠️ Este comando solo es para grupos." });
        }

        // --- ENGAÑO ANTI-BAN (Simular que el bot está pensando/escribiendo) ---
        await sock.sendPresenceUpdate('composing', chat);
        await delay(Math.floor(Math.random() * 1000) + 500); // Delay humano aleatorio

        const groupMetadata = await sock.groupMetadata(chat);
        const participants = groupMetadata.participants.map(p => p.id);
        const mensajeFinal = args.join(" ") || "📩 Notificación para todos los miembros";

        // 2. ANIMACIÓN DE CARGA (Frames reducidos para evitar sospechas de spam)
        const barras = [
            "███░░░░░░░ 30%",
            "███████░░░ 70%",
            "██████████ 100%"
        ];

        const encabezado = `╔══════════════════════╗\n      🔵 *NOTIFICACIÓN GLOBAL* 🔵\n╚══════════════════════╝\n\n📨 *${mensajeFinal}*\n\n⏳ Cargando lista de miembros...`;

        // Enviamos el primer mensaje
        let msg = await sock.sendMessage(chat, { text: encabezado + "\n" + barras[0] }, { quoted: m });

        // Animación con tiempos desiguales (más natural)
        for (let i = 1; i < barras.length; i++) {
            await delay(Math.floor(Math.random() * 1000) + 800); 
            await sock.sendMessage(chat, {
                text: encabezado + "\n" + barras[i],
                edit: msg.key
            });
        }

        // 3. SELECCIÓN DE IMAGEN
        const todasImagenes = [...(IMAGENES.original || []), ...(IMAGENES.vip || []), ...(IMAGENES.general || [])];
        const imagenRandom = todasImagenes.length > 0 
            ? todasImagenes[Math.floor(Math.random() * todasImagenes.length)] 
            : "https://i.imgur.com/uRovL76.png"; 

        // 4. EL ENVÍO FINAL (Momento crítico para el Ban)
        // Simulamos una pausa antes del "Gran Mensaje"
        await sock.sendPresenceUpdate('recording', chat); // Cambiamos a 'grabando' para variar la huella digital
        await delay(1200);
        await sock.sendMessage(chat, { delete: msg.key }); // Borramos la carga

        // Enviamos el mensaje final que etiqueta a todos
        await sock.sendMessage(chat, {
            image: { url: imagenRandom },
            caption: `🔵 *ANUNCIO IMPORTANTE* 🔵\n\n📢 *MENSAJE:* ${mensajeFinal}\n\n🔔 *Atención:* @todos`,
            mentions: participants 
        }, { quoted: m });

        // Terminamos la presencia
        await sock.sendPresenceUpdate('paused', chat);

    } catch (e) {
        console.log("❌ Error en notify:", e);
        await sock.sendPresenceUpdate('paused', chat);
    }
}
