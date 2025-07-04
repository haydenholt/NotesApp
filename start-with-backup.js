const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Timer Notes with backup...');

// Start backup server
const backupServer = spawn('node', ['backup-server.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

// Start static server
const staticServer = spawn('python3', ['-m', 'http.server', '8000'], {
    stdio: 'inherit',
    cwd: __dirname
});

console.log('📦 Backup server: http://localhost:8001');
console.log('🌐 Web app: http://localhost:8000');
console.log('');
console.log('Press Ctrl+C to stop both servers');

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backupServer.kill();
    staticServer.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    backupServer.kill();
    staticServer.kill();
    process.exit(0);
});

// Handle server exits
backupServer.on('exit', (code) => {
    if (code !== null && code !== 0) {
        console.error(`❌ Backup server exited with code ${code}`);
    }
});

staticServer.on('exit', (code) => {
    if (code !== null && code !== 0) {
        console.error(`❌ Static server exited with code ${code}`);
    }
});