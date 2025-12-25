import { useMultiFileAuthState } from "@whiskeysockets/baileys";

export async function getAuthState() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    return { state, saveCreds };
}