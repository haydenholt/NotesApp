const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKUP_PORT = 8001;
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Track last backup date
let lastBackupDate = null;

// Load last backup date if exists
const metaFile = path.join(BACKUP_DIR, 'backup-meta.json');
if (fs.existsSync(metaFile)) {
    try {
        const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        lastBackupDate = meta.lastBackupDate;
    } catch (err) {
        console.log('Could not read backup meta file, will create new one');
    }
}

function saveBackupMeta() {
    const meta = {
        lastBackupDate: lastBackupDate
    };
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
}

function shouldBackupToday() {
    const today = new Date().toISOString().split('T')[0];
    return lastBackupDate !== today;
}

function saveBackup(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    const backupData = {
        timestamp: new Date().toISOString(),
        data: data
    };
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    // Update last backup date
    lastBackupDate = new Date().toISOString().split('T')[0];
    saveBackupMeta();
    
    console.log(`✅ Backup saved: ${filename}`);
    return filename;
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/backup') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (shouldBackupToday()) {
                    const filename = saveBackup(data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Backup saved successfully',
                        filename: filename,
                        backed_up: true
                    }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Already backed up today',
                        backed_up: false
                    }));
                }
            } catch (err) {
                console.error('Backup error:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Invalid JSON data' 
                }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            lastBackupDate: lastBackupDate,
            shouldBackupToday: shouldBackupToday()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(BACKUP_PORT, () => {
    console.log(`📦 Backup server running on http://localhost:${BACKUP_PORT}`);
    console.log(`📁 Backups will be saved to: ${BACKUP_DIR}`);
    if (lastBackupDate) {
        console.log(`📅 Last backup: ${lastBackupDate}`);
    }
    if (shouldBackupToday()) {
        console.log(`⚠️  Backup needed today`);
    } else {
        console.log(`✅ Already backed up today`);
    }
});