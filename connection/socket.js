// connection/socket.js
import makeWASocket, {
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore // Añadido para mejor rendimiento de llaves
} from "@whiskeysockets/baileys";
import pino from "pino";

export async function createSocket(state, saveCreds) {
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        // Cambiamos a un Browser ID más actual (Chrome 120+) para evitar sospechas
        browser: ["Windows", "Chrome", "122.0.6261.129"],
        
        auth: {
            creds: state.creds,
            // Usamos makeCacheableSignalKeyStore para que el bot no se trabe al procesar muchas llaves
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        
        // --- AJUSTES ANTI-BAN ---
        markOnlineOnConnect: true, // El bot se muestra en línea al conectar
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,    // No descarga todo el historial (evita actividad masiva sospechosa)
        printQRInTerminal: false,  // Ya lo manejas en index.js
        
        // Tiempo de espera para evitar desconexiones por lag
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        
        // Evita que el bot sea detectado por reintentos de mensajes fallidos
        msgRetryCounterCache: undefined 
    });

    // Guardar credenciales automáticamente
    sock.ev.on("creds.update", saveCreds);

    return sock;
}
