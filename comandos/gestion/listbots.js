import { withHeader, RG } from '../../utils/globalHeader.js';
import { subBotsActivos } from './jadibot.js';

export async function listarSubBots(sock, m) {
    const from = m.key.remoteJid;
    const bots = Object.keys(subBotsActivos);

    if (bots.length === 0) {
        return sock.sendMessage(from, { text: withHeader(RG + "⚠️ No hay Sub-Bots activos en este momento.") }, { quoted: m });
    }

    let texto = `🤖 *SUB-BOTS CONECTADOS*\n\n`;
    bots.forEach((id, i) => {
        const uptime = Math.floor((Date.now() - subBotsActivos[id].uptime) / 60000);
        texto += `*${i + 1}.* @${id}\n`;
        texto += `   └ Activo hace: ${uptime} min\n\n`;
    });

    texto += `_Usa .stopbot para apagar tu instancia._`;

    return sock.sendMessage(from, { 
        text: withHeader(RG + texto), 
        mentions: bots.map(id => id + '@s.whatsapp.net') 
    }, { quoted: m });
}
