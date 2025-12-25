// Grupos donde el bot NO funciona en absoluto
export const BLACKLIST = new Set([
    // '1203630xxxx@g.us'
]);

export function addBlacklist(id) {
    BLACKLIST.add(id);
}

export function removeBlacklist(id) {
    BLACKLIST.delete(id);
}

export function isBlacklisted(id) {
    return BLACKLIST.has(id);
}