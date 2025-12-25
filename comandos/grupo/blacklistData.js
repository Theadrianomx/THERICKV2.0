// comandos/grupo/blacklistData.js

export let BLACKLIST = [];

// Agregar grupo a la blacklist
export function addBlacklist(id, name) {
    if (!BLACKLIST.find(g => g.id === id)) {
        BLACKLIST.push({ id, name });
    }
}

// Quitar grupo de la blacklist
export function removeBlacklist(id) {
    BLACKLIST = BLACKLIST.filter(g => g.id !== id);
}

// Obtener todos los grupos bloqueados
export function getBlacklist() {
    return BLACKLIST;
}

// Verificar si un grupo está bloqueado
export function isBlacklisted(id) {
    return BLACKLIST.some(g => g.id === id);
}