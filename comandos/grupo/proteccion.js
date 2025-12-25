export async function envioProtegido(sock, jid, texto) {
    try {
        await sock.sendMessage(jid, { text: texto });
        await new Promise(r => setTimeout(r, 800)); // Delay anti-baneo
    } catch (e) {
        console.log("❌ Error envío protegido:", e.message);
    }
}