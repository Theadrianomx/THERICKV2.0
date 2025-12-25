import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function start() {
    console.log('🚀 [SUPERVISOR] Iniciando THE RICK V2...');

    // Argumentos de optimización:
    // --expose-gc: Permite que el limpiador de RAM funcione
    // --max-old-space-size=2048: Asigna 2GB de RAM para evitar el error de memoria
    const args = [
        '--expose-gc',
        '--max-old-space-size=2048',
        path.join(__dirname, 'index.js')
    ];

    const child = spawn('node', args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    });

    child.on('exit', (code) => {
        console.error(`🔴 [SISTEMA] El bot se detuvo (Código: ${code}).`);
        
        // Si el código es 0, fue un cierre manual. Si no, reiniciamos.
        if (code !== 0) {
            console.log('🔄 [SISTEMA] Reiniciando en 5 segundos...');
            setTimeout(() => {
                start();
            }, 5000);
        }
    });

    child.on('error', (err) => {
        console.error('❌ [SISTEMA] Error en el proceso hijo:', err);
    });
}

// Iniciar el proceso por primera vez
start();
