// comandos/interaccion/top.js
import fs from 'fs';
import path from 'path';
import { withHeader, RG } from '../../utils/globalHeader.js';

const dbPath = path.join(process.cwd(), 'data', 'usuariosDB.json');

/**
 * Muestra el ranking de los mejores 10 usuarios del bot
 */
export async function comandoTop(sock, m) {
    const from = m.key.remoteJid;

    try {
        // 1. Verificar si existe la base de datos
        if (!fs.existsSync(dbPath)) {
            return sock.sendMessage(from, { text: "❌ Aún no hay registros de usuarios en la base de datos." }, { quoted: m });
        }

        // 2. Leer y parsear los datos
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        
        // 3. Convertir el objeto en un array y ordenar por Experiencia (XP)
        const usuariosOrdenados = Object.entries(db)
            .map(([id, data]) => ({
                id,
                experiencia: data.experiencia || 0,
                minados: data.minarDiario || 0
            }))
            .sort((a, b) => b.experiencia - a.experiencia) // De mayor a menor
            .slice(0, 10); // Solo los 10 mejores

        if (usuariosOrdenados.length === 0) {
            return sock.sendMessage(from, { text: "❌ Todavía no hay suficientes usuarios con experiencia." }, { quoted: m });
        }

        // 4. Construir el mensaje del Ranking
        let topTexto = `🏆 *RANKING TOP 10 - THE RICK V2* 🏆\n\n`;
        topTexto += `Los mineros con más prestigio del sistema:\n\n`;

        usuariosOrdenados.forEach((user, index) => {
            // Asignar medallas para el podio
            let medalla = '';
            if (index === 0) medalla = '🥇';
            else if (index === 1) medalla = '🥈';
            else if (index === 2) medalla = '🥉';
            else medalla = '👤';

            const numSencillo = user.id.split('@')[0];
            topTexto += `${medalla} *#${index + 1}* - @${numSencillo}\n`;
            topTexto += `   ╰─ ✨ XP: *${user.experiencia}* | ⛏️ Minados: *${user.minados}*\n\n`;
        });

        topTexto += `_¡Sigue minando y vendiendo para subir en el top!_`;

        // 5. Enviar mensaje con menciones para que los usuarios reciban la notificación
        const menciones = usuariosOrdenados.map(u => u.id);

        await sock.sendMessage(from, { 
            text: withHeader(RG + topTexto), 
            mentions: menciones 
        }, { quoted: m });

    } catch (err) {
        console.error("Error en comandoTop:", err);
        sock.sendMessage(from, { text: "❌ Error crítico al generar el ranking." }, { quoted: m });
    }
}
