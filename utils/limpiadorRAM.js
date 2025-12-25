import { guardarDB } from '../comandos/data/usuarios.js';

export function iniciarLimpiador(sock) {
    // Intervalo de 30 minutos (1800000 ms)
    setInterval(async () => {
        console.log("🧹 [SISTEMA] Iniciando limpieza de mantenimiento...");

        try {
            // 1. Asegurar que los datos estén a salvo en el disco
            guardarDB();

            // 2. Limpiar caché de mensajes de Baileys (si usas multi-device)
            if (sock && sock.ev) {
                // Esto ayuda a liberar memoria de mensajes antiguos almacenados
                sock.ev.flush();
            }

            // 3. Forzar liberación de memoria RAM (Requiere --expose-gc)
            if (global.gc) {
                global.gc();
                const memoriaUsada = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log(`✅ [MEMORIA] RAM liberada. Uso actual: ${memoriaUsada.toFixed(2)} MB`);
            } else {
                console.log("⚠️ [MEMORIA] El recolector de basura no está expuesto. Usa --expose-gc");
            }

        } catch (err) {
            console.error("❌ Error en el limpiador:", err);
        }
    }, 1800000); 
}
