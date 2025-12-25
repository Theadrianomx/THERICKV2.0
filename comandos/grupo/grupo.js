export default async function(sock, m, args) {
    try {
        if (!m.isGroup) return sock.sendMessage(m.key.remoteJid, { text: '❌ Este comando solo se puede usar en grupos.', quoted: m });

        const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
        const sender = m.key.participant || m.key.remoteJid;
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const isAdmins = groupMetadata.participants.find(p => p.id === sender)?.admin;
        const isBotAdmins = groupMetadata.participants.find(p => p.id === botNumber)?.admin;

        if (!isAdmins) return sock.sendMessage(m.key.remoteJid, { text: '❌ Solo los admins pueden usar este comando.', quoted: m });
        if (!isBotAdmins) return sock.sendMessage(m.key.remoteJid, { text: '❌ Necesito ser admin para configurar el grupo.', quoted: m });

        const opciones = {
            'abrir': 'not_announcement',
            'open': 'not_announcement',
            'cerrar': 'announcement',
            'close': 'announcement',
            'bloquear': 'locked',
            'desbloquear': 'unlocked'
        };

        const isClose = opciones[(args[0] || '').toLowerCase()];
        if (!isClose) return sock.sendMessage(m.key.remoteJid, { text: '*Seleccione una opción para configurar el grupo*\nEjemplo:\n.grupo abrir\n.grupo cerrar\n.grupo bloquear\n.grupo desbloquear', quoted: m });

        await sock.groupSettingUpdate(m.key.remoteJid, isClose);
        sock.sendMessage(m.key.remoteJid, { text: '> Grupo configurado correctamente', quoted: m });

    } catch(e) {
        console.error("❌ Error en grupo:", e);
    }
}