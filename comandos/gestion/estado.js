import { withHeader, RG } from '../../utils/globalHeader.js';
import { enviarImagen } from '../gestion/constGlobal.js';
import { cargarDB } from '../data/usuarios.js';
import os from 'os';

export async function consultarEstado(sock, m) {
    try {
        const from = m.key.remoteJid;
        const userId = m.key.participant || from;

        // --- CÁLCULOS TÉCNICOS ---
        const memoriaUsadaNode = process.memoryUsage().rss / 1024 / 1024; 
        const memoriaLibreSistema = os.freemem() / 1024 / 1024;
        
        const uptimeSeconds = process.uptime();
        const horas = Math.floor(uptimeSeconds / 3600);
        const minutos = Math.floor((uptimeSeconds % 3600) / 60);

        const latencia = Date.now() - (m.messageTimestamp * 1000);

        // --- CONTADOR DE USUARIOS ---
        const db = cargarDB();
        const totalUsuarios = Object.keys(db).length;

        // --- CONSTRUCCIÓN DEL TEXTO ---
        const textoEstado = withHeader(RG + 
            `📊 *ESTADO DEL SISTEMA - THE RICK V2*\n\n` +
            `🖼️ *Imagen:* Rick Prime Mod\n` +
            `👥 *Usuarios Registrados:* ${totalUsuarios}\n` +
            `⏱️ *Uptime:* ${horas}h ${minutos}m\n` +
            `🧠 *RAM del Bot:* ${memoriaUsadaNode.toFixed(2)} MB\n` +
            `📟 *RAM Libre:* ${memoriaLibreSistema.toFixed(2)} MB\n` +
            `📡 *Latencia:* ${latencia}ms\n\n` +
            `♻️ *Mantenimiento:* Autolimpieza activa\n` +
            `🟢 *Status:* Operativo`
        );

        // --- ENLACE DIRECTO DE LA IMAGEN ---
        const imagenUrl = 'https://i.postimg.cc/sXhcmf14/Rickprime.jpg';

        // Enviamos la imagen con el texto como caption
        await enviarImagen(
            sock, 
            from, 
            imagenUrl, 
            textoEstado, 
            "ESTADO TÉCNICO", 
            [userId], 
            m
        );

    } catch (err) {
        console.error("Error en comando estado:", err);
    }
}
