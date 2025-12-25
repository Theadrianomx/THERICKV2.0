import { withHeader, RG } from '../../utils/globalHeader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function comandoGay(sock, m, args) {
    const from = m.key.remoteJid;
    
    try {
        // 1. RUTA ABSOLUTA EXACTA (Carpeta "Archivos" con A mayúscula)
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const audioPath = path.resolve(__dirname, 'Archivos', 'gay.mp3');

        // 2. IDENTIFICAR OBJETIVO
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!target) {
            return sock.sendMessage(from, { 
                text: withHeader(RG + "❌ ¡Radar fuera de rango! Menciona a alguien o responde a su mensaje.") 
            }, { quoted: m });
        }

        const userClean = target.split('@')[0];

        // --- ENGAÑO ANTI-BAN: Simular que el bot está escribiendo ---
        await sock.sendPresenceUpdate('composing', from);
        
        // 3. ANIMACIÓN DE ESCANEO (Para hacerlo más realista)
        const radarMsg = await sock.sendMessage(from, { text: `📡 *Iniciando escaneo de partículas...*` }, { quoted: m });
        await delay(1200);
        await sock.sendMessage(from, { text: `📡 *Analizando orientación magnética de @${userClean}...*`, edit: radarMsg.key, mentions: [target] });
        await delay(1200);

        // 4. VERIFICACIÓN FÍSICA DEL AUDIO
        if (!fs.existsSync(audioPath)) {
            await sock.sendMessage(from, { text: `⚠️ Error interno: El archivo 'gay.mp3' no existe en la carpeta 'Archivos'.`, edit: radarMsg.key });
            return;
        }

        // 5. RESULTADO FINAL
        await sock.sendMessage(from, { 
            text: `🏳️‍🌈 *¡RESULTADO POSITIVO!* 🏳️‍🌈\n\nEl sujeto @${userClean} ha superado los niveles permitidos de gaydad.`,
            edit: radarMsg.key,
            mentions: [target]
        });

        // --- ENGAÑO ANTI-BAN: Simular Grabación (Crucial para audios) ---
        await sock.sendPresenceUpdate('recording', from);
        await delay(2500); // Simulamos que el audio se está grabando/procesando

        // 6. ENVÍO DE NOTA DE VOZ (PTT)
        const audioBuffer = fs.readFileSync(audioPath);
        await sock.sendMessage(from, { 
            audio: audioBuffer, 
            mimetype: 'audio/mp4', 
            ptt: true 
        }, { quoted: m });

        await sock.sendPresenceUpdate('paused', from);

    } catch (err) {
        console.error("❌ Error en comando gay:", err);
        await sock.sendPresenceUpdate('paused', from);
    }
}
