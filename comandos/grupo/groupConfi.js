import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'data', 'gruposConfig.json');

// Asegurar que la carpeta 'data' exista
if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
}

// --- FUNCIONES DE PERSISTENCIA ---
function cargarConfig() {
    try {
        if (!fs.existsSync(configPath)) return { blacklist: [], botStatus: {} };
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { blacklist: [], botStatus: {} };
    }
}

function guardarConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
        console.error("❌ Error al guardar configuración de grupos:", e);
    }
}

// ===== BLACKLIST (Persistente) =====
export function addBlacklist(chatId) {
    const config = cargarConfig();
    if (!config.blacklist.includes(chatId)) {
        config.blacklist.push(chatId);
        guardarConfig(config);
    }
}

export function removeBlacklist(chatId) {
    const config = cargarConfig();
    config.blacklist = config.blacklist.filter(id => id !== chatId);
    guardarConfig(config);
}

export function getBlacklist() {
    const config = cargarConfig();
    return config.blacklist;
}

export function isBlacklisted(chatId) {
    const config = cargarConfig();
    return config.blacklist.includes(chatId);
}

// ===== BOT ON / OFF (Persistente) =====
export function botOn(chatId) {
    const config = cargarConfig();
    config.botStatus[chatId] = true;
    guardarConfig(config);
}

export function botOff(chatId) {
    const config = cargarConfig();
    config.botStatus[chatId] = false;
    guardarConfig(config);
}

export function isBotActive(chatId) {
    const config = cargarConfig();
    // Por defecto el bot está ON (true) a menos que se apague manualmente
    return config.botStatus[chatId] !== undefined ? config.botStatus[chatId] : true;
}

// Alias para compatibilidad
export const isBotEnabled = isBotActive;
