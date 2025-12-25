// comandos/data/usuarios.js
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'usuariosDB.json');

// Asegurar que la carpeta 'data' exista
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

/** * EXPORTADAS: Ahora robar.js y otros archivos 
 * pueden leer y guardar directamente.
 */
export function cargarDB() {
    try {
        if (!fs.existsSync(dbPath)) return {};
        const data = fs.readFileSync(dbPath, 'utf-8');
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("❌ Error al cargar DB:", e);
        return {};
    }
}

export function guardarDB(db) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
        console.error("❌ Error al guardar DB:", e);
    }
}

// --- FUNCIONES DE GESTIÓN DE USUARIO ---

export function getUsuario(id) {
    const db = cargarDB();
    if (!db[id]) {
        // 🎁 REGALO DE BIENVENIDA: 100 XP
        db[id] = {
            experiencia: 100, 
            inventario: { hierro: 0, oro: 0, diamante: 0, esmeralda: 0 },
            minarDiario: 0,
            minarSeguido: 0,
            lastReset: new Date().toDateString(),
            statsRobo: { fecha: new Date().toDateString(), usos: 0, lastUse: 0 } // Para el comando .robar
        };
        guardarDB(db);
    }
    return db[id];
}

export function agregarXP(id, xp) {
    const db = cargarDB();
    if (!db[id]) getUsuario(id); 
    db[id].experiencia = (db[id].experiencia || 0) + xp;
    // Evitar XP negativa (Opcional pero recomendado para economía sana)
    if (db[id].experiencia < 0) db[id].experiencia = 0;
    guardarDB(db);
}

export function addItem(id, item, cantidad = 1) {
    const db = cargarDB();
    if (!db[id]) getUsuario(id);
    if (!db[id].inventario) db[id].inventario = {};
    db[id].inventario[item] = (db[id].inventario[item] || 0) + cantidad;
    guardarDB(db);
}

export function incrementMinar(id) {
    const db = cargarDB();
    if (!db[id]) getUsuario(id);
    db[id].minarDiario = (db[id].minarDiario || 0) + 1;
    db[id].minarSeguido = (db[id].minarSeguido || 0) + 1;
    guardarDB(db);
}

export function resetSeguidos(id) {
    const db = cargarDB();
    if (db[id]) {
        db[id].minarSeguido = 0;
        guardarDB(db);
    }
}

export function resetMinadosDiariosIfNeeded(id) {
    const db = cargarDB();
    const hoy = new Date().toDateString();
    if (db[id] && db[id].lastReset !== hoy) {
        db[id].minarDiario = 0;
        db[id].lastReset = hoy;
        guardarDB(db);
    }
}
