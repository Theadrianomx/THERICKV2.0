export const consola = {
    inicio: (msg) => console.log(`[🚀] ${msg}`),
    ok: (msg) => console.log(`[✅] ${msg}`),
    error: (msg) => console.error(`[❌] ${msg}`),
    warn: (msg) => console.warn(`[⚠️] ${msg}`),
    log: (msg) => console.log(`[📝] ${msg}`) // <-- agregamos log
};