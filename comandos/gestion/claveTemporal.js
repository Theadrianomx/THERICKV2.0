import { withHeader, RG, MG, AG } from '../../utils/globalHeader.js';
import { enviarTexto } from '../gestion/constGlobal.js';

// Estructura para guardar la clave temporal (Key: senderNumber, Value: clave_otp)
const CLAVE_STORE = new Map();

/**
 * Genera una cadena al azar, un número OTP de 5 dígitos, y lo guarda para el remitente.
 * @param {string} senderNumber - Número del usuario (limpio, sin @s.whatsapp.net).
 */
export function generarClaveYGuardar(sock, m, senderNumber) {
    if (m.isGroup) {
        // Para mayor seguridad y discreción, solo permitir en DM.
        return enviarTexto(sock, m.key.remoteJid, withHeader(AG + "❌ Este comando solo funciona en tu chat privado con el bot."), { quoted: m });
    }
    
    // 1. Generar texto aleatorio y número OTP
    const palabras = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega', 'Epsilon', 'Zeta', 'Eta'];
    const palabraAzar = palabras[Math.floor(Math.random() * palabras.length)];
    const numAzar = Math.floor(Math.random() * 900) + 100; // Número de 3 dígitos (100-999)

    // Generar OTP de 5 dígitos (00000 a 99999)
    const otp = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    
    // 2. Guardar la clave en el store
    CLAVE_STORE.set(senderNumber, otp);

    // 3. Crear y enviar el mensaje
    const mensaje = withHeader(RG + 
        `🔑 *CLAVE TEMPORAL GENERADA* 🔑\n\n` +
        `Palabra clave: ${palabraAzar}${numAzar}\n` +
        `Número Secreto (OTP): *${otp}*\n\n` +
        `Esta clave es válida para un solo uso y caduca al usar el comando \`.spamearlink\`.\n` +
        `**Uso:** \`.spamearlink ${otp} <veces> <link>\``
    );

    return enviarTexto(sock, m.key.remoteJid, mensaje, { quoted: m });
}

/**
 * Verifica la clave, y si es correcta, la elimina del store.
 * @param {string} senderNumber - Número del usuario.
 * @param {string} claveIngresada - Clave proporcionada por el usuario.
 * @returns {boolean} True si la clave es válida y fue eliminada.
 */
export function verificarYConsumirClave(senderNumber, claveIngresada) {
    const claveGuardada = CLAVE_STORE.get(senderNumber);

    if (claveGuardada && claveGuardada === claveIngresada) {
        CLAVE_STORE.delete(senderNumber); // Consumir la clave
        return true;
    }
    return false;
}
