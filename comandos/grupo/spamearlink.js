import { verificarYConsumirClave } from '../gestion/claveTemporal.js'; 
import { withHeader, RG, MG, FG, AG } from '../../utils/globalHeader.js'; 

// Importaciones con try-catch interno por si fallan las rutas
import { envioProtegido } from "./proteccion.js"; 
import { isBlacklisted } from "./groupConfi.js"; 

export default {
    command: "spamearlink",
    async run(sock, msg, args) {
        // 1. Obtención segura de datos
        const from = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderJid ? senderJid.split('@')[0].split(':')[0] : null;

        if (!senderNumber) return; // Evita crash si no detecta remitente

        const [clave_ingresada, vecesRaw, link] = args;
        
        // 2. Guía de uso (Return educativo)
        if (!clave_ingresada || !vecesRaw || !link) {
            return sock.sendMessage(from, {
                text: withHeader(AG + 
                    "⚠️ *INSTRUCCIONES DE SPAM*\n\n" +
                    "1️⃣ Obtén tu clave en privado con *.getkey*\n" +
                    "2️⃣ Usa: `.spamearlink <clave> <veces> <link>`\n" +
                    "Ejemplo: `.spamearlink 12345 5 https://bit.ly/bot`"
                )
            }, { quoted: msg });
        }

        // 3. Validación de Clave
        if (!verificarYConsumirClave(senderNumber, clave_ingresada)) {
            return sock.sendMessage(from, {
                text: withHeader(FG + "❌ Clave inválida o ya usada. Pide otra con *.getkey*")
            }, { quoted: msg });
        }

        // 4. Limpieza de variables
        let veces = parseInt(vecesRaw) || 1;
        if (veces > 10) veces = 10; // Límite para evitar baneo

        try {
            // Obtener grupos (Añadimos validación para que no crashee si no hay grupos)
            const todosGrupos = await sock.groupFetchAllParticipating().catch(() => ({}));
            const ids = Object.keys(todosGrupos).filter(id => id !== from && !isBlacklisted(id));

            if (ids.length === 0) {
                return sock.sendMessage(from, { text: withHeader(AG + "⚠️ No hay grupos destino disponibles.") });
            }

            const barras = ["█░░░░░░", "██░░░░", "███░░░", "████░░", "█████░", "██████"];
            let encabezado = withHeader(`🔵 *SPAM GLOBAL*\n\n📨 *Link:* ${link}\n📦 *Grupos:* ${ids.length}\n⏳ *Enviando...*`);
            
            let msgBarra = await sock.sendMessage(from, { text: encabezado + "\n" + barras[0] }, { quoted: msg });

            // 5. Bucle de envío con Try-Catch individual
            let enviados = 0;
            const total = ids.length * veces;

            for (const id of ids) {
                try {
                    for (let j = 0; j < veces; j++) {
                        // Usamos envioProtegido pero con fallback por si falla
                        if (typeof envioProtegido === 'function') {
                            await envioProtegido(sock, id, `🚀 SPAM\n${link}`);
                        } else {
                            await sock.sendMessage(id, { text: link });
                        }
                        
                        enviados++;
                        // Actualizar barra cada cierto tiempo para no saturar
                        if (enviados % 2 === 0 || enviados === total) {
                            const prog = Math.floor((enviados / total) * 5);
                            await sock.sendMessage(from, {
                                edit: msgBarra.key,
                                text: encabezado + "\n" + (barras[prog] || barras[5]) + ` ${Math.floor((enviados/total)*100)}%`
                            }).catch(() => null);
                        }
                        await new Promise(r => setTimeout(r, 800)); // Delay preventivo
                    }
                } catch (groupErr) {
                    console.error(`Error en grupo ${id}:`, groupErr.message);
                    continue; // Si falla un grupo, sigue con el siguiente
                }
            }

            await sock.sendMessage(from, {
                edit: msgBarra.key,
                text: withHeader(RG + "✅ *SPAM FINALIZADO*\n\nTodo enviado correctamente.")
            });

        } catch (e) {
            console.error("❌ Error Crítico en spamearlink:", e);
            sock.sendMessage(from, { text: "❌ El comando sufrió un error interno." });
        }
    }
};
