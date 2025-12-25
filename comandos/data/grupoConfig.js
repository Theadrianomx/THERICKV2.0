import fs from "fs";
const file = "./comandos/data/gruposActivos.json";

export function getEnabledGroups() {
    return fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file))
        : [];
}

export function addGroup(groupId) {
    const data = getEnabledGroups();
    if (!data.includes(groupId)) {
        data.push(groupId);
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }
}

export function removeGroup(groupId) {
    const data = getEnabledGroups().filter(id => id !== groupId);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}