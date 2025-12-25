// comandos/interaccion/vender.js
import { getUsuario, agregarXP, addItem } from '../data/usuarios.js';
import { enviarTexto } from '../gestion/constGlobal.js';

// --- TABLA DE PRECIOS (XP por cada unidad) ---
const PRECIOS = {
    hierro: 15,
    oro: 40,
    diamante: 120,
    esmeralda: 250
};

export async function vender(sock, m, args) {
    const from = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;
    const user = getUsuario(userId);
    const userNumber = userId.split('@')[0];

    // Si no pone argumentos, mostrar lista de precios
    if (args.length < 2) {
        let listaPrecios = `💰 *CENTRO DE COMERCIO*\n\n` +
            `Vende tus materiales para obtener XP:\n` +
            `⚙️ Hierro: ${PRECIOS.hierro} XP\n` +
            `✨ Oro: ${PRECIOS.oro} XP\n` +
            `💎 Diamante: ${PRECIOS.diamante} XP\n` +
            `💚 Esmeralda: ${PRECIOS.esmeralda} XP\n\n` +
            `*Uso:* .vender <material> <cantidad>\n` +
            `*Ejemplo:* .vender hierro 5\n` +
            `*O usa:* .vender todo (para vender todo tu inventario)`;
        return sock.sendMessage(from, { text: listaPrecios }, { quoted: m });
    }

    const material = args[0].toLowerCase();
    const cantidadStr = args[1].toLowerCase();

    try {
        // --- OPCIÓN: VENDER TODO ---
        if (material === 'todo' || cantidadStr === 'todo') {
            let gananciaTotal = 0;
            let reporte = `📋 *LIQUIDACIÓN TOTAL*\n\n`;

            for (const [mat, precio] of Object.entries(PRECIOS)) {
                const cantidadPerteneciente = user.inventario[mat] || 0;
                if (cantidadPerteneciente > 0) {
                    const ganancia = cantidadPerteneciente * precio;
                    gananciaTotal += ganancia;
                    addItem(userId, mat, -cantidadPerteneciente); // Quitar del inventario
                    reporte += `✅ ${mat.toUpperCase()}: ${cantidadPerteneciente} x ${precio} = ${ganancia} XP\n`;
                }
            }

            if (gananciaTotal === 0) {
                return enviarTexto(sock, from, "❌ No tienes nada que vender en tu inventario.", m);
            }

            agregarXP(userId, gananciaTotal);
            reporte += `\n💰 *Total Recibido:* ${gananciaTotal} XP`;
            return sock.sendMessage(from, { text: reporte }, { quoted: m });
        }

        // --- OPCIÓN: VENDER ESPECÍFICO ---
        if (!PRECIOS[material]) {
            return enviarTexto(sock, from, `❌ El material "${material}" no existe o no se puede vender.`, m);
        }

        const cantidadAVender = parseInt(cantidadStr);
        if (isNaN(cantidadAVender) || cantidadAVender <= 0) {
            return enviarTexto(sock, from, "❌ Por favor, ingresa una cantidad válida para vender.", m);
        }

        const stockActual = user.inventario[material] || 0;
        if (stockActual < cantidadAVender) {
            return enviarTexto(sock, from, `❌ No tienes suficientes ${material}. (Tienes: ${stockActual})`, m);
        }

        // Procesar Venta
        const gananciaFinal = cantidadAVender * PRECIOS[material];
        addItem(userId, material, -cantidadAVender); // Restamos
        agregarXP(userId, gananciaFinal); // Sumamos XP

        return sock.sendMessage(from, { 
            text: `✅ *VENTA EXITOSA*\n\n` +
                  `👤 @${userNumber}\n` +
                  `📦 Vendiste: ${cantidadAVender}x ${material.toUpperCase()}\n` +
                  `💰 Ganancia: +${gananciaFinal} XP\n` +
                  `📈 Balance Actual: ${user.experiencia} XP`,
            mentions: [userId]
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        enviarTexto(sock, from, "❌ Error al procesar la venta.");
    }
}
